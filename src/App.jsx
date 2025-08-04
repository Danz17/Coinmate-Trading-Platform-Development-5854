import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/layout/Header';
import TabNavigation from './components/layout/TabNavigation';
import Dashboard from './components/tabs/Dashboard';
import EnhancedTrade from './components/tabs/EnhancedTrade';
import Transactions from './components/tabs/Transactions';
import Logs from './components/tabs/Logs';
import Tracker from './components/tabs/Tracker';
import AdvancedAnalytics from './components/tabs/AdvancedAnalytics';
import EndOfDay from './components/tabs/EndOfDay';
import HRTracking from './components/tabs/HRTracking';
import Administration from './components/tabs/Administration';
import LoginModal from './components/auth/LoginModal';
import ToastContainer from './components/common/Toast';
import GetStartedOverlay from './components/quest/GetStartedOverlay';
import { AppStateManager } from './services/AppStateManager';
import { ExchangeRateService } from './services/ExchangeRateService';
import { NotificationService } from './services/NotificationService';
import { OrganizationManager } from './services/OrganizationManager';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setInitError(null);

      // Initialize app state first
      await AppStateManager.initialize();

      // Initialize organization manager
      await OrganizationManager.initialize();

      // Load user session
      const savedUser = AppStateManager.getCurrentUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      }

      // Load dark mode preference
      const savedDarkMode = localStorage.getItem('coinmate-dark-mode') === 'true';
      setDarkMode(savedDarkMode);
      document.documentElement.classList.toggle('dark', savedDarkMode);

      // Initialize services
      ExchangeRateService.initialize();
      NotificationService.initialize();

    } catch (error) {
      console.error('Failed to initialize app:', error);
      setInitError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (user) => {
    try {
      await AppStateManager.setCurrentUser(user);
      setCurrentUser(user);
      setShowLoginModal(false);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AppStateManager.logout();
      setCurrentUser(null);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('coinmate-dark-mode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // Listen for hash changes to update active tab
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Handle initial hash

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [activeTab]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing Coinmate...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Initialization Error
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {initError}
            </p>
            <button
              onClick={initializeApp}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header
          currentUser={null}
          onLogin={() => setShowLoginModal(true)}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Coinmate
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Comprehensive Fintech Operations Management
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Login to Continue
            </button>
          </div>
        </div>

        {showLoginModal && (
          <LoginModal
            onLogin={handleLogin}
            onClose={() => setShowLoginModal(false)}
          />
        )}
        <ToastContainer />
      </div>
    );
  }

  // Main application
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header
          currentUser={currentUser}
          onLogin={() => setShowLoginModal(true)}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={currentUser.role}
        />

        <main className="container mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'dashboard' && <Dashboard currentUser={currentUser} />}
              {activeTab === 'trade' && <EnhancedTrade currentUser={currentUser} />}
              {activeTab === 'transactions' && <Transactions currentUser={currentUser} />}
              {activeTab === 'logs' && <Logs currentUser={currentUser} />}
              {activeTab === 'tracker' && <Tracker currentUser={currentUser} />}
              {activeTab === 'advanced-analytics' && <AdvancedAnalytics currentUser={currentUser} />}
              {activeTab === 'eod' && <EndOfDay currentUser={currentUser} />}
              {activeTab === 'hr' && <HRTracking currentUser={currentUser} />}
              {activeTab === 'admin' && <Administration currentUser={currentUser} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {showLoginModal && (
          <LoginModal
            onLogin={handleLogin}
            onClose={() => setShowLoginModal(false)}
          />
        )}

        <ToastContainer />
        <GetStartedOverlay currentUser={currentUser} />
      </div>
    </Router>
  );
}

export default App;