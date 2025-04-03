import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import ExtensionPopup from "./components/ExtensionPopup";
import { AuthProvider } from "./lib/authContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <div className="p-4 w-[400px] h-[600px] bg-background">
          <ExtensionPopup />
        </div>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
