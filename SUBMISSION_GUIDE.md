# Chrome Web Store Submission Guide

## Overview
This guide outlines the process for submitting the Lightning Bolt Bug Zapper extension to the Chrome Web Store, including setting up payments and preparing all required assets.

## Prerequisites
- Google Developer account
- Chrome Web Store Developer Dashboard access
- $5 one-time registration fee paid
- All extension code and assets ready for submission

## Step 1: Prepare Your Extension

### Build the Extension
1. Run the production build command:
   ```
   npm run build
   ```
2. Verify the `dist` directory contains all necessary files
3. Test the built extension locally before submission

### Create a ZIP File
1. Navigate to the `dist` directory
2. Select all files and create a ZIP archive
3. Ensure the ZIP file is smaller than 10MB (Chrome Web Store limit)

## Step 2: Prepare Store Listing Assets

### Required Assets
1. **Extension Icon**
   - Sizes: 16x16, 48x48, 128x128 pixels
   - Format: PNG with transparency
   - Already included in the `public/icons` directory

2. **Screenshots**
   - At least one screenshot (1280x800 or 640x400 pixels)
   - Maximum of 5 screenshots
   - Show the main features of the extension
   - Suggested screenshots:
     - Main popup interface
     - Error selection in action
     - Generated fix result
     - API key configuration

3. **Promotional Images**
   - Small promotional tile: 440x280 pixels
   - Large promotional tile: 920x680 pixels (optional)
   - Marquee promotional tile: 1400x560 pixels (optional)

4. **Description**
   - Short description (up to 132 characters)
   - Detailed description (up to 16,000 characters)
   - Include key features, benefits, and usage instructions

### Sample Description

**Short Description:**
```
Capture error messages and code from Bolt.new, then generate AI-powered fixes with minimal clicks.
```

**Detailed Description:**
```
# Lightning Bolt Bug Zapper

Quickly capture error messages and code schemas from Bolt.new, then leverage powerful LLMs to generate fixes with minimal clicks.

## Key Features

- **Element Selection UI**: Click directly on error messages and code blocks to capture them without manual copying
- **Streamlined Workflow**: Simple popup interface guides users through the entire error fixing process
- **Background Processing**: Service worker handles API calls to selected LLM using securely stored API keys
- **Minimal Interaction**: Eliminates manual screenshots, copying/pasting, and prompt writing

## How It Works

1. Click the extension icon when you encounter an error in Bolt.new
2. Use the selection tools to capture the error message and code
3. Choose your preferred LLM provider (Claude 3.7 or Gemini 2.5)
4. Generate a fix with a single click
5. Review, edit if needed, and copy the corrected code to your clipboard

## API Key Requirements

This extension requires your own API keys for the LLM services:
- Claude API key from Anthropic (https://console.anthropic.com)
- Gemini API key from Google AI Studio (https://ai.google.dev)

Your API keys are stored securely in Chrome storage and are never sent to our servers.

## Privacy & Security

- All processing happens locally in your browser
- API keys are stored securely in Chrome storage
- No user data is collected or transmitted except to the LLM providers you configure
- The extension only activates on Bolt.new domains

## Support

For questions, feature requests, or bug reports, please visit our support page or contact us at support@example.com.
```

## Step 3: Configure Store Listing

1. Log in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New item" and upload your ZIP file
3. Fill in the store listing information:
   - Product details
   - Category (Developer Tools)
   - Language
   - Screenshots and promotional images
   - Description

4. Set up additional details:
   - Privacy practices
   - Website URL
   - Support URL
   - Contact email

## Step 4: Set Up Payments

1. In the Developer Dashboard, select your extension
2. Navigate to the "Payments" tab
3. Click "Set up payments" and follow the instructions
4. Configure your payment account:
   - Tax information
   - Bank account details
   - Payment processor agreement

5. Create a payment item:
   - Set the price (recommended: $4.99 - $9.99)
   - Choose between one-time payment or subscription
   - Add a description of what users get with the purchase

6. Configure the license API:
   - Enable the Chrome Web Store API
   - Note your OAuth client ID for use in the extension
   - Update the manifest.json with the correct client ID

## Step 5: Submit for Review

1. Review all information for accuracy
2. Check the visibility options:
   - Public: Visible to all Chrome Web Store users
   - Unlisted: Accessible only via direct link
   - Private: Limited to specific users you designate

3. Click "Submit for review"
4. Wait for the review process (typically 1-3 business days)

## Step 6: Post-Submission

1. Monitor the review status in the Developer Dashboard
2. Address any issues raised by the review team
3. Once approved, your extension will be published to the Chrome Web Store
4. Test the payment flow in the live environment

## Important Notes

- The Chrome Web Store takes a 5% transaction fee
- Reviews typically take 1-3 business days but can take longer
- Make sure your extension complies with all [Chrome Web Store policies](https://developer.chrome.com/docs/webstore/program-policies/)
- Keep your manifest.json permissions to the minimum required
- Ensure your privacy policy accurately reflects data handling practices

## Useful Links

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Chrome Web Store Payments](https://developer.chrome.com/docs/webstore/money/)
- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
