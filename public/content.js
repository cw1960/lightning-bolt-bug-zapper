// Content script for Lightning Bolt Bug Zapper extension

// Global variables to track selection state
let isSelectionMode = false;
let selectionType = null;
let overlay = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ACTIVATE_SELECTION") {
    activateSelectionMode(message.selectionType);
    sendResponse({ success: true });
  }

  if (message.type === "DEACTIVATE_SELECTION") {
    deactivateSelectionMode();
    sendResponse({ success: true });
  }
});

// Function to activate selection mode
function activateSelectionMode(type) {
  selectionType = type;
  isSelectionMode = true;

  // Create overlay if it doesn't exist
  if (!overlay) {
    createOverlay();
  }

  // Show overlay with appropriate styling
  overlay.classList.remove("hidden");
  document.body.classList.add("bolt-zapper-selection-mode");

  if (type === "error") {
    overlay.classList.add("bolt-zapper-error-selection");
    overlay.classList.remove("bolt-zapper-code-selection");
  } else {
    overlay.classList.add("bolt-zapper-code-selection");
    overlay.classList.remove("bolt-zapper-error-selection");
  }

  // Add click event listener to document
  document.addEventListener("click", handleDocumentClick);

  // Add escape key listener to cancel selection
  document.addEventListener("keydown", handleKeyDown);
}

// Function to deactivate selection mode
function deactivateSelectionMode() {
  isSelectionMode = false;
  selectionType = null;

  if (overlay) {
    overlay.classList.add("hidden");
  }

  document.body.classList.remove("bolt-zapper-selection-mode");
  document.removeEventListener("click", handleDocumentClick);
  document.removeEventListener("keydown", handleKeyDown);
}

// Function to create overlay
function createOverlay() {
  // Create styles
  const style = document.createElement("style");
  style.textContent = `
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
    }
    
    .bolt-zapper-code-selection .bolt-zapper-highlight {
      outline: 2px dashed #3b82f6 !important;
    }
  `;
  document.head.appendChild(style);

  // Create overlay
  overlay = document.createElement("div");
  overlay.className = "bolt-zapper-overlay hidden";

  // Create message
  const message = document.createElement("div");
  message.className = "bolt-zapper-message";
  message.textContent =
    "Click on an element to select it. Press ESC to cancel.";
  overlay.appendChild(message);

  document.body.appendChild(overlay);
}

// Function to handle document click
function handleDocumentClick(event) {
  event.preventDefault();
  event.stopPropagation();

  const target = event.target;

  // Get text content of the clicked element
  let content = target.textContent.trim();

  // Send message to popup with selected content
  chrome.runtime.sendMessage({
    type: "SELECTION_COMPLETE",
    selectionType,
    content,
  });

  // Deactivate selection mode
  deactivateSelectionMode();
}

// Function to handle key down
function handleKeyDown(event) {
  if (event.key === "Escape") {
    deactivateSelectionMode();
    chrome.runtime.sendMessage({
      type: "SELECTION_CANCELLED",
    });
  }
}

// Function to highlight element on hover
function handleMouseOver(event) {
  if (!isSelectionMode) return;

  // Remove highlight from all elements
  const highlighted = document.querySelectorAll(".bolt-zapper-highlight");
  highlighted.forEach((el) => el.classList.remove("bolt-zapper-highlight"));

  // Add highlight to current element
  event.target.classList.add("bolt-zapper-highlight");
}

// Function to remove highlight on mouse out
function handleMouseOut(event) {
  if (!isSelectionMode) return;
  event.target.classList.remove("bolt-zapper-highlight");
}

// Add mouse event listeners
document.addEventListener("mouseover", handleMouseOver);
document.addEventListener("mouseout", handleMouseOut);
