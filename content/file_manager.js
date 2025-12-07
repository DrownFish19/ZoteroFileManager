if (!ZoteroFileManager.Logic) {
    ZoteroFileManager.Logic = {
        init: function () {
            this.addMenuItem();
        },

        shutdown: function () {
            let win = Zotero.getMainWindow();
            let doc = win.document;
            let menuitem = doc.getElementById('zotero-file-manager-menu');
            if (menuitem) menuitem.remove();
        },

        addMenuItem: function () {
            let win = Zotero.getMainWindow();
            let doc = win.document;
            let menupopup = doc.getElementById('menu_ToolsPopup');
            
            if (menupopup) {
                if (doc.getElementById('zotero-file-manager-menu')) return;

                let menuitem;
                if (doc.createXULElement) {
                    menuitem = doc.createXULElement('menuitem');
                } else {
                    menuitem = doc.createElement('menuitem');
                }
                
                menuitem.id = 'zotero-file-manager-menu';
                menuitem.setAttribute('label', 'File Manager: Scan Duplicates & Missing');
                menuitem.addEventListener('command', () => {
                    this.runScan();
                });
                menupopup.appendChild(menuitem);
            }
        },

        runScan: async function () {
            Zotero.showZoteroPaneProgressMeter("Scanning Library...");
            
            try {
                await this.checkMissingLinks();
                await this.checkDuplicates();
            } catch (e) {
                Zotero.alert(null, "Error", e.toString());
                console.error(e);
            } finally {
                Zotero.hideZoteroPaneProgressMeter();
            }
        },

        checkMissingLinks: async function () {
            let s = new Zotero.Search();
            s.addCondition('linkMode', 'is', 'linked_file');
            s.addCondition('itemType', 'is', 'attachment');
            let ids = await s.search();
            
            let missingItems = [];

            for (let id of ids) {
                let item = await Zotero.Items.getAsync(id);
                let path = await item.getFilePathAsync();
                
                if (!path || !(await IOUtils.exists(path))) {
                    missingItems.push(item);
                }
            }

            if (missingItems.length > 0) {
                let report = `Found ${missingItems.length} missing linked files.\nTagging them with 'available:missing'...`;
                
                await Zotero.DB.executeTransaction(async function () {
                    for (let item of missingItems) {
                        item.addTag('available:missing');
                        await item.saveTx();
                    }
                });
                
                Zotero.alert(null, "Missing Links Found", report);
            }
        },

        checkDuplicates: async function () {
            let s = new Zotero.Search();
            s.addCondition('itemType', 'is', 'attachment');
            s.addCondition('contentType', 'is', 'application/pdf'); 
            let ids = await s.search();

            let hashMap = {};
            let count = 0;

            for (let id of ids) {
                count++;
                if (count % 50 === 0) {
                    Zotero.updateZoteroPaneProgressMeter((count / ids.length) * 100);
                }

                let item = await Zotero.Items.getAsync(id);
                let path = await item.getFilePathAsync();

                if (path && (await IOUtils.exists(path))) {
                    try {
                        let stat = await IOUtils.stat(path);
                        let fingerprint = `${stat.size}-${item.attachmentFilename}`; 

                        if (!hashMap[fingerprint]) {
                            hashMap[fingerprint] = [];
                        }
                        hashMap[fingerprint].push(item);
                    } catch (e) {
                        console.error("Error checking file: " + path, e);
                    }
                }
            }

            let duplicates = Object.values(hashMap).filter(list => list.length > 1);
            
            if (duplicates.length > 0) {
                let shouldMerge = Zotero.confirm(
                    null, 
                    "Duplicates Found", 
                    `Found ${duplicates.length} sets of duplicate files.\nDo you want to attempt to merge parent items?`
                );

                if (shouldMerge) {
                    await this.mergeDuplicateParents(duplicates);
                }
            } else {
                Zotero.alert(null, "Check Complete", "No duplicate files found.");
            }
        },

        mergeDuplicateParents: async function (duplicateAttachmentsGroups) {
            let mergeCount = 0;

            await Zotero.DB.executeTransaction(async function () {
                for (let group of duplicateAttachmentsGroups) {
                    let parentIds = new Set();
                    let parents = [];

                    for (let att of group) {
                        let pid = att.parentID;
                        if (pid) {
                            if (!parentIds.has(pid)) {
                                parentIds.add(pid);
                                parents.push(await Zotero.Items.getAsync(pid));
                            }
                        }
                    }

                    if (parents.length > 1) {
                        let masterItem = parents[0];
                        let otherItems = parents.slice(1);
                        
                        try {
                            await Zotero.Items.merge(masterItem, otherItems);
                            mergeCount++;
                        } catch (e) {
                            Zotero.logError("Merge failed: " + e);
                        }
                    }
                }
            });

            Zotero.alert(null, "Merge Complete", `Merged ${mergeCount} duplicate item sets.`);
        }
    };
}
