# Zotero File Manager

A Zotero 7 plugin designed to help manage your library's attachments.

## Features

1.  **Find Missing Linked Files**: Scans all linked attachments and verifies if the file actually exists on disk. 
    -   Missing files are tagged with `zotero_file_manager:missing` for easy filtering.
    -   If a missing file is restored, the tag is automatically removed upon the next scan.

2.  **Find Duplicate Files**: Scans all attachments (PDFs, HTML, etc.) and identifies duplicates based on file size and filename.
    -   Duplicate files are tagged with `zotero_file_manager:duplicate`.
    -   The oldest version of the file is kept safe (untagged), while newer duplicates are marked.
    -   You can easily search for this tag and decide which files to delete.

## Installation

1.  Download the latest `.xpi` release from the [Releases page](https://github.com/drownfish19/ZoteroFileManager/releases).
2.  In Zotero 7, go to **Tools** -> **Extensions**.
3.  Click the gear icon and select **Install Add-on From File...**.
4.  Select the `.xpi` file.

## Usage

1.  Go to **Tools** -> **File Manager: Scan Duplicates & Missing**.
2.  The plugin will start scanning your library. A progress window will show the status.
3.  Once completed, a summary will be displayed showing how many missing or duplicate files were found and tagged.
4.  **To manage missing files**: Search for the tag `zotero_file_manager:missing` in the bottom-left tag selector.
5.  **To manage duplicates**: Search for the tag `zotero_file_manager:duplicate`. Review the tagged items and delete them if necessary.

## Development

### Build

Run the build script to create the `.xpi` file:

```bash
./build.sh
```

### Requirements

- Zotero 7.

## License

MIT License
