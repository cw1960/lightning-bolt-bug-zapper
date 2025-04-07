// Simple content script for Lightning Bolt Bug Zapper

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log("Content script received message:", message);
  
  if (message.action === "captureError") {
    console.log("Capture error action received");
    
    // Simulate capturing an error for testing
    setTimeout(() => {
      const errorText = findErrorOnPage();
      if (errorText) {
        console.log("Found error:", errorText);
        sendResponse({ success: true, error: errorText });
      } else {
        console.log("No error found on page");
        sendResponse({ success: false, reason: "No error found on page" });
      }
    }, 500);
    
    // Keep the message channel open for the async response
    return true;
  }
});

// Simple function to look for error elements on the page
function findErrorOnPage() {
  // Look for elements that might contain error messages
  const errorSelectors = [
    '.error', 
    '.alert-error', 
    '.alert-danger', 
    '[role="alert"]',
    '.exception',
    '.stack-trace',
    '.error-message',
    '.message-error'
  ];
  
  // Try to find elements using the selectors
  for (const selector of errorSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // Return the text of the first error element found
      return elements[0].innerText || elements[0].textContent;
    }
  }
  
  // If no specific error elements found, look for text containing error keywords
  const bodyText = document.body.innerText || document.body.textContent;
  const errorRegex = /error|exception|failed|failure|invalid|undefined|null|cannot|unable to|not found|TypeError|ReferenceError|SyntaxError|RangeError/i;
  
  if (errorRegex.test(bodyText)) {
    // Find the sentence containing the error
    const sentences = bodyText.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (errorRegex.test(sentence)) {
        return sentence.trim();
      }
    }
  }
  
  // No errors found
  return null;
} 