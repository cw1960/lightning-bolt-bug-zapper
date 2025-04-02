# Lightning Bolt Bug Zapper - Testing Guide

## Overview
This guide outlines the testing procedures for the Lightning Bolt Bug Zapper Chrome extension, focusing on the new payment flow using the Chrome Web Store's payment API.

## Prerequisites
- Chrome browser installed
- Developer mode enabled in Chrome extensions
- Access to the Chrome Web Store Developer Dashboard

## Local Testing

### 1. Load the Extension Locally

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked" and select the extension's `dist` directory
4. Verify the extension appears in your extensions list

### 2. Test Basic Functionality

1. Navigate to [bolt.new](https://bolt.new)
2. Click the extension icon to open the popup
3. Test the error selection functionality:
   - Click "Select Error Message"
   - Click on an error message on the page
   - Verify the error is captured correctly
4. Test the code selection functionality:
   - Click "Select Code Block"
   - Click on a code block on the page
   - Verify the code is captured correctly
5. Test the LLM selection:
   - Toggle between Claude and Gemini
   - Verify the selection is saved

### 3. Test API Key Configuration

1. Open the extension options page
2. Enter test API keys for Claude and/or Gemini
3. Save the configuration
4. Verify the keys are stored correctly
5. Restart the extension and verify the keys are loaded

### 4. Test License Verification

1. Open the extension popup
2. Verify the "Free Trial Mode" banner is displayed
3. Click the "Upgrade" button
4. Verify it attempts to redirect to the Chrome Web Store

## Chrome Web Store Payment Testing

### 1. Create a Test Item

1. Log in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Create a new item or use an existing one
3. Set up a one-time payment or subscription
4. Configure the price and description

### 2. Test Purchase Flow

1. Create a test account in the Chrome Web Store
2. Install the extension from the store
3. Click the "Upgrade" button in the extension
4. Complete the purchase flow
5. Verify the license is activated in the extension

### 3. Test License Verification

1. After purchase, restart the extension
2. Verify the "Free Trial Mode" banner is replaced with a "Pro" indicator
3. Verify all premium features are unlocked
4. Test the "Generate Fix" functionality with the premium license

## Troubleshooting

### Common Issues

1. **API Keys Not Saving**
   - Check browser console for errors
   - Verify permissions in manifest.json
   - Clear extension storage and try again

2. **License Not Activating**
   - Check browser console for license verification errors
   - Verify OAuth2 configuration in manifest.json
   - Check Chrome identity permissions

3. **Selection Mode Not Working**
   - Verify content script is loaded on bolt.new
   - Check for console errors in the content script
   - Verify host permissions in manifest.json

## Submission Checklist

- [ ] Extension icon in all required sizes (16x16, 48x48, 128x128)
- [ ] Detailed description and feature list
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] At least one screenshot of the extension in use
- [ ] Promotional tile image (440x280px)
- [ ] Verified manifest.json with correct permissions
- [ ] Tested all functionality on Chrome stable channel
- [ ] Verified payment flow works correctly

## Notes

- The Chrome Web Store takes 5% of the purchase price as a transaction fee
- License verification may take up to 24 hours to propagate to all users
- Make sure to test on multiple Chrome versions to ensure compatibility
