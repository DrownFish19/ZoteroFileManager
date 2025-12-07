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
            // Zotero 7 has a new progress meter API, trying to be compatible or use a simpler approach
            let progressWin = new Zotero.ProgressWindow();
            progressWin.changeHeadline("Scanning Library...");
            progressWin.show();
            let progressItem = new progressWin.ItemProgress("icon-wait", "Checking files...");
            
            try {
                await this.checkMissingLinks();
                await this.checkDuplicates(progressItem);
                progressItem.setText("Scan complete.");
                // progressItem.setIcon("icon-ok"); // Method not available
                progressWin.startCloseTimer(3000);
            } catch (e) {
                // progressItem.setError(); // Method might not be available
                progressItem.setText("Error: " + e.toString());
                let win = Zotero.getMainWindow();
                Services.prompt.alert(win, "Error", e.toString());
                console.error(e);
            }
        },

        checkMissingLinks: async function () {
            let s = new Zotero.Search();
            s.addCondition('itemType', 'is', 'attachment');
            let ids = await s.search();
            
            let missingItems = [];

            for (let id of ids) {
                let item = await Zotero.Items.getAsync(id);
                
                // Check if item is a linked file
                // Zotero.Attachments.LINK_MODE_LINKED_FILE = 2
                // In Zotero 7, attachmentLinkMode is a getter on the item object
                if (item.attachmentLinkMode === Zotero.Attachments.LINK_MODE_LINKED_FILE) {
                     let path = await item.getFilePathAsync();
                     if (!path || !(await IOUtils.exists(path))) {
                        missingItems.push(item);
                    } else {
                        // If file exists but has 'zotero_file_manager:missing' tag, remove it
                        if (item.hasTag('zotero_file_manager:missing')) {
                            item.removeTag('zotero_file_manager:missing');
                            await item.saveTx();
                        }
                    }
                }
            }

            if (missingItems.length > 0) {
                let report = `Found ${missingItems.length} missing linked files.\nTagging them with 'zotero_file_manager:missing'...`;
                
                // Remove large transaction to avoid timeouts
                for (let item of missingItems) {
                    item.addTag('zotero_file_manager:missing');
                    await item.saveTx();
                }
                
                let win = Zotero.getMainWindow();
                Services.prompt.alert(win, "Missing Links Found", report);
            }
        },

        checkDuplicates: async function (progressItem) {
            let s = new Zotero.Search();
            s.addCondition('itemType', 'is', 'attachment');
            let ids = await s.search();

            let hashMap = {};
            let count = 0;

            for (let id of ids) {
                count++;
                if (count % 50 === 0 && progressItem) {
                     progressItem.setText(`Checking file ${count} / ${ids.length}...`);
                     progressItem.setProgress((count / ids.length) * 100);
                     // Allow UI updates
                     await new Promise(resolve => setTimeout(resolve, 0));
                }

                let item = await Zotero.Items.getAsync(id);
                
                // Only check PDFs and HTML files, or remove this check to check all files
                // if (item.attachmentContentType !== 'application/pdf') continue;
                
                // Check and remove stale 'zotero_file_manager:duplicate' tag if it exists
                // We will re-add it later if it's still a duplicate
                if (item.hasTag('zotero_file_manager:duplicate')) {
                    item.removeTag('zotero_file_manager:duplicate');
                    await item.saveTx();
                }

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
                let markedCount = 0;
                
                for (let group of duplicates) {
                    // Sort by date added, keep the oldest one safe, tag others
                    group.sort((a, b) => {
                        if (a.dateAdded < b.dateAdded) return -1;
                        if (a.dateAdded > b.dateAdded) return 1;
                        return 0;
                    });
                    
                    // Skip the first one (oldest), mark the rest
                    for (let i = 1; i < group.length; i++) {
                        let item = group[i];
                        if (!item.hasTag('zotero_file_manager:duplicate')) {
                            item.addTag('zotero_file_manager:duplicate');
                            await item.saveTx();
                            markedCount++;
                        }
                    }
                }

                let win = Zotero.getMainWindow();
                Services.prompt.alert(
                    win, 
                    "Duplicates Found", 
                    `Found ${duplicates.length} sets of duplicate files.\nMarked ${markedCount} items with 'zotero_file_manager:duplicate' tag.\nPlease review and process them manually.`
                );
            } else {
                let win = Zotero.getMainWindow();
                Services.prompt.alert(win, "Check Complete", "No duplicate files found.");
            }
        }
    };
}
