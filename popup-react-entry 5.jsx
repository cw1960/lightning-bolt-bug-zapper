import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './authContext'; // Assuming authContext.tsx is in the same directory

// --- UI Components (Basic Structure - Adapt Styling/Content as needed) ---

const SplashScreen = () => (
    <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        padding: '20px'
    }}>
        <img src="splash-image.png" alt="Lightning Bolt Bug Zapper" style={{ maxWidth: '200px', marginBottom: '20px' }} />
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Lightning Bolt</h1>
        <p style={{ textAlign: 'center' }}>Bug Zapper</p>
    </div>
);

const Onboarding = ({ onComplete }) => {
    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [claudeKey, setClaudeKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!claudeKey && !geminiKey) {
            setError('At least one API key (Claude or Gemini) is required.');
            setLoading(false);
            return;
        }

        try {
            const userData = { firstName, claudeKey, geminiKey };
            const { error: signUpError } = await signUp(email, password, userData);

            if (signUpError) {
                setError(signUpError.message || 'Failed to sign up.');
            } else {
                // Automatically transition after successful signup
                // onComplete will likely be called by the auth state change listener
            }
        } catch (err) {
            setError('An unexpected error occurred during sign up.');
            console.error("Sign up error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Basic form structure - Apply your original CSS classes
    return (
        <div id="onboarding-view"> {/* Use original ID/classes for styling */} 
            <h1>Welcome to Lightning Bolt</h1>
            <p>Let's get you set up to start fixing bugs instantly.</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} id="onboarding-form"> {/* Use original ID/classes */} 
                <div className="form-group"> {/* Use original class */} 
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Enter your first name" required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" required />
                </div>
                <div className="form-group">
                    <label htmlFor="claudeKey">Anthropic Claude 3.5 Sonnet API Key (Optional)</label>
                    <input type="password" id="claudeKey" value={claudeKey} onChange={(e) => setClaudeKey(e.target.value)} placeholder="Enter your Claude API key" />
                </div>
                <div className="form-group">
                    <label htmlFor="geminiKey">Google Gemini 2.5 API Key (Optional)</label>
                    <input type="password" id="geminiKey" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="Enter your Gemini API key" />
                </div>
                <p className="form-note">At least one API key is required to use the extension.</p>
                <button type="submit" disabled={loading} id="saveOnboardingBtn"> {/* Use original ID/classes */} 
                    {loading ? 'Saving...' : 'Save and Continue'}
                </button>
            </form>
        </div>
    );
};

const Instructions = ({ onComplete }) => (
    <div id="instructions-view"> {/* Use original ID/classes */} 
        <h1>How to Use Lightning Bolt</h1>
        {/* Add your instruction steps here using original structure/classes */}
        <div className="instruction-step">...</div>
        <button onClick={onComplete} id="gotItBtn" className="center-button">I Got It!</button> {/* Use original ID/classes */} 
    </div>
);

const MainApp = () => {
    const { user, userSettings, signOut, loading } = useAuth();

    // Add state and functions for error/code selection, fix generation
    const [selectedError, setSelectedError] = useState(null);
    const [selectedCode, setSelectedCode] = useState(null);
    const [generatedFix, setGeneratedFix] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSelectError = () => { /* TODO: Implement interaction with content script */ };
    const handleSelectCode = () => { /* TODO: Implement interaction with content script */ };
    const handleGenerateFix = async () => {
        setIsGenerating(true);
        setGeneratedFix(null);
        // TODO: Call LLM API using stored keys (userSettings?.claude_api_key, etc.)
        // with selectedError and selectedCode
        // Example:
        // const fix = await callLlmApi(selectedError, selectedCode, userSettings);
        // setGeneratedFix(fix);
        setIsGenerating(false);
    };
    const handleCopyFix = () => {
        if (generatedFix) {
            navigator.clipboard.writeText(generatedFix);
            // Optional: Show a 'Copied!' message
        }
    };

    const handleSignOut = async () => {
        await signOut();
        // App view will change automatically via AuthProvider
    };

    if (loading) {
        return <div>Loading user data...</div>;
    }

    if (!user) {
        // This shouldn't typically be reached if routing is correct, but good fallback
        return <div>Please sign in.</div>;
    }

    // TODO: Add logic for free trial / subscription checks based on user/userSettings
    const isFreeTrial = true; // Placeholder
    const remainingFixes = 5; // Placeholder

    return (
        <div id="main-app-view"> {/* Use original ID/classes */} 
            <div className="user-info"> {/* Use original class */} 
                <span className="user-name">{user.email}</span> {/* Or user.user_metadata?.display_name */} 
                <button onClick={handleSignOut} className="signout-button" id="signOutBtn">Sign Out</button>
            </div>

            {isFreeTrial && (
                <div id="free-trial-banner" className="free-trial-banner"> {/* Use original ID/classes */} 
                    <span>You have <strong>{remainingFixes}</strong> free fixes remaining.</span>
                    <button className="upgrade-button" id="upgradeBtn">Upgrade for $10/month</button>
                </div>
            )}

            <h1>Lightning Bolt Bug Zapper</h1>
            <p>Quickly capture error messages...</p>

            <div className="button-group">
                <button onClick={handleSelectError} id="errorBtn" className="error-button">Select Error Message</button>
                <button onClick={handleSelectCode} id="codeBtn" className="code-button">Select Code Block</button>
            </div>

            <div className="section">
                <h2>Selected Content</h2>
                {/* TODO: Display selectedError and selectedCode */} 
            </div>

            <div className="section">
                <button 
                    onClick={handleGenerateFix} 
                    disabled={!selectedError || !selectedCode || isGenerating}
                    id="generateFixBtn"
                >
                    {isGenerating ? 'Generating...' : 'Generate Fix'}
                </button>
                {generatedFix && (
                    <div id="fixResult">
                        <h3>Suggested Fix:</h3>
                        <pre id="fixCode" className="code-block">{generatedFix}</pre>
                        <button onClick={handleCopyFix} id="copyFixBtn">Copy to Clipboard</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Application Logic ---

const App = () => {
    const { session, user, loading: authLoading } = useAuth();
    const [currentView, setCurrentView] = useState('splash'); // splash, onboarding, instructions, main
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Splash screen timer
        const splashTimer = setTimeout(() => {
            setShowSplash(false);
        }, 2500); // Match original splash duration

        return () => clearTimeout(splashTimer);
    }, []);

    useEffect(() => {
        if (showSplash || authLoading) {
            setCurrentView('splash');
        } else if (!session) {
            // If no session after splash/loading, show onboarding/login
            // TODO: Add a Login view if you want separate login/signup
            setCurrentView('onboarding');
        } else if (session) {
            // User is logged in
            // TODO: Add logic here to check if user needs to see instructions
            // e.g., check a flag in localStorage or userSettings
            const seenInstructions = localStorage.getItem('seenInstructions');
            if (!seenInstructions) {
                 setCurrentView('instructions');
            } else {
                 setCurrentView('main');
            }
        }
    }, [session, user, showSplash, authLoading]);

    const handleInstructionsComplete = () => {
        localStorage.setItem('seenInstructions', 'true');
        setCurrentView('main');
    };

    const handleOnboardingComplete = () => {
        // Auth state change should automatically move user to instructions/main
        console.log("Onboarding potentially complete, waiting for auth state change...");
    };

    if (currentView === 'splash') {
        return <SplashScreen />;
    }
    if (currentView === 'onboarding') {
        return <Onboarding onComplete={handleOnboardingComplete} />;
    }
    if (currentView === 'instructions') {
        return <Instructions onComplete={handleInstructionsComplete} />;
    }
    if (currentView === 'main') {
        return <MainApp />;
    }

    return <div>Error: Unknown view state</div>; // Fallback
};

// --- Render the Application ---

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded - initializing app');
    const container = document.getElementById('root');
    if (container) {
        const root = createRoot(container);
        root.render(
            <React.StrictMode>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </React.StrictMode>
        );
    } else {
        console.error('Failed to find the root element');
    }
}); 