#!/bin/bash

# Set error handling
set -e

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

# Copy manifest.json and other static files not handled by Vite
echo "Copying additional files..."
cp manifest.json dist/
cp -r icons dist/
cp background.js dist/
cp content.js dist/
cp options.html dist/
cp options.js dist/
cp splash-image.png dist/

echo "Build completed! The extension is ready in the ./dist directory."
echo "To install in Chrome:"
echo "1. Go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked'"
echo "4. Select the ./dist directory" 