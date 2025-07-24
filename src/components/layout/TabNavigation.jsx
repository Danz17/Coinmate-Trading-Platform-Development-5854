import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiHome, 
  FiTrendingUp, 
  FiList, 
  FiBarChart3, 
  FiSun, 
  FiClock, 
  FiSettings 
} = FiIcons;

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome, roles: ['super_admin', 'admin', 'supervisor', 'analyst'] },
  { id: 'trade', label: 'Trade', icon: FiTrendingUp, roles: ['super_admin', 'admin', 'supervisor', 'analyst'] },
  { id: 'transactions', label: 'Transactions', icon: FiList, roles: ['super_admin', 'admin', 'supervisor', 'analyst'] },
  { id: 'tracker', label: 'Tracker', icon: FiBarChart3, roles: ['super_admin', 'admin', 'supervisor', 'analyst'] },
  { id: 'eod', label: 'End of Day', icon: FiSun, roles: ['super_admin', 'admin', 'supervisor'] },
  { id: 'hr', label: 'HR Tracking', icon: FiClock, roles: ['super_admin', 'admin', 'supervisor', 'analyst'] },
  { id: 'admin', label: 'Administration', icon: FiSettings, roles: ['super_admin', 'admin'] }
];

const TabNavigation = ({ activeTab, onTabChange, userRole }) => {
  const availableTabs = tabs.filter(tab => tab.roles.includes(userRole));

  return (
    <nav className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {availableTabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center space-x-2 px-4 py-3 rounded-t-lg font-medium transition-all duration-200 whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
            >
              <SafeIcon icon={tab.icon} className="w-4 h-4" />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default TabNavigation;