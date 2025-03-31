// Content script for Lightning Bolt Bug Zapper extension

// Browser compatibility detection
const BROWSER = (function detectBrowser() {
  const userAgent = navigator.userAgent;

  if (userAgent.indexOf("Firefox") > -1) {
    return "firefox";
  } else if (userAgent.indexOf("Edge") > -1 || userAgent.indexOf("Edg") > -1) {
    return "edge";
  } else if (userAgent.indexOf("Chrome") > -1) {
    return "chrome";
  } else if (userAgent.indexOf("Safari") > -1) {
    return "safari";
  } else {
    return "unknown";
  }
})();

// Use appropriate browser API
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Global variables to track selection state
let isSelectionMode = false;
let selectionType = null;
let overlay = null;
let tooltipElement = null;
let lastHighlightedElement = null;

// MutationObserver to monitor bolt.new DOM changes
let boltDotNewObserver = null;

// Debounce function to limit frequent function calls
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Listen for messages from popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ACTIVATE_SELECTION") {
    activateSelectionMode(message.selectionType);
    sendResponse({ success: true });
  }

  if (message.type === "DEACTIVATE_SELECTION") {
    deactivateSelectionMode();
    sendResponse({ success: true });
  }

  if (message.type === "CHECK_COMPATIBILITY") {
    sendResponse({
      success: true,
      browser: BROWSER,
      isCompatible: true,
      version: "1.0.0",
    });
  }

  return true; // Required for async sendResponse
});

// Function to activate selection mode
function activateSelectionMode(type) {
  // Setup observer to monitor bolt.new DOM changes that might affect our selectors
  setupBoltDotNewMonitor();

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

  // Create tooltip if it doesn't exist
  if (!tooltipElement) {
    createTooltip();
  }

  // Add mouse event listeners - use event delegation
  document.addEventListener("mouseover", handleMouseOver);
  document.addEventListener("mouseout", handleMouseOut);
  document.addEventListener("mousemove", debouncedMouseMove);
}

// Function to deactivate selection mode
function deactivateSelectionMode() {
  // Disconnect the bolt.new observer if it exists
  if (boltDotNewObserver) {
    boltDotNewObserver.disconnect();
    boltDotNewObserver = null;
  }

  isSelectionMode = false;
  selectionType = null;

  if (overlay) {
    overlay.classList.add("hidden");
  }

  if (tooltipElement) {
    tooltipElement.classList.add("hidden");
  }

  // Remove highlight from all elements
  const highlighted = document.querySelectorAll(".bolt-zapper-highlight");
  highlighted.forEach((el) => el.classList.remove("bolt-zapper-highlight"));
  lastHighlightedElement = null;

  document.body.classList.remove("bolt-zapper-selection-mode");
  document.removeEventListener("click", handleDocumentClick);
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("mouseover", handleMouseOver);
  document.removeEventListener("mouseout", handleMouseOut);
  document.removeEventListener("mousemove", debouncedMouseMove);
}

// Function to create overlay - only called once
function createOverlay() {
  // Create styles - only inject once
  if (!document.getElementById("bolt-zapper-styles")) {
    const style = document.createElement("style");
    style.id = "bolt-zapper-styles";
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
    `;
    document.head.appendChild(style);
  }

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

// Function to create tooltip - only called once
function createTooltip() {
  tooltipElement = document.createElement("div");
  tooltipElement.className = "bolt-zapper-tooltip hidden";
  document.body.appendChild(tooltipElement);
}

// Function to update tooltip position and content - optimized with debounce
const debouncedMouseMove = debounce(handleMouseMove, 50); // 50ms debounce

function updateTooltip(element, x, y) {
  if (!tooltipElement || !isSelectionMode) return;

  // Get a preview of the element's text content
  const elementText = element.textContent.trim();
  const previewText =
    elementText.length > 100
      ? elementText.substring(0, 100) + "..."
      : elementText;

  let tooltipContent = "";
  if (selectionType === "error") {
    tooltipContent = `Error message preview: ${previewText}`;
  } else {
    tooltipContent = `Code preview: ${previewText}`;
  }

  // Only update DOM if content changed
  if (tooltipElement.textContent !== tooltipContent) {
    tooltipElement.textContent = tooltipContent;
  }

  tooltipElement.classList.remove("hidden");

  // Position tooltip near the cursor but ensure it's visible
  const tooltipRect = tooltipElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Default position is below and to the right of cursor
  let tooltipX = x + 15;
  let tooltipY = y + 15;

  // Adjust if tooltip would go off screen
  if (tooltipX + tooltipRect.width > viewportWidth) {
    tooltipX = viewportWidth - tooltipRect.width - 10;
  }

  if (tooltipY + tooltipRect.height > viewportHeight) {
    tooltipY = y - tooltipRect.height - 10;
  }

  // Use transform for better performance instead of top/left
  tooltipElement.style.transform = `translate(${tooltipX}px, ${tooltipY}px)`;
}

// Function to handle document click
function handleDocumentClick(event) {
  event.preventDefault();
  event.stopPropagation();

  const target = event.target;
  let content = "";

  // Process content based on selection type
  if (selectionType === "error") {
    // For error messages, try to get the most relevant error text
    content = extractErrorMessage(target);
  } else {
    // For code blocks, try to get formatted code
    content = extractCodeBlock(target);
  }

  // Add visual feedback - pulse animation
  target.classList.add("bolt-zapper-pulse");
  setTimeout(() => {
    target.classList.remove("bolt-zapper-pulse");
  }, 1000);

  // Send message to popup with selected content
  browserAPI.runtime.sendMessage({
    type: "SELECTION_COMPLETE",
    selectionType,
    content,
  });

  // Deactivate selection mode
  deactivateSelectionMode();
}

// Function to extract error message with context - optimized
function extractErrorMessage(element) {
  // Check if we're already looking at an error element
  if (isErrorElement(element)) {
    return element.textContent.trim();
  }

  const elementText = element.textContent.trim();
  if (isErrorText(elementText)) {
    return elementText;
  }

  // If not, try to find the closest error-containing parent
  let currentElement = element;
  let errorParent = null;

  // Look up the DOM tree for error elements - limit depth to avoid performance issues
  let depth = 0;
  const MAX_DEPTH = 10;

  while (
    currentElement &&
    currentElement !== document.body &&
    depth < MAX_DEPTH
  ) {
    if (
      isErrorElement(currentElement) ||
      isErrorText(currentElement.textContent)
    ) {
      errorParent = currentElement;
      break;
    }
    currentElement = currentElement.parentElement;
    depth++;
  }

  // If we found an error parent, use its text
  if (errorParent) {
    return errorParent.textContent.trim();
  }

  // If we couldn't find a better error element, just use the clicked element's text
  return elementText;
}

// Function to check if an element is likely an error element - optimized
function isErrorElement(element) {
  // Check element classes and attributes for error indicators
  const classNames = element.className.toLowerCase();
  const id = element.id ? element.id.toLowerCase() : "";
  const role = element.getAttribute("role");

  return (
    classNames.includes("error") ||
    classNames.includes("exception") ||
    classNames.includes("fail") ||
    id.includes("error") ||
    role === "alert" ||
    element.hasAttribute("aria-errormessage") ||
    element.getAttribute("aria-invalid") === "true"
  );
}

// Precompile regex patterns for better performance
const errorKeywordsRegex = new RegExp(
  "error|exception|failed|failure|invalid|undefined|null|cannot|unable to|not found|TypeError|ReferenceError|SyntaxError|RangeError",
  "i",
);

// Function to check if text is likely an error message - optimized
function isErrorText(text) {
  return errorKeywordsRegex.test(text);
}

// Function to extract code block - optimized
function extractCodeBlock(element) {
  // Check if element is or is inside a code block
  let codeElement = findCodeElement(element);

  if (codeElement) {
    // If it's a pre or code element, get its text content
    return codeElement.textContent.trim();
  }

  // If we couldn't find a code element, check if the text looks like code
  const elementText = element.textContent.trim();
  if (looksLikeCode(elementText)) {
    return elementText;
  }

  // If all else fails, just return the element's text
  return elementText;
}

// Function to find the closest code element - optimized
function findCodeElement(element) {
  // Check if the element itself is a code element
  if (isCodeElement(element)) {
    return element;
  }

  // Check if the element is inside a code element - limit depth to avoid performance issues
  let currentElement = element;
  let depth = 0;
  const MAX_DEPTH = 10;

  while (
    currentElement &&
    currentElement !== document.body &&
    depth < MAX_DEPTH
  ) {
    if (isCodeElement(currentElement)) {
      return currentElement;
    }
    currentElement = currentElement.parentElement;
    depth++;
  }

  // Use a more efficient selector for possible code containers
  const possibleCodeContainers = document.querySelectorAll(
    'pre, code, .code, [class*="code"], [class*="syntax"]',
  );

  // Use a more efficient approach to check if element is inside containers
  for (let i = 0; i < possibleCodeContainers.length; i++) {
    const container = possibleCodeContainers[i];
    if (container.contains(element)) {
      return container;
    }
  }

  return null;
}

// Function to check if an element is a code element - optimized
function isCodeElement(element) {
  const tagName = element.tagName.toLowerCase();
  const classNames = element.className.toLowerCase();

  return (
    tagName === "pre" ||
    tagName === "code" ||
    classNames.includes("code") ||
    classNames.includes("syntax") ||
    classNames.includes("highlight") ||
    element.hasAttribute("data-language") ||
    element.hasAttribute("data-lang")
  );
}

// Precompile regex patterns for better performance
const codePatterns = [
  /[{\[\(].*[}\]\)]/, // Has brackets
  /function\s+\w+\s*\(.*\)/, // Function declaration
  /const\s+|let\s+|var\s+/, // Variable declarations
  /=>/, // Arrow functions
  /import\s+.*from\s+/, // Import statements
  /class\s+\w+/, // Class declarations
  /if\s*\(.*\)/, // If statements
  /for\s*\(.*\)/, // For loops
  /\w+\s*=\s*\w+/, // Assignment
  /return\s+\w+/, // Return statements
];

// Function to check if text looks like code - optimized
function looksLikeCode(text) {
  for (let i = 0; i < codePatterns.length; i++) {
    if (codePatterns[i].test(text)) {
      return true;
    }
  }
  return false;
}

// Function to handle key down
function handleKeyDown(event) {
  if (event.key === "Escape") {
    deactivateSelectionMode();
    browserAPI.runtime.sendMessage({
      type: "SELECTION_CANCELLED",
    });
  }
}

// Function to highlight element on hover - optimized with event delegation
function handleMouseOver(event) {
  if (!isSelectionMode) return;

  // Remove highlight from previous element if different
  if (lastHighlightedElement && lastHighlightedElement !== event.target) {
    lastHighlightedElement.classList.remove("bolt-zapper-highlight");
  }

  // Add highlight to current element
  event.target.classList.add("bolt-zapper-highlight");
  lastHighlightedElement = event.target;

  // Update tooltip
  updateTooltip(event.target, event.clientX, event.clientY);
}

// Function to remove highlight on mouse out - optimized with event delegation
function handleMouseOut(event) {
  if (!isSelectionMode) return;

  // Only remove highlight if we're not entering a child element
  if (!event.relatedTarget || !event.target.contains(event.relatedTarget)) {
    event.target.classList.remove("bolt-zapper-highlight");

    if (event.target === lastHighlightedElement) {
      lastHighlightedElement = null;
    }
  }
}

// Function to update tooltip on mouse move - debounced for performance
function handleMouseMove(event) {
  if (!isSelectionMode || !lastHighlightedElement) return;
  updateTooltip(lastHighlightedElement, event.clientX, event.clientY);
}

// Function to monitor bolt.new for DOM changes that might affect our selectors
function setupBoltDotNewMonitor() {
  // Only setup if we're on bolt.new
  if (
    window.location.hostname !== "bolt.new" &&
    !window.location.hostname.endsWith(".bolt.new")
  ) {
    return;
  }

  // Disconnect existing observer if it exists
  if (boltDotNewObserver) {
    boltDotNewObserver.disconnect();
  }

  boltDotNewObserver = new MutationObserver(handleBoltDotNewMutations);

  // Observe the entire document for changes
  boltDotNewObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "id", "style"],
  });
}

// Handle mutations on bolt.new
function handleBoltDotNewMutations(mutations) {
  // If we're in selection mode, we need to check if our highlighted element was affected
  if (isSelectionMode && lastHighlightedElement) {
    // Check if the highlighted element was removed from the DOM
    let stillInDOM = document.contains(lastHighlightedElement);

    if (!stillInDOM) {
      // Our highlighted element was removed, clear the reference
      lastHighlightedElement = null;
    }
  }

  // Check if any mutations affect error or code elements we care about
  for (const mutation of mutations) {
    if (mutation.type === "childList" && isSelectionMode) {
      // New nodes were added, check if they match what we're looking for
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (selectionType === "error" && isErrorElement(node)) {
            // A new error element was added, might want to highlight it
            node.classList.add("bolt-zapper-highlight");
            lastHighlightedElement = node;
          } else if (selectionType === "code" && isCodeElement(node)) {
            // A new code element was added, might want to highlight it
            node.classList.add("bolt-zapper-highlight");
            lastHighlightedElement = node;
          }
        }
      });
    }
  }
}

// Function to check if the extension is compatible with the current browser
function checkBrowserCompatibility() {
  const features = {
    storage: typeof browserAPI.storage !== "undefined",
    runtime: typeof browserAPI.runtime !== "undefined",
    scripting: typeof browserAPI.scripting !== "undefined",
    activeTab: typeof browserAPI.tabs !== "undefined",
    // Add more feature checks as needed
  };

  // Check if all required features are available
  const isCompatible = Object.values(features).every(Boolean);

  return {
    browser: BROWSER,
    features,
    isCompatible,
  };
}
