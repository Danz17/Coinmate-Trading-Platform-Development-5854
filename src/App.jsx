import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestProvider } from '@questlabs/react-sdk';
import '@questlabs/react-sdk/dist/style.css';

import Header from './components/layout/Header';
import TabNavigation from './components/layout/TabNavigation';
import Dashboard from './components/tabs/Dashboard';
import Trade from './components/tabs/Trade';
import Transactions from './components/tabs/Transactions';
import Tracker from './components/tabs/Tracker';
import EndOfDay from './components/tabs/EndOfDay';
import HRTracking from './components/tabs/HRTracking';
import Administration from './components/tabs/Administration';
import GetStartedComponent from './components/quest/GetStartedComponent';
import LoginModal from './components/auth/LoginModal';
import { AppStateManager } from './services/AppStateManager';
import { ExchangeRateService } from './services/ExchangeRateService';
import { NotificationService } from './services/NotificationService';
import { questConfig } from './config/questConfig';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questError, setQuestError] = useState(null);

  useEffect(() => {
    // Initialize app state
    AppStateManager.initialize();

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

    setIsLoading(false);
  }, []);

  const handleLogin = (user) => {
    AppStateManager.setCurrentUser(user);
    setCurrentUser(user);
    setShowLoginModal(false);
    
    // Store user ID for Quest SDK
    localStorage.setItem('userId', user.id.toString());
  };

  const handleLogout = () => {
    AppStateManager.logout();
    setCurrentUser(null);
    setActiveTab('dashboard');
    
    // Clear Quest SDK user ID
    localStorage.removeItem('userId');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('coinmate-dark-mode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
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
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
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
      </div>
    );
  }

  // Create Quest Provider wrapper component
  const QuestWrapper = ({ children }) => {
    if (!questConfig.isValid()) {
      return children;
    }

    try {
      return (
        <QuestProvider
          apiKey={questConfig.APIKEY}
          entityId={questConfig.ENTITYID}
          apiType="PRODUCTION"
          onError={(error) => {
            console.warn('Quest SDK Error:', error);
            setQuestError(error);
          }}
        >
          {children}
        </QuestProvider>
      );
    } catch (error) {
      console.warn('Quest Provider initialization failed:', error);
      setQuestError(error);
      return children;
    }
  };

  return (
    <QuestWrapper>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
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
                {activeTab === 'trade' && <Trade currentUser={currentUser} />}
                {activeTab === 'transactions' && <Transactions currentUser={currentUser} />}
                {activeTab === 'tracker' && <Tracker currentUser={currentUser} />}
                {activeTab === 'eod' && <EndOfDay currentUser={currentUser} />}
                {activeTab === 'hr' && <HRTracking currentUser={currentUser} />}
                {activeTab === 'getstarted' && <GetStartedComponent />}
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
        </div>
      </Router>
    </QuestWrapper>
  );
}

export default App;