var ZoteroFileManager = {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	addedGlobals: new Set()
};

function install() {
}

function uninstall() {
}

function startup({ id, version, rootURI }) {
	ZoteroFileManager.id = id;
	ZoteroFileManager.version = version;
	ZoteroFileManager.rootURI = rootURI;
	
	Services.scriptloader.loadSubScript(rootURI + 'content/file_manager.js');
	
	ZoteroFileManager.Logic.init();
}

function shutdown() {
	ZoteroFileManager.Logic.shutdown();
	
	var globals = Array.from(ZoteroFileManager.addedGlobals);
	for (let i = 0; i < globals.length; i++) {
		delete window[globals[i]];
	}
}
