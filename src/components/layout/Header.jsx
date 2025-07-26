import React from 'react';
import {motion} from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {FiSun, FiMoon, FiLogIn, FiLogOut, FiUser} = FiIcons;

const Header = ({currentUser, onLogin, onLogout, darkMode, onToggleDarkMode}) => {
  return (
    <motion.header
      initial={{y: -50, opacity: 0}}
      animate={{y: 0, opacity: 1}}
      className="bg-white dark:bg-dark-surface shadow-sm border-b border-gray-200 dark:border-dark-border sticky top-0 z-40 lg:relative"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Coinmate
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fintech Operations Management
              </p>
            </div>
          </div>

          {/* User Info and Controls */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <SafeIcon
                icon={darkMode ? FiSun : FiMoon}
                className="w-5 h-5 text-gray-600 dark:text-gray-300"
              />
            </button>

            {currentUser ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </p>
                </div>

                {/* User Avatar */}
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <SafeIcon
                    icon={FiUser}
                    className="w-4 h-4 text-primary-600 dark:text-primary-400"
                  />
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  title="Logout"
                >
                  <SafeIcon
                    icon={FiLogOut}
                    className="w-5 h-5 text-red-600 dark:text-red-400"
                  />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiLogIn} className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;