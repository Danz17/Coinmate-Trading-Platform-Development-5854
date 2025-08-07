import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import SafeIcon from '@/components/common/SafeIcon';

const TabNavigation = ({ featureFlags }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current path without leading slash
    const path = location.pathname.slice(1) || 'dashboard';
    setActiveTab(path);
    
    // Update app state with selected tab
    AppStateManager.setSelectedTab(path);
    
    // Get current user
    const user = AppStateManager.getCurrentUser();
    setCurrentUser(user);
    
    // Add user change listener
    const removeListener = AppStateManager.addListener('user', (user) => {
      setCurrentUser(user);
    });
    
    return () => removeListener();
  }, [location.pathname]);

  // Define tab items based on user role and feature flags
  const getTabs = () => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const isAnalyst = currentUser?.role === 'analyst';
    
    const tabs = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: FiIcons.FiPieChart,
        path: '/dashboard'
      },
      {
        id: 'trade',
        label: 'Trade',
        icon: FiIcons.FiRepeat,
        path: '/trade'
      },
      {
        id: 'transactions',
        label: 'Transactions',
        icon: FiIcons.FiList,
        path: '/transactions'
      }
    ];
    
    // Add admin tabs
    if (isAdmin) {
      tabs.push({
        id: 'administration',
        label: 'Administration',
        icon: FiIcons.FiUsers,
        path: '/administration'
      });
      
      tabs.push({
        id: 'system-settings',
        label: 'Settings',
        icon: FiIcons.FiSettings,
        path: '/system-settings'
      });
      
      tabs.push({
        id: 'logs',
        label: 'Logs',
        icon: FiIcons.FiFileText,
        path: '/logs'
      });
    }
    
    // Add white labeling tab for super admins
    if (isSuperAdmin && featureFlags.enableWhiteLabeling) {
      tabs.push({
        id: 'white-labeling',
        label: 'White Label',
        icon: FiIcons.FiPenTool,
        path: '/white-labeling'
      });
    }
    
    // Add analytics tab if enabled
    if ((isAdmin || isAnalyst) && featureFlags.enableAnalytics) {
      tabs.push({
        id: 'analytics',
        label: 'Analytics',
        icon: FiIcons.FiBarChart2,
        path: '/analytics'
      });
    }
    
    // Add advanced trade tabs if enabled
    if (featureFlags.enableAdvancedTrade) {
      // Find the index of the trade tab
      const tradeIndex = tabs.findIndex(tab => tab.id === 'trade');
      
      // Insert advanced trade tabs after the trade tab
      if (tradeIndex !== -1) {
        tabs.splice(tradeIndex + 1, 0, 
          {
            id: 'improved-trade',
            label: 'Pro Trade',
            icon: FiIcons.FiTrendingUp,
            path: '/improved-trade'
          },
          {
            id: 'enhanced-trade',
            label: 'Advanced',
            icon: FiIcons.FiActivity,
            path: '/enhanced-trade'
          }
        );
      }
    }
    
    return tabs;
  };

  const tabs = getTabs();

  return (
    <nav className="bg-white rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <div className="flex min-w-full">
          {tabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) => 
                `relative flex items-center px-4 py-3 text-sm font-medium transition-colors
                ${isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                } flex-1 justify-center whitespace-nowrap`
              }
            >
              {({ isActive }) => (
                <>
                  <SafeIcon 
                    icon={tab.icon} 
                    className={`mr-2 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} 
                    size={18} 
                  />
                  <span>{tab.label}</span>
                  
                  {isActive && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                      layoutId="activeTab"
                      initial={false}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

TabNavigation.propTypes = {
  featureFlags: PropTypes.shape({
    enableAnalytics: PropTypes.bool,
    enableNotifications: PropTypes.bool,
    enableAdvancedTrade: PropTypes.bool,
    enableWhiteLabeling: PropTypes.bool
  })
};

TabNavigation.defaultProps = {
  featureFlags: {
    enableAnalytics: true,
    enableNotifications: true,
    enableAdvancedTrade: false,
    enableWhiteLabeling: false
  }
};

export default TabNavigation;