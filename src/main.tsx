import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

import { TempoDevtools } from "tempo-devtools";
TempoDevtools.init();

// Check if we're in a Chrome extension context
const isExtension =
  window.location.pathname.includes("index.html") &&
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.id;

const basename = import.meta.env.BASE_URL;

if (isExtension) {
  // Load the popup component for the extension
  import("./popup.tsx").then(() => {
    console.log("Extension popup loaded");
  });
} else {
  // Load the regular app for development
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}
