import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { supabase, signUp, signIn, getCurrentUser, getSession } from './supabaseClient';

// Splash Screen component
const SplashScreen = ({ onGetStarted }) => {
  return (
    <div className="splash-screen">
      <img src="splash-image.png" alt="Logo" />
      <h1>Lightning Bolt Bug Zapper</h1>
      <p>Quickly fix errors from Bolt.new</p>
      <button onClick={onGetStarted} className="primary-button">Get Started</button>
    </div>
  );
};

// Onboarding component with multi-step form
const OnboardingForm = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    if (step === 1 && !formData.firstName) {
      setError('Please enter your first name');
      return;
    }
    
    if (step === 2 && !formData.email) {
      setError('Please enter your email address');
      return;
    }
    
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        formData.firstName
      );

      if (error) {
        throw error;
      }

      // Show success and complete onboarding
      setStep(4); // Success step
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-form">
      {step === 1 && (
        <div className="form-step">
          <h2>Welcome to Lightning Bolt</h2>
          <p>Let's get to know you better</p>
          <div className="form-group">
            <label htmlFor="firstName">What's your first name?</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button onClick={handleNext} className="primary-button">Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="form-step">
          <h2>Your Email</h2>
          <p>We'll use this to sign you in</p>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="button-group">
            <button onClick={handleBack} className="secondary-button">Back</button>
            <button onClick={handleNext} className="primary-button">Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="form-step">
          <h2>Create Password</h2>
          <p>Make it secure</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="button-group">
              <button type="button" onClick={handleBack} className="secondary-button">Back</button>
              <button type="submit" disabled={loading} className="primary-button">
                {loading ? 'Creating account...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 4 && (
        <div className="form-step success">
          <h2>Success!</h2>
          <p>Your account has been created</p>
          <div className="success-icon">✓</div>
        </div>
      )}
    </div>
  );
};

// Instructions component
const Instructions = () => {
  return (
    <div className="instructions">
      <h2>How to Use Bug Zapper</h2>
      <p>Follow these steps to fix errors on bolt.new:</p>
      <ol>
        <li>Navigate to <a href="https://bolt.new" target="_blank">bolt.new</a></li>
        <li>When you encounter an error, click the extension icon</li>
        <li>Click "Capture Error" to analyze the issue</li>
        <li>Apply the suggested fix to resolve your problem</li>
      </ol>
      <p>Happy coding!</p>
    </div>
  );
};

// Main App component
const App = () => {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await getSession();
        
        if (session) {
          setIsAuthenticated(true);
          setCurrentScreen('instructions');
        } else {
          setCurrentScreen('splash');
        }
      } catch (error) {
        console.error('Session check error:', error);
        setCurrentScreen('splash');
      }
    };

    checkSession();
  }, []);

  const handleGetStarted = () => {
    setCurrentScreen('onboarding');
  };

  const handleOnboardingComplete = () => {
    setIsAuthenticated(true);
    setCurrentScreen('instructions');
  };

  // Show loading screen until we determine authentication state
  if (currentScreen === 'loading') {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="app">
      {currentScreen === 'splash' && (
        <SplashScreen onGetStarted={handleGetStarted} />
      )}
      
      {currentScreen === 'onboarding' && (
        <OnboardingForm onComplete={handleOnboardingComplete} />
      )}
      
      {currentScreen === 'instructions' && (
        <Instructions />
      )}
    </div>
  );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />); 