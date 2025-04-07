// Error location parser for Lightning Bolt Bug Zapper
// This file adds functionality to detect file paths and line numbers in error messages

// Function to extract file path and line info from error messages
function extractFileInfo(errorMessage) {
  if (!errorMessage) return null;
  
  // Common patterns in React/web errors
  const patterns = [
    // React error pattern: at App (path/to/file.tsx:19:24)
    /at\s+(\w+)\s+\((https?:\/\/[^)]+\/([^:)]+):(\d+):(\d+))\)/,
    // General web error with file and line
    /(https?:\/\/[^:)]+\/([^:)]+)):(\d+):(\d+)/,
    // Node.js style: path/to/file.js:19:24
    /([^:\s]+\.(js|jsx|ts|tsx)):(\d+):(\d+)/,
    // In component pattern: in Component (at path/to/file.tsx:19:24)
    /in\s+(\w+)[^(]*\(at\s+(https?:\/\/[^)]+\/([^:)]+):(\d+):(\d+))\)/
  ];
  
  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        // React component pattern
        return {
          component: match[1],
          fullPath: match[2],
          file: match[3],
          line: match[4],
          column: match[5]
        };
      } else if (pattern === patterns[1]) {
        // URL pattern
        return {
          fullPath: match[1],
          file: match[2],
          line: match[3],
          column: match[4]
        };
      } else if (pattern === patterns[2]) {
        // Simple file pattern
        return {
          file: match[1],
          line: match[3],
          column: match[4]
        };
      } else if (pattern === patterns[3]) {
        // "in Component" pattern
        return {
          component: match[1],
          fullPath: match[2],
          file: match[3],
          line: match[4],
          column: match[5]
        };
      }
    }
  }
  
  return null;
}

// Function to create a user-friendly guidance message based on file info
function createGuidanceMessage(fileInfo) {
  if (!fileInfo) return "";
  
  let message = `<div class="file-guidance">`;
  message += `<strong>📂 Error Location Detected:</strong><br>`;
  
  if (fileInfo.component) {
    message += `Error in <code>&lt;${fileInfo.component}&gt;</code> component<br>`;
  }
  
  message += `File: <code>${fileInfo.file}</code><br>`;
  message += `Line: <code>${fileInfo.line}</code>, Column: <code>${fileInfo.column}</code><br>`;
  
  message += `<div class="guidance-steps">`;
  message += `<strong>To fix this error:</strong>`;
  message += `<ol>`;
  message += `<li>Navigate to the <code>${fileInfo.file}</code> file in your code editor</li>`;
  message += `<li>Look at line ${fileInfo.line}, focusing around column ${fileInfo.column}</li>`;
  message += `<li>Select the relevant code to capture with this extension</li>`;
  message += `</ol>`;
  message += `</div>`;
  
  message += `</div>`;
  return message;
}

// CSS styles for the guidance message
const errorLocationStyles = `
  .file-guidance {
    background-color: #1a1a2e;
    border: 1px solid #3b82f6;
    border-left: 4px solid #3b82f6;
    border-radius: 4px;
    padding: 12px;
    margin: 10px 0;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .file-guidance code {
    background-color: #2d2d3d;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
    color: #f9fafb;
  }
  
  .guidance-steps {
    margin-top: 10px;
  }
  
  .guidance-steps ol {
    margin-top: 5px;
    padding-left: 20px;
  }
  
  .guidance-steps li {
    margin-bottom: 6px;
  }
`;

// Export the functions for use in popup.js
window.ErrorLocationParser = {
  extractFileInfo,
  createGuidanceMessage,
  errorLocationStyles
};
