const O=function(){const t=navigator.userAgent;return t.indexOf("Firefox")>-1?"firefox":t.indexOf("Edge")>-1||t.indexOf("Edg")>-1?"edge":t.indexOf("Chrome")>-1?"chrome":t.indexOf("Safari")>-1?"safari":"unknown"}(),g=typeof browser<"u"?browser:chrome;
// Add state management for workflow
let c=!1,u=null,i=null,s=null,r=null,p=null;
// Add workflow state tracking
let captureState = {
  error: null,
  code: null,
  currentStep: null,
  fileStructure: null,
  fixApplied: false,
  fixSuccessful: null
};

// Add connection state tracking
let popupConnected = false;

function A(e,t){let o;return function(...n){clearTimeout(o),o=setTimeout(()=>e.apply(this,n),t)}}

g.runtime.onMessage.addListener((e,t,o)=>{
  // Log all messages for debugging
  console.log("Content script received message:", e);
  
  // Check if popup is connecting
  if (e.action === "checkConnection") {
    popupConnected = true;
    return o({success: true, state: captureState});
  }
  
  // Start sequential capture workflow
  if (e.action === "startCaptureWorkflow") {
    console.log("Starting capture workflow");
    captureState = {
      error: null,
      code: null,
      currentStep: "error",
      fileStructure: null,
      fixApplied: false,
      fixSuccessful: null
    };
    
    // Save state to local storage as backup
    chrome.storage.local.set({ captureState: captureState });
    
    // Start with error capture
    k("error");
    return o({success: true, state: captureState});
  }
  
  // Reset workflow state
  if (e.action === "resetCaptureState") {
    console.log("Resetting capture state");
    captureState = {
      error: null,
      code: null,
      currentStep: null,
      fileStructure: null,
      fixApplied: false,
      fixSuccessful: null
    };
    
    // Clear from local storage
    chrome.storage.local.remove(['captureState']);
    
    // Make sure selection mode is deactivated
    x();
    
    return o({success: true});
  }
  
  // Get current state of the capture workflow
  if (e.action === "getCaptureState") {
    popupConnected = true; // Mark popup as connected when it asks for state
    return o({success: true, state: captureState});
  }
  
  // Continue to code capture step
  if (e.action === "captureCode") {
    console.log("Moving to code capture step");
    k("code");
    return o({success: true, state: captureState});
  }
  
  // Apply fix to bolt.new editor
  if (e.action === "applyFix") {
    console.log("Applying fix to editor");
    const success = F(e.fixedCode, e.originalCode);
    captureState.fixApplied = true;
    captureState.fixSuccessful = success;
    return o({success: success, state: captureState});
  }
  
  // Legacy captureError action from popup
  if (e.action === "captureError") {
    console.log("Received captureError request");
    k("error"); // Activate error selection mode
    return o({success: true});
  }
  
  // Monitor for errors after applying fix
  if (e.action === "monitorForErrors") {
    const errorStatus = V();
    return o({success: true, hasErrors: errorStatus.hasErrors, errorMessages: errorStatus.messages});
  }
  
  // Original message handlers
  if (e.type==="ACTIVATE_SELECTION") {
    k(e.selectionType);
    return o({success:!0});
  }
  if (e.type==="DEACTIVATE_SELECTION") {
    x();
    return o({success:!0});
  }
  if (e.type==="CHECK_COMPATIBILITY") {
    return o({success:!0, browser:O, isCompatible:!0, version:"1.0.0"});
  }
  return true;
});

function k(e){
  X(),
  u=e,
  c=!0,
  i||D(),
  i.classList.remove("hidden"),
  document.body.classList.add("bolt-zapper-selection-mode");
  
  // Get or create the message element
  let messageElement = i.querySelector(".bolt-zapper-message");
  if (!messageElement) {
    messageElement = document.createElement("div");
    messageElement.className = "bolt-zapper-message";
    i.appendChild(messageElement);
  }
  
  if (e==="error") {
    i.classList.add("bolt-zapper-error-selection");
    i.classList.remove("bolt-zapper-code-selection");
    // Update message for error selection
    messageElement.textContent = "Click on an error message to select it. Press ESC to cancel.";
  } else {
    i.classList.add("bolt-zapper-code-selection");
    i.classList.remove("bolt-zapper-error-selection");
    // Update message for code selection
    messageElement.textContent = "Click on the code that contains the error. Press ESC to cancel.";
  }
  
  document.addEventListener("click",C),
  document.addEventListener("keydown",L),
  s||I(),
  document.addEventListener("mouseover",T),
  document.addEventListener("mouseout",M),
  document.addEventListener("mousemove",v)
}

function x(){
  p&&(p.disconnect(),p=null),
  c=!1,
  u=null,
  i&&i.classList.add("hidden"),
  s&&s.classList.add("hidden"),
  document.querySelectorAll(".bolt-zapper-highlight").forEach(t=>t.classList.remove("bolt-zapper-highlight")),
  r=null,
  document.body.classList.remove("bolt-zapper-selection-mode"),
  document.removeEventListener("click",C),
  document.removeEventListener("keydown",L),
  document.removeEventListener("mouseover",T),
  document.removeEventListener("mouseout",M),
  document.removeEventListener("mousemove",v)
}

function D(){
  if(!document.getElementById("bolt-zapper-styles")){
    const t=document.createElement("style");
    t.id="bolt-zapper-styles",
    t.textContent=`
      .bolt-zapper-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      .bolt-zapper-overlay.hidden {
        display: none;
      }
      
      .bolt-zapper-message {
        background: #1e1e2e;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        margin-bottom: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        pointer-events: none;
      }
      
      .bolt-zapper-error-selection .bolt-zapper-message {
        border-left: 4px solid #f43f5e;
      }
      
      .bolt-zapper-code-selection .bolt-zapper-message {
        border-left: 4px solid #3b82f6;
      }
      
      .bolt-zapper-selection-mode * {
        cursor: crosshair !important;
      }
      
      .bolt-zapper-highlight {
        outline: 2px dashed #f43f5e !important;
        outline-offset: 2px !important;
        position: relative;
      }
      
      .bolt-zapper-code-selection .bolt-zapper-highlight {
        outline: 2px dashed #3b82f6 !important;
      }

      .bolt-zapper-tooltip {
        position: fixed;
        background: #1e1e2e;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        pointer-events: none;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        transition: opacity 0.2s ease;
      }

      .bolt-zapper-tooltip.hidden {
        opacity: 0;
        visibility: hidden;
      }

      .bolt-zapper-error-selection .bolt-zapper-tooltip {
        border-left: 3px solid #f43f5e;
      }

      .bolt-zapper-code-selection .bolt-zapper-tooltip {
        border-left: 3px solid #3b82f6;
      }

      .bolt-zapper-pulse {
        animation: bolt-zapper-pulse 1.5s infinite;
      }

      @keyframes bolt-zapper-pulse {
        0% {
          outline-color: rgba(244, 63, 94, 0.6);
        }
        50% {
          outline-color: rgba(244, 63, 94, 1);
        }
        100% {
          outline-color: rgba(244, 63, 94, 0.6);
        }
      }

      .bolt-zapper-code-selection .bolt-zapper-pulse {
        animation: bolt-zapper-pulse-blue 1.5s infinite;
      }

      @keyframes bolt-zapper-pulse-blue {
        0% {
          outline-color: rgba(59, 130, 246, 0.6);
        }
        50% {
          outline-color: rgba(59, 130, 246, 1);
        }
        100% {
          outline-color: rgba(59, 130, 246, 0.6);
        }
      }
      
      /* Add new styles for fix UI */
      .bolt-zapper-fix-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 380px;
        max-height: calc(100vh - 40px);
        background: #1e1e2e;
        color: white;
        border-radius: 8px;
        font-family: system-ui, -apple-system, sans-serif;
        z-index: 10000;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .bolt-zapper-fix-header {
        padding: 12px 16px;
        background: #2d2d3d;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #3d3d4d;
      }
      
      .bolt-zapper-fix-title {
        font-weight: 600;
        font-size: 14px;
      }
      
      .bolt-zapper-fix-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .bolt-zapper-fix-content {
        padding: 16px;
        overflow-y: auto;
        flex: 1;
      }
      
      .bolt-zapper-fix-code {
        background: #252535;
        border-radius: 4px;
        padding: 12px;
        font-family: monospace;
        white-space: pre-wrap;
        overflow-x: auto;
        margin-bottom: 16px;
        font-size: 13px;
        line-height: 1.5;
      }
      
      .bolt-zapper-fix-actions {
        padding: 12px 16px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        border-top: 1px solid #3d3d4d;
      }
      
      .bolt-zapper-fix-button {
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        border: none;
      }
      
      .bolt-zapper-fix-apply {
        background: #3b82f6;
        color: white;
      }
      
      .bolt-zapper-fix-cancel {
        background: transparent;
        color: #a1a1aa;
        border: 1px solid #3d3d4d;
      }
      
      .bolt-zapper-fix-feedback {
        padding: 12px 16px;
        display: flex;
        justify-content: center;
        gap: 16px;
        border-top: 1px solid #3d3d4d;
      }
      
      .bolt-zapper-fix-feedback-button {
        background: transparent;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .bolt-zapper-fix-feedback-button:hover {
        background: #2d2d3d;
      }
      
      .bolt-zapper-success-badge {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        border-radius: 8px;
        padding: 12px 16px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: bolt-zapper-fade-in 0.3s ease;
      }
      
      @keyframes bolt-zapper-fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `,document.head.appendChild(t)
  }
  
  // Create overlay container only (no message) - we'll add the message in k()
  i=document.createElement("div");
  i.className="bolt-zapper-overlay hidden";
  document.body.appendChild(i);
}

function I(){
  s=document.createElement("div"),
  s.className="bolt-zapper-tooltip hidden",
  document.body.appendChild(s)
}

const v=A(R,50);

function z(e,t,o){
  if(!s||!c)return;
  const n=e.textContent.trim(),
  a=n.length>100?n.substring(0,100)+"...":n;
  let l="";
  u==="error"?l=`Error message preview: ${a}`:l=`Code preview: ${a}`,
  s.textContent!==l&&(s.textContent=l),
  s.classList.remove("hidden");
  const d=s.getBoundingClientRect(),
  E=window.innerWidth,
  N=window.innerHeight;
  let f=t+15,m=o+15;
  f+d.width>E&&(f=E-d.width-10),
  m+d.height>N&&(m=o-d.height-10),
  s.style.transform=`translate(${f}px, ${m}px)`
}

function C(e){
  e.preventDefault(),
  e.stopPropagation();
  const t=e.target;
  let o="";
  
  if (u==="error") {
    o=S(t);
    // Store error in captureState
    captureState.error = o;
    captureState.currentStep = "error_location";
    
    // Save state to chrome.storage for persistence
    chrome.storage.local.set({ captureState: captureState });
    
    // Animate element and proceed to next step
    t.classList.add("bolt-zapper-pulse");
    setTimeout(()=>{
      t.classList.remove("bolt-zapper-pulse");
      
      // Send message about captured error, but don't automatically continue to code capture
      chrome.runtime.sendMessage({
        type: "ERROR_CAPTURED", 
        errorMessage: o,
        continueToCodeCapture: false
      }, response => {
        // Don't continue to code capture automatically
        // Wait for explicit instruction from popup to start code capture
        x(); // Deactivate current selection mode
        
        // If popup is closed, show a notification to open it again
        if (!popupConnected) {
          // Create notification that tells user to open the extension popup
          const notification = document.createElement('div');
          notification.className = 'bolt-zapper-notification';
          notification.innerHTML = `
            <div class="bolt-zapper-notification-content">
              <strong>Error captured!</strong> 
              <p>Please click on the Lightning Bolt Bug Zapper extension icon to continue.</p>
              <button class="bolt-zapper-notification-close">×</button>
            </div>
          `;
          
          // Add styles for notification
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #1a1a2e;
            color: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            max-width: 300px;
          `;
          
          // Add the notification to the page
          document.body.appendChild(notification);
          
          // Add close button functionality
          const closeBtn = notification.querySelector('.bolt-zapper-notification-close');
          closeBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: #ccc;
            font-size: 18px;
            cursor: pointer;
          `;
          closeBtn.addEventListener('click', () => {
            document.body.removeChild(notification);
          });
          
          // Automatically remove after 10 seconds
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 10000);
        }
      });
    }, 1000);
  } else {
    // Enhanced code capture with context gathering
    const codeElement = _(t);
    o = getFullCodeContext(codeElement || t);
    captureState.code = o;
    captureState.currentStep = "preview";
    
    // Try to identify file structure
    captureState.fileStructure = identifyFileStructure();
    
    // Save state to chrome.storage for persistence
    chrome.storage.local.set({ captureState: captureState });
    
    t.classList.add("bolt-zapper-pulse");
    setTimeout(()=>{
      t.classList.remove("bolt-zapper-pulse");
      
      // Send message with captured code
      chrome.runtime.sendMessage({
        type: "CODE_CAPTURED", 
        codeContent: o,
        fileStructure: captureState.fileStructure
      });
      
      // Always deactivate selection mode
      x();
      
      // Show modal if popup is closed
      if (!popupConnected) {
        showCaptureCompletedModal(captureState);
      }
    }, 1000);
  }
}

// Enhanced code context gathering
function getFullCodeContext(element) {
  // Try to get the full file content first
  let fileContent = getFullFileContent(element);
  if (fileContent) {
    return fileContent;
  }
  
  // If we couldn't get the full file, get as much context as possible
  let codeText = element.textContent.trim();
  
  // Try to get parent component or function if available
  const parentContext = getParentContext(element);
  if (parentContext && parentContext !== codeText) {
    return parentContext;
  }
  
  return codeText;
}

// Try to get the full file content from bolt.new's editor
function getFullFileContent(element) {
  // Look for editor elements that might contain the full file
  const editorElements = document.querySelectorAll('.monaco-editor, .cm-editor, .ace_editor, [class*="editor"]');
  
  for (const editor of editorElements) {
    if (editor.contains(element)) {
      // Found an editor that contains our element
      // Try to extract full content from the editor
      const editorContent = extractEditorContent(editor);
      if (editorContent) {
        return editorContent;
      }
    }
  }
  
  return null;
}

// Extract content from different editor types
function extractEditorContent(editor) {
  // Check for Monaco Editor (VSCode-like)
  if (editor.classList.contains('monaco-editor')) {
    const lines = editor.querySelectorAll('.view-line');
    if (lines.length > 0) {
      return Array.from(lines).map(line => line.textContent).join('\n');
    }
  }
  
  // Check for CodeMirror Editor
  if (editor.classList.contains('cm-editor')) {
    const content = editor.querySelector('.cm-content');
    if (content) {
      return content.textContent;
    }
  }
  
  // Check for Ace Editor
  if (editor.classList.contains('ace_editor')) {
    const content = editor.querySelector('.ace_text-layer');
    if (content) {
      return Array.from(content.querySelectorAll('.ace_line'))
        .map(line => line.textContent)
        .join('\n');
    }
  }
  
  // Generic fallback - look for pre or code blocks
  const codeBlocks = editor.querySelectorAll('pre, code');
  if (codeBlocks.length > 0) {
    return Array.from(codeBlocks)
      .map(block => block.textContent)
      .join('\n');
  }
  
  return null;
}

// Try to get parent context (function or component containing the element)
function getParentContext(element) {
  // Start at the element and keep expanding the selection up the DOM tree
  // until we find a complete function/component or reach a certain size limit
  let current = element;
  let lastValidContext = element.textContent.trim();
  let contextSize = lastValidContext.length;
  const MAX_CONTEXT_SIZE = 5000; // Limit context size
  
  while (current && current !== document.body) {
    current = current.parentElement;
    
    if (!current) break;
    
    // Check if this level has a good context
    const currentText = current.textContent.trim();
    const currentSize = currentText.length;
    
    // If we've reached something too large, stop and use the previous context
    if (currentSize > MAX_CONTEXT_SIZE) {
      break;
    }
    
    // Check if this seems like a complete code unit
    if (isCompleteCodeUnit(currentText)) {
      lastValidContext = currentText;
      contextSize = currentSize;
    }
  }
  
  return lastValidContext;
}

// Check if a text string appears to be a complete unit of code
function isCompleteCodeUnit(text) {
  // Check opening/closing bracket balance
  const openingCurly = (text.match(/{/g) || []).length;
  const closingCurly = (text.match(/}/g) || []).length;
  
  // Very simple heuristic: if brackets are balanced, it might be complete
  if (openingCurly > 0 && openingCurly === closingCurly) {
    return true;
  }
  
  // Check for common patterns that suggest a complete unit
  const importMatch = text.match(/^import\s+.*?;/m);
  const functionMatch = text.match(/function\s+\w+\s*\(.*?\)\s*{[\s\S]*}/);
  const classMatch = text.match(/class\s+\w+\s*{[\s\S]*}/);
  const constMatch = text.match(/const\s+\w+\s*=\s*(?:function|class|\()/);
  
  return importMatch || functionMatch || classMatch || constMatch;
}

// Identify file structure in bolt.new
function identifyFileStructure() {
  // Look for elements that might reveal the file structure
  const fileNav = document.querySelectorAll([
    '.file-navigator', 
    '.file-tree', 
    '.file-explorer',
    '[class*="file-nav"]',
    '[class*="explorer"]',
    '[class*="tree-view"]'
  ].join(','));
  
  let structure = {
    currentFile: null,
    fileTree: []
  };
  
  // Try to find the current file name
  const fileTabElements = document.querySelectorAll([
    '.tab.active', 
    '.file-tab.active', 
    '[class*="tab"][class*="active"]',
    '[aria-selected="true"][role="tab"]'
  ].join(','));
  
  if (fileTabElements.length > 0) {
    structure.currentFile = fileTabElements[0].textContent.trim();
  }
  
  // Try to extract file tree if available
  if (fileNav.length > 0) {
    const fileElements = fileNav[0].querySelectorAll('[class*="file"]');
    
    structure.fileTree = Array.from(fileElements)
      .filter(el => !el.querySelector('[class*="file"]')) // Filter out containers
      .map(el => el.textContent.trim())
      .filter(name => name); // Remove empty names
  }
  
  return structure;
}

// Apply fix to the editor
function F(fixedCode, originalCode) {
  try {
    // Find editor components in bolt.new
    const editors = document.querySelectorAll('.monaco-editor, .cm-editor, .ace_editor, [class*="editor"]');
    
    if (editors.length === 0) {
      console.error("No editor found on page");
      return false;
    }
    
    let success = false;
    
    // Try different editor types
    for (const editor of editors) {
      // Check type and try appropriate method
      if (editor.classList.contains('monaco-editor')) {
        success = applyToMonacoEditor(editor, fixedCode);
      } else if (editor.classList.contains('cm-editor')) {
        success = applyToCodeMirrorEditor(editor, fixedCode);
      } else if (editor.classList.contains('ace_editor')) {
        success = applyToAceEditor(editor, fixedCode);
      } else {
        // Try generic approach
        success = applyGenericEditorFix(editor, fixedCode, originalCode);
      }
      
      if (success) {
        // Show success message
        showSuccessBadge();
        break;
      }
    }
    
    // If direct manipulation failed, use clipboard fallback
    if (!success) {
      copyToClipboard(fixedCode);
      alert("Could not automatically apply the fix. The fixed code has been copied to your clipboard.");
      return false;
    }
    
    return success;
  } catch (error) {
    console.error("Error applying fix:", error);
    return false;
  }
}

// Apply fix to Monaco editor (VSCode-like)
function applyToMonacoEditor(editor, fixedCode) {
  try {
    // Check if we can access the Monaco API
    if (typeof monaco !== 'undefined' && monaco.editor) {
      // Get the editor instance
      const editorInstance = monaco.editor.getModels()[0];
      if (editorInstance) {
        // Replace content
        editorInstance.setValue(fixedCode);
        return true;
      }
    }
    
    // Fallback: Try to trigger paste event
    const textArea = editor.querySelector('textarea');
    if (textArea) {
      textArea.value = fixedCode;
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error applying to Monaco editor:", error);
    return false;
  }
}

// Apply fix to CodeMirror editor
function applyToCodeMirrorEditor(editor, fixedCode) {
  try {
    // Find CodeMirror instance
    let cm = null;
    
    // Try to access the CodeMirror instance via the DOM element
    for (const key in editor) {
      if (key.startsWith('__')) {
        const value = editor[key];
        if (value && typeof value.setValue === 'function') {
          cm = value;
          break;
        }
      }
    }
    
    if (cm) {
      cm.setValue(fixedCode);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error applying to CodeMirror editor:", error);
    return false;
  }
}

// Apply fix to Ace editor
function applyToAceEditor(editor, fixedCode) {
  try {
    // Find Ace instance
    if (typeof ace !== 'undefined') {
      // Try to get editor instance
      const editorId = editor.id;
      const aceEditor = ace.edit(editorId);
      
      if (aceEditor) {
        aceEditor.setValue(fixedCode);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error applying to Ace editor:", error);
    return false;
  }
}

// Generic approach for any editor
function applyGenericEditorFix(editor, fixedCode, originalCode) {
  try {
    // Look for contenteditable areas
    const editableElements = editor.querySelectorAll('[contenteditable="true"]');
    if (editableElements.length > 0) {
      editableElements[0].textContent = fixedCode;
      return true;
    }
    
    // Try to find pre/code elements
    const codeBlocks = editor.querySelectorAll('pre, code');
    if (codeBlocks.length > 0) {
      // If we have the original code, try to replace just that part
      if (originalCode) {
        for (const block of codeBlocks) {
          if (block.textContent.includes(originalCode)) {
            block.textContent = block.textContent.replace(originalCode, fixedCode);
            return true;
          }
        }
      }
      
      // If no match or no original code, replace the whole thing
      if (codeBlocks[0].textContent.trim().length > 0) {
        codeBlocks[0].textContent = fixedCode;
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error applying generic editor fix:", error);
    return false;
  }
}

// Copy to clipboard utility
function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

// Show success badge
function showSuccessBadge() {
  const badge = document.createElement('div');
  badge.className = 'bolt-zapper-success-badge';
  badge.innerHTML = '<span>✓</span> Fix applied successfully!';
  document.body.appendChild(badge);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (badge.parentNode) {
      badge.parentNode.removeChild(badge);
    }
  }, 3000);
}

// Monitor for errors after fix
function V() {
  // Look for error elements on the page
  const errorElements = document.querySelectorAll([
    '.error', 
    '.exception', 
    '[role="alert"]',
    '[aria-invalid="true"]',
    '.error-message',
    '.validation-error'
  ].join(','));
  
  const result = {
    hasErrors: false,
    messages: []
  };
  
  if (errorElements.length > 0) {
    result.hasErrors = true;
    
    // Collect error messages
    errorElements.forEach(el => {
      const text = el.textContent.trim();
      if (text) {
        result.messages.push(text);
      }
    });
  }
  
  // Also check for text containing error keywords
  const bodyText = document.body.innerText || document.body.textContent;
  const errorRegex = /error|exception|failed|failure|invalid|undefined|null|cannot|unable to|not found|TypeError|ReferenceError|SyntaxError|RangeError/i;
  
  if (errorRegex.test(bodyText) && result.messages.length === 0) {
    // Find sentences containing errors
    const sentences = bodyText.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (errorRegex.test(sentence)) {
        const trimmed = sentence.trim();
        if (trimmed && !result.messages.includes(trimmed)) {
          result.hasErrors = true;
          result.messages.push(trimmed);
        }
      }
    }
  }
  
  return result;
}

function S(e){if(b(e))return e.textContent.trim();const t=e.textContent.trim();if(y(t))return t;let o=e,n=null,a=0;const l=10;for(;o&&o!==document.body&&a<l;){if(b(o)||y(o.textContent)){n=o;break}o=o.parentElement,a++}return n?n.textContent.trim():t}function b(e){const t=e.className.toLowerCase(),o=e.id?e.id.toLowerCase():"",n=e.getAttribute("role");return t.includes("error")||t.includes("exception")||t.includes("fail")||o.includes("error")||n==="alert"||e.hasAttribute("aria-errormessage")||e.getAttribute("aria-invalid")==="true"}const P=new RegExp("error|exception|failed|failure|invalid|undefined|null|cannot|unable to|not found|TypeError|ReferenceError|SyntaxError|RangeError","i");function y(e){return P.test(e)}function B(e){let t=_(e);if(t)return t.textContent.trim();const o=e.textContent.trim();return H(o),o}function _(e){if(h(e))return e;let t=e,o=0;const n=10;for(;t&&t!==document.body&&o<n;){if(h(t))return t;t=t.parentElement,o++}const a=document.querySelectorAll('pre, code, .code, [class*="code"], [class*="syntax"]');for(let l=0;l<a.length;l++){const d=a[l];if(d.contains(e))return d}return null}function h(e){const t=e.tagName.toLowerCase(),o=e.className.toLowerCase();return t==="pre"||t==="code"||o.includes("code")||o.includes("syntax")||o.includes("highlight")||e.hasAttribute("data-language")||e.hasAttribute("data-lang")}const w=[/[{\[\(].*[}\]\)]/,/function\s+\w+\s*\(.*\)/,/const\s+|let\s+|var\s+/,/=>/,/import\s+.*from\s+/,/class\s+\w+/,/if\s*\(.*\)/,/for\s*\(.*\)/,/\w+\s*=\s*\w+/,/return\s+\w+/];function H(e){for(let t=0;t<w.length;t++)if(w[t].test(e))return!0;return!1}function L(e){e.key==="Escape"&&(x(),g.runtime.sendMessage({type:"SELECTION_CANCELLED"}))}function T(e){c&&(r&&r!==e.target&&r.classList.remove("bolt-zapper-highlight"),e.target.classList.add("bolt-zapper-highlight"),r=e.target,z(e.target,e.clientX,e.clientY))}function M(e){c&&(!e.relatedTarget||!e.target.contains(e.relatedTarget))&&(e.target.classList.remove("bolt-zapper-highlight"),e.target===r&&(r=null))}function R(e){!c||!r||z(r,e.clientX,e.clientY)}function X(){window.location.hostname!=="bolt.new"&&!window.location.hostname.endsWith(".bolt.new")||(p&&p.disconnect(),p=new MutationObserver(W),p.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","id","style"]}))}function W(e){c&&r&&(document.contains(r)||(r=null));for(const t of e)t.type==="childList"&&c&&t.addedNodes.forEach(o=>{o.nodeType===Node.ELEMENT_NODE&&(u==="error"&&b(o)||u==="code"&&h(o))&&(o.classList.add("bolt-zapper-highlight"),r=o)})}

// Add a function to show a modal when capture is complete but popup is closed
function showCaptureCompletedModal(state) {
  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.className = 'bolt-zapper-modal-container';
  modalContainer.style.position = 'fixed';
  modalContainer.style.top = '0';
  modalContainer.style.left = '0';
  modalContainer.style.width = '100%';
  modalContainer.style.height = '100%';
  modalContainer.style.display = 'flex';
  modalContainer.style.alignItems = 'center';
  modalContainer.style.justifyContent = 'center';
  modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modalContainer.style.zIndex = '10000';
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'bolt-zapper-modal-content';
  modalContent.style.backgroundColor = '#1e1e2e';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.maxWidth = '400px';
  modalContent.style.color = 'white';
  modalContent.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
  
  // Create header
  const header = document.createElement('h3');
  header.textContent = 'Capture Complete';
  header.style.margin = '0 0 15px 0';
  
  // Create message
  const message = document.createElement('p');
  message.textContent = 'Error and code have been captured. Open the extension popup to continue with generating a fix.';
  message.style.marginBottom = '20px';
  
  // Create button
  const button = document.createElement('button');
  button.textContent = 'OK';
  button.style.backgroundColor = '#3b82f6';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.padding = '8px 16px';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.onclick = () => document.body.removeChild(modalContainer);
  
  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(message);
  modalContent.appendChild(button);
  modalContainer.appendChild(modalContent);
  
  // Add to page
  document.body.appendChild(modalContainer);
}

// Check on page load if we're in the middle of a workflow
chrome.storage.local.get(['captureState'], result => {
  if (result.captureState && result.captureState.currentStep) {
    console.log('Restoring capture state from storage:', result.captureState);
    captureState = result.captureState;
    
    // If we were in the middle of selecting error or code, resume selection mode
    if (captureState.currentStep === 'error') {
      k('error');
    } else if (captureState.currentStep === 'code' && captureState.error) {
      k('code');
    }
  }
});
