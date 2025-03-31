// Main App component file for the Lightning Bolt Bug Zapper Chrome Extension
import { Suspense, useEffect, useState } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import Auth from "./components/Auth";
import Payment from "./components/Payment";
import LandingPage from "./components/LandingPage";
import Instructions from "./components/Instructions";
import Onboarding from "./components/Onboarding";
import routes from "tempo-routes";
import { AuthProvider, useAuth } from "./lib/authContext";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { user, loading } = useAuth();
  const [browserInfo, setBrowserInfo] = useState<{
    name: string;
    isCompatible: boolean;
  } | null>(null);

  useEffect(() => {
    // Check browser compatibility on app load
    const detectBrowser = () => {
      const userAgent = navigator.userAgent;

      if (userAgent.indexOf("Firefox") > -1) {
        return "firefox";
      } else if (
        userAgent.indexOf("Edge") > -1 ||
        userAgent.indexOf("Edg") > -1
      ) {
        return "edge";
      } else if (userAgent.indexOf("Chrome") > -1) {
        return "chrome";
      } else if (userAgent.indexOf("Safari") > -1) {
        return "safari";
      } else {
        return "unknown";
      }
    };

    // Check if we have the required APIs
    const checkCompatibility = () => {
      const browserName = detectBrowser();
      const hasRequiredAPIs =
        typeof chrome !== "undefined" &&
        !!chrome.runtime &&
        !!chrome.storage &&
        !!chrome.scripting;

      setBrowserInfo({
        name: browserName,
        isCompatible: hasRequiredAPIs,
      });
    };

    checkCompatibility();
  }, []);

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        {browserInfo && !browserInfo.isCompatible && (
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4"
            role="alert"
          >
            <p className="font-bold">Browser Compatibility Warning</p>
            <p>
              Your browser ({browserInfo.name}) may not fully support all
              features of this extension. For the best experience, please use
              Chrome or Edge.
            </p>
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={
              loading ? (
                <div className="flex items-center justify-center h-screen">
                  Loading...
                </div>
              ) : user ? (
                <Home />
              ) : (
                <LandingPage />
              )
            }
          />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment userId={user?.id} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructions"
            element={
              <ProtectedRoute>
                <Instructions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute>
                <div className="flex flex-col items-center justify-center h-screen">
                  <h1 className="text-2xl font-bold mb-4">
                    Payment Successful!
                  </h1>
                  <p className="mb-6">Your subscription has been activated.</p>
                  <button
                    onClick={() => (window.location.href = "/instructions")}
                    className="px-4 py-2 bg-primary text-white rounded-md"
                  >
                    Continue to Instructions
                  </button>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-cancel"
            element={
              <ProtectedRoute>
                <div className="flex flex-col items-center justify-center h-screen">
                  <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
                  <p className="mb-6">
                    Your payment was cancelled. No charges were made.
                  </p>
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="px-4 py-2 bg-primary text-white rounded-md"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
