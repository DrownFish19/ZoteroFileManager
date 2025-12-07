#!/bin/bash

# Zotero Plugin Build Script
PLUGIN_NAME="zotero-file-manager"
FILES="manifest.json bootstrap.js content icon.png"

# Remove old build
rm -f ${PLUGIN_NAME}.xpi

# Create new build
zip -r ${PLUGIN_NAME}.xpi $FILES

echo "Build created: ${PLUGIN_NAME}.xpi"

