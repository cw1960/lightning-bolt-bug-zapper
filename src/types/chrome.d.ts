// Type definitions for Chrome extension API

interface Chrome {
  storage: {
    sync: {
      get: (keys: string[] | object, callback: (result: any) => void) => void;
      set: (items: object, callback?: () => void) => void;
    };
  };
  runtime: {
    id: string;
    onMessage: {
      addListener: (
        callback: (message: any, sender: any, sendResponse: any) => void,
      ) => void;
      removeListener: (
        callback: (message: any, sender: any, sendResponse: any) => void,
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
  };
}

declare global {
  interface Window {
    chrome: Chrome;
  }
  var chrome: Chrome;
}
