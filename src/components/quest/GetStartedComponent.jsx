import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { questConfig } from '../../config/questConfig';

const { FiPlay, FiCheck, FiArrowRight, FiBook, FiTarget, FiUsers, FiSettings, FiTrendingUp } = FiIcons;

const GetStartedComponent = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Coinmate',
      description: 'Get familiar with your fintech operations management platform',
      icon: FiPlay,
      content: 'Coinmate is your comprehensive solution for managing cryptocurrency trading operations, user accounts, and financial analytics.',
      action: 'Get Started'
    },
    {
      id: 'dashboard',
      title: 'Explore Dashboard',
      description: 'Learn about key metrics and real-time data',
      icon: FiTrendingUp,
      content: 'The dashboard provides real-time insights into your trading operations, including exchange rates, user balances, and transaction volumes.',
      action: 'View Dashboard'
    },
    {
      id: 'trading',
      title: 'Trading Interface',
      description: 'Master the buy/sell transaction system',
      icon: FiTarget,
      content: 'Execute buy and sell transactions with automatic rate calculations, balance updates, and comprehensive transaction logging.',
      action: 'Try Trading'
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage team members and permissions',
      icon: FiUsers,
      content: 'Add team members, assign bank accounts, manage roles, and track user performance across your organization.',
      action: 'Manage Users'
    },
    {
      id: 'analytics',
      title: 'Analytics & Tracking',
      description: 'Monitor performance and generate reports',
      icon: FiBook,
      content: 'Access advanced analytics, generate reports, and track key performance indicators to optimize your operations.',
      action: 'View Analytics'
    },
    {
      id: 'settings',
      title: 'System Configuration',
      description: 'Configure integrations and preferences',
      icon: FiSettings,
      content: 'Set up Telegram notifications, exchange rate APIs, user permissions, and other system preferences.',
      action: 'Configure System'
    }
  ];

  useEffect(() => {
    // Load completed steps from localStorage
    const saved = localStorage.getItem('coinmate-onboarding-progress');
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        setCompletedSteps(new Set(progress.completedSteps || []));
        setCurrentStep(progress.currentStep || 0);
      } catch (error) {
        console.error('Error loading onboarding progress:', error);
      }
    }
  }, []);

  const saveProgress = (step, completed) => {
    const newCompletedSteps = new Set(completedSteps);
    if (completed) {
      newCompletedSteps.add(step);
    }
    
    const progress = {
      currentStep: step,
      completedSteps: Array.from(newCompletedSteps)
    };
    
    localStorage.setItem('coinmate-onboarding-progress', JSON.stringify(progress));
    setCompletedSteps(newCompletedSteps);
  };

  const handleStepAction = async (stepIndex) => {
    setIsLoading(true);
    
    // Simulate action processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const stepId = steps[stepIndex].id;
    saveProgress(stepIndex, true);
    
    // Navigate to next step if not the last one
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
    
    setIsLoading(false);
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
    saveProgress(stepIndex, false);
  };

  const resetProgress = () => {
    localStorage.removeItem('coinmate-onboarding-progress');
    setCompletedSteps(new Set());
    setCurrentStep(0);
  };

  const currentStepData = steps[currentStep];
  const progressPercentage = ((completedSteps.size / steps.length) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Get Started with Coinmate
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete your onboarding journey and master the platform
          </p>
        </div>
        <button
          onClick={resetProgress}
          className="btn-secondary text-sm"
        >
          Reset Progress
        </button>
      </div>

      {/* Progress Overview */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Progress Overview
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedSteps.size} of {steps.length} completed
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {progressPercentage}% Complete
        </div>
      </div>

      {/* Step Navigation */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Learning Path
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = currentStep === index;
            
            return (
              <motion.button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`p-4 rounded-lg text-left transition-all duration-200 ${
                  isCurrent
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
                    : isCompleted
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    <SafeIcon
                      icon={isCompleted ? FiCheck : step.icon}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      isCurrent
                        ? 'text-primary-900 dark:text-primary-100'
                        : isCompleted
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {step.title}
                    </h4>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card p-8"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <SafeIcon
              icon={currentStepData.icon}
              className="w-8 h-8 text-primary-600 dark:text-primary-400"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {currentStepData.description}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => currentStep > 0 && goToStep(currentStep - 1)}
              disabled={currentStep === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={() => handleStepAction(currentStep)}
              disabled={isLoading}
              className="btn-primary flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{currentStepData.action}</span>
                  <SafeIcon icon={FiArrowRight} className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Completion Status */}
      {completedSteps.size === steps.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 text-center bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <SafeIcon icon={FiCheck} className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Congratulations! 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You've completed the Coinmate onboarding process. You're now ready to use all platform features effectively.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={resetProgress}
              className="btn-secondary"
            >
              Start Over
            </button>
            <button
              onClick={() => window.location.hash = '#dashboard'}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      )}

      {/* Quest SDK Integration Status */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-center space-x-3">
          <SafeIcon icon={FiBook} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Quest SDK Integration
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {questConfig.isValid() 
                ? 'Quest SDK is properly configured and ready to use.'
                : 'Quest SDK configuration needs to be completed in the system settings.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetStartedComponent;