# Zotero File Manager

A Zotero 7 plugin designed to help manage your library's attachments.

## Features

1.  **Find Missing Linked Files**: Scans all linked attachments (`attachments:`) and verifies if the file actually exists on disk. Missing files are tagged with `available:missing` for easy filtering.
2.  **Find Duplicate Files**: Scans PDF attachments and identifies duplicates based on file size and filename.
3.  **Merge Duplicates**: Automatically merges parent items that contain duplicate attachments, keeping your library clean.

## Installation

1.  Download the latest `.xpi` release.
2.  In Zotero 7, go to **Tools** -> **Add-ons**.
3.  Click the gear icon and select **Install Add-on From File...**.
4.  Select the `.xpi` file.

## Usage

1.  Go to **Tools** -> **File Manager: Scan Duplicates & Missing**.
2.  The plugin will start scanning your library. This may take a while for large libraries.
3.  Follow the prompts to merge duplicates if found.

## Development

### Build

Run the build script to create the `.xpi` file:

```bash
./build.sh
```

### Requirements

- Zotero 7 (Beta) or later.

## License

MIT License

