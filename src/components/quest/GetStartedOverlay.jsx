import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '@/components/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { questConfig } from '../../config/questConfig';

const { FiPlay, FiCheck, FiArrowRight, FiX, FiTarget, FiUsers, FiSettings, FiTrendingUp, FiBook } = FiIcons;

const GetStartedOverlay = ({ currentUser }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isMinimized, setIsMinimized] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Coinmate',
      description: 'Let\'s get you started with the basics',
      icon: FiPlay,
      content: 'Welcome to Coinmate! This comprehensive fintech platform helps you manage cryptocurrency trading operations, user accounts, and financial analytics. Let\'s walk through the key features.',
      target: 'dashboard',
      position: { top: '20%', left: '50%' }
    },
    {
      id: 'dashboard',
      title: 'Dashboard Overview',
      description: 'Your command center for real-time data',
      icon: FiTrendingUp,
      content: 'The dashboard shows real-time exchange rates, user balances, transaction volumes, and key performance metrics. You can customize the layout by dragging widgets around.',
      target: 'dashboard',
      position: { top: '30%', left: '20%' }
    },
    {
      id: 'trading',
      title: 'Execute Transactions',
      description: 'Learn how to buy and sell USDT',
      icon: FiTarget,
      content: 'Use the Trade tab to execute buy/sell transactions. Select a user account, enter amounts, choose platforms and banks. The system automatically calculates rates and updates balances.',
      target: 'trade',
      position: { top: '40%', left: '70%' }
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage team members and permissions',
      icon: FiUsers,
      content: 'Add team members, assign bank accounts, manage roles, and track user performance. Different roles have different permissions and access levels.',
      target: 'admin',
      position: { top: '50%', left: '30%' }
    },
    {
      id: 'analytics',
      title: 'Track Performance',
      description: 'Monitor analytics and generate reports',
      icon: FiBook,
      content: 'The Tracker tab provides advanced analytics, charts, and performance insights. Export data and generate reports for your operations.',
      target: 'tracker',
      position: { top: '60%', left: '60%' }
    },
    {
      id: 'settings',
      title: 'System Configuration',
      description: 'Configure your organization settings',
      icon: FiSettings,
      content: 'Configure system settings, manage platforms and banks, adjust balances, and set up integrations in the Administration section.',
      target: 'admin',
      position: { top: '70%', left: '40%' }
    }
  ];

  useEffect(() => {
    // Check if user has seen the guide before
    const hasSeenGuide = localStorage.getItem(`coinmate-guide-seen-${currentUser?.id}`);
    const savedProgress = localStorage.getItem(`coinmate-guide-progress-${currentUser?.id}`);
    
    if (!hasSeenGuide && currentUser) {
      setIsVisible(true);
      setIsMinimized(false);
    }
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCompletedSteps(new Set(progress.completedSteps || []));
        setCurrentStep(progress.currentStep || 0);
      } catch (error) {
        console.error('Error loading guide progress:', error);
      }
    }
  }, [currentUser]);

  const saveProgress = () => {
    if (!currentUser) return;
    
    const progress = {
      currentStep,
      completedSteps: Array.from(completedSteps)
    };
    localStorage.setItem(`coinmate-guide-progress-${currentUser.id}`, JSON.stringify(progress));
  };

  const handleStepComplete = () => {
    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add(currentStep);
    setCompletedSteps(newCompletedSteps);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Guide completed
      localStorage.setItem(`coinmate-guide-seen-${currentUser?.id}`, 'true');
      setIsVisible(false);
    }
    saveProgress();
  };

  const handleSkipGuide = () => {
    localStorage.setItem(`coinmate-guide-seen-${currentUser?.id}`, 'true');
    setIsVisible(false);
  };

  const handleNavigateToTab = (tabId) => {
    window.location.hash = `#${tabId}`;
  };

  const currentStepData = steps[currentStep];
  const progressPercentage = ((completedSteps.size / steps.length) * 100).toFixed(0);

  // Sticky launcher button
  if (!isVisible) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => {
          setIsVisible(true);
          setIsMinimized(false);
        }}
        className="fixed bottom-6 left-6 w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg z-50 flex items-center justify-center transition-all duration-200 hover:scale-110"
        title="Open Getting Started Guide"
      >
        <SafeIcon icon={FiPlay} className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay backdrop */}
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
          )}

          {/* Minimized state */}
          {isMinimized ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="fixed bottom-6 left-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 p-4 max-w-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Getting Started</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMinimized(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <SafeIcon icon={FiPlay} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500"
                  >
                    <SafeIcon icon={FiX} className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </motion.div>
          ) : (
            /* Full guide overlay */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 flex flex-col max-w-4xl mx-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <SafeIcon icon={currentStepData.icon} className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {currentStepData.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Step {currentStep + 1} of {steps.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Minimize"
                  >
                    <div className="w-4 h-0.5 bg-gray-600 dark:bg-gray-400" />
                  </button>
                  <button
                    onClick={handleSkipGuide}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Close guide"
                  >
                    <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {progressPercentage}% Complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto text-center">
                  <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <SafeIcon icon={currentStepData.icon} className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {currentStepData.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                    {currentStepData.description}
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {currentStepData.content}
                    </p>
                  </div>

                  {/* Step indicators */}
                  <div className="flex items-center justify-center space-x-2 mb-8">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentStep
                            ? 'bg-primary-600'
                            : completedSteps.has(index)
                            ? 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSkipGuide}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                >
                  Skip Guide
                </button>
                
                <div className="flex items-center space-x-3">
                  {currentStep > 0 && (
                    <button
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="btn-secondary"
                    >
                      Previous
                    </button>
                  )}
                  
                  {currentStepData.target && (
                    <button
                      onClick={() => handleNavigateToTab(currentStepData.target)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <span>Go to {currentStepData.target}</span>
                      <SafeIcon icon={FiArrowRight} className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={handleStepComplete}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <span>
                      {currentStep === steps.length - 1 ? 'Finish Guide' : 'Next Step'}
                    </span>
                    <SafeIcon icon={currentStep === steps.length - 1 ? FiCheck : FiArrowRight} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default GetStartedOverlay;