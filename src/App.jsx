import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppStateManager } from './services/AppStateManager';
import { SecurityService } from './services/SecurityService';
import { NotificationService } from './services/NotificationService';
import { AnalyticsService } from './services/AnalyticsService';
import { ExchangeRateService } from './services/ExchangeRateService';
import Header from './components/layout/Header';
import TabNavigation from './components/layout/TabNavigation';
import Dashboard from './components/tabs/Dashboard';
import Trade from './components/tabs/Trade';
import ImprovedTrade from './components/tabs/ImprovedTrade';
import EnhancedTrade from './components/tabs/EnhancedTrade';
import Transactions from './components/tabs/Transactions';
import Administration from './components/tabs/Administration';
import SystemSettings from './components/tabs/SystemSettings';
import WhiteLabelingSettings from './components/tabs/WhiteLabelingSettings';
import Logs from './components/tabs/Logs';
import AdvancedAnalytics from './components/tabs/AdvancedAnalytics';
import LoginModal from './components/auth/LoginModal';
import GetStartedOverlay from './components/quest/GetStartedOverlay';
import Toast from './components/common/Toast';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [featureFlags, setFeatureFlags] = useState({
    enableAnalytics: true,
    enableNotifications: true,
    enableAdvancedTrade: false,
    enableWhiteLabeling: false
  });

  // Initialize app state
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      // Initialize AppStateManager
      await AppStateManager.initialize();
      
      // Get current state
      const state = AppStateManager.getState();
      setIsAuthenticated(state.isAuthenticated);
      setFeatureFlags(state.featureFlags);
      
      // Get current user
      const user = AppStateManager.getCurrentUser();
      setCurrentUser(user);
      
      // Show login modal if not authenticated
      if (!state.isAuthenticated) {
        setShowLoginModal(true);
      } else {
        // Initialize services if authenticated
        SecurityService.initialize();
        NotificationService.initialize();
        AnalyticsService.initialize();
        await ExchangeRateService.initialize();
      }
      
      setIsLoading(false);
    };

    initializeApp();

    // Add state listeners
    const stateListener = AppStateManager.addListener('state', (state) => {
      setIsAuthenticated(state.isAuthenticated);
      setFeatureFlags(state.featureFlags);
    });

    const userListener = AppStateManager.addListener('user', (user) => {
      setCurrentUser(user);
    });

    // Clean up
    return () => {
      stateListener();
      userListener();
      SecurityService.cleanup && SecurityService.cleanup();
      NotificationService.cleanup && NotificationService.cleanup();
      AnalyticsService.cleanup && AnalyticsService.cleanup();
    };
  }, []);

  // Handle login
  const handleLogin = async (email, password) => {
    const result = await AppStateManager.loginUser(email, password);
    if (result.success) {
      setShowLoginModal(false);
    }
    return result;
  };

  // Handle logout
  const handleLogout = async () => {
    await AppStateManager.logoutUser();
    setShowLoginModal(true);
  };

  // Handle registration
  const handleRegister = async (email, password, userData) => {
    const result = await AppStateManager.registerUser(email, password, userData);
    if (result.success) {
      setShowLoginModal(false);
    }
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading BaryaBazaar...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Toast notifications */}
        <Toast />

        {/* Login modal */}
        {showLoginModal && (
          <LoginModal
            onLogin={handleLogin}
            onRegister={handleRegister}
            onClose={() => setShowLoginModal(false)}
          />
        )}

        {/* Get started overlay */}
        {showGetStarted && (
          <GetStartedOverlay onClose={() => setShowGetStarted(false)} />
        )}

        {/* Header */}
        <Header
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onLogin={() => setShowLoginModal(true)}
          onLogout={handleLogout}
        />

        {/* Main content */}
        <main className="flex-grow">
          {isAuthenticated ? (
            <div className="container mx-auto px-4 py-6">
              <TabNavigation featureFlags={featureFlags} />
              
              <div className="mt-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/trade" element={<Trade />} />
                  
                  {featureFlags.enableAdvancedTrade && (
                    <>
                      <Route path="/improved-trade" element={<ImprovedTrade />} />
                      <Route path="/enhanced-trade" element={<EnhancedTrade />} />
                    </>
                  )}
                  
                  <Route path="/transactions" element={<Transactions />} />
                  
                  {currentUser?.role === 'admin' || currentUser?.role === 'super_admin' ? (
                    <>
                      <Route path="/administration" element={<Administration />} />
                      <Route path="/system-settings" element={<SystemSettings />} />
                      {featureFlags.enableWhiteLabeling && (
                        <Route path="/white-labeling" element={<WhiteLabelingSettings />} />
                      )}
                      <Route path="/logs" element={<Logs />} />
                    </>
                  ) : null}
                  
                  {featureFlags.enableAnalytics && (
                    <Route path="/analytics" element={<AdvancedAnalytics />} />
                  )}
                  
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </div>
          ) : (
            <div className="container mx-auto px-4 py-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to BaryaBazaar</h2>
              <p className="mb-6">Please log in to access the application.</p>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                onClick={() => setShowLoginModal(true)}
              >
                Log In
              </button>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} BaryaBazaar. All rights reserved.</p>
            <p className="mt-1">Version 1.5.0</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;