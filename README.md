# Lightning Bolt Bug Zapper

Chrome extension for capturing error messages and code schemas from Bolt.new, then leveraging powerful LLMs (Claude, Gemini) to generate fixes.

## Features

- Dark-themed modern UI
- Quick error capturing from bolt.new

## Installation

1. Download the `lightning-bolt-fixed-final.zip` file
2. Go to chrome://extensions/
3. Enable "Developer mode" (toggle in top-right)
4. Drag and drop the ZIP file onto the extensions page

## Development

To rebuild the extension:

```bash
./build.sh
```

This will copy all necessary files to the dist directory and create a new ZIP file.
