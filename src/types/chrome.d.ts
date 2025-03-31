// Type definitions for Chrome extension API

interface Chrome {
  storage: {
    sync: {
      get: (keys: string[] | object, callback: (result: any) => void) => void;
      set: (items: object, callback?: () => void) => void;
    };
    local: {
      get: (keys: string[] | object, callback: (result: any) => void) => void;
      set: (items: object, callback?: () => void) => void;
    };
    onChanged: {
      addListener: (callback: (changes: any, areaName: string) => void) => void;
      removeListener: (
        callback: (changes: any, areaName: string) => void,
      ) => void;
    };
  };
  runtime: {
    id: string;
    lastError?: {
      message: string;
    };
    onMessage: {
      addListener: (
        callback: (
          message: any,
          sender: any,
          sendResponse: any,
        ) => void | boolean,
      ) => void;
      removeListener: (
        callback: (
          message: any,
          sender: any,
          sendResponse: any,
        ) => void | boolean,
      ) => void;
    };
    sendMessage: (message: any, callback?: (response: any) => void) => void;
    openOptionsPage: () => void;
  };
  tabs: {
    query: (
      queryInfo: { active: boolean; currentWindow: boolean },
      callback: (tabs: any[]) => void,
    ) => void;
    sendMessage: (
      tabId: number,
      message: any,
      callback?: (response: any) => void,
    ) => void;
  };
  scripting: {
    executeScript: (options: any, callback?: (results: any[]) => void) => void;
  };
}

// Define the browser global for Firefox compatibility
declare namespace browser {
  export const runtime: typeof chrome.runtime;
  export const storage: typeof chrome.storage;
  export const scripting: typeof chrome.scripting;
  export const tabs: typeof chrome.tabs;
}

declare global {
  interface Window {
    chrome: Chrome;
    browser?: typeof browser;
  }
  var chrome: Chrome;
  var browser: typeof browser;
}
