#!/bin/bash
set -e

echo "Building Lightning Bolt Bug Zapper..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build React files with Vite
echo "Building React components..."
npx vite build

# Copy manifest and other files to dist
echo "Copying files to dist..."
mkdir -p dist
cp manifest.json dist/
cp background.js dist/
cp simple-content.js dist/content.js
cp options.html dist/
cp options.js dist/
cp popup-react.html dist/
cp supabase-bundle.js dist/
cp error-location-parser.js dist/

# Ensure correct path for JS files
if [ -f "dist/popup.js" ]; then
  echo "Using Vite-generated popup.js"
else
  echo "Warning: popup.js not found, copying and renaming popup-react.jsx"
  cp popup-react.jsx dist/popup.js
fi

# Copy Supabase client
cp supabaseClient.ts dist/

# Copy assets
cp splash-image.png dist/
cp popup.css dist/
cp popup.html dist/

# Copy icon files
mkdir -p dist/icons
cp -r icons/* dist/icons/ 2>/dev/null || echo "No icons directory found"

# Create test page for browser testing
cp test-popup.html dist/

# Zip the extension
echo "Creating zip package..."
cd dist
zip -r ../lightning-bolt-bug-zapper.zip *
cd ..

echo "Build complete!"
