import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { RoleManager } from '../../services/RoleManager';

const { FiHome, FiTrendingUp, FiList, FiBarChart3, FiSun, FiClock, FiSettings, FiActivity, FiFileText } = FiIcons;

const TabNavigation = ({ activeTab, onTabChange, userRole }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'FiHome', permission: 'view_own_data' },
    { id: 'trade', label: 'Trade', icon: 'FiTrendingUp', permission: 'trade_own_account' },
    { id: 'transactions', label: 'Transactions', icon: 'FiList', permission: 'view_own_data' },
    { id: 'logs', label: 'Logs', icon: 'FiFileText', permission: 'view_own_data' },
    { id: 'tracker', label: 'Tracker', icon: 'FiBarChart3', permission: 'view_analytics' },
    { id: 'advanced-analytics', label: 'Advanced Analytics', icon: 'FiActivity', permission: 'advanced_analytics' },
    { id: 'eod', label: 'End of Day', icon: 'FiSun', permission: 'execute_eod' },
    { id: 'hr', label: 'HR Tracking', icon: 'FiClock', permission: 'view_hr_logs' },
    { id: 'admin', label: 'Administration', icon: 'FiSettings', permission: 'manage_users' }
  ].filter(item => RoleManager.hasPermission(userRole, item.permission));

  return (
    <nav className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border sticky top-16 z-30 lg:static lg:top-0">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                flex items-center space-x-2 px-4 py-3 rounded-t-lg font-medium transition-all duration-200 whitespace-nowrap
                ${activeTab === item.id
                  ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
            >
              <SafeIcon icon={FiIcons[item.icon]} className="w-4 h-4" />
              <span>{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default TabNavigation;