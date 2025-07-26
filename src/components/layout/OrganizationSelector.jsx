import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { OrganizationManager } from '../../services/OrganizationManager';

const { FiChevronDown, FiCheck, FiBriefcase } = FiIcons;

const OrganizationSelector = ({ currentUser }) => {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadOrganizations();
    
    const unsubscribe = OrganizationManager.subscribe(org => {
      setCurrentOrganization(org);
    });
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadOrganizations = async () => {
    await OrganizationManager.initialize();
    const orgs = await OrganizationManager.loadOrganizations();
    setOrganizations(orgs);
    setCurrentOrganization(OrganizationManager.getCurrentOrganization());
  };

  const handleSwitchOrganization = async (organizationId) => {
    await OrganizationManager.switchOrganization(organizationId);
    setIsOpen(false);
  };

  // Don't show selector if user is not super admin or if there's only one organization
  if (currentUser.role !== 'super_admin' && organizations.length <= 1) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        {currentOrganization?.logo_url ? (
          <img 
            src={currentOrganization.logo_url} 
            alt={currentOrganization.name} 
            className="w-5 h-5 object-contain"
          />
        ) : (
          <SafeIcon icon={FiBriefcase} className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        )}
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {currentOrganization?.display_name || currentOrganization?.name || 'Select Organization'}
        </span>
        <SafeIcon 
          icon={FiChevronDown} 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 uppercase font-medium">
                Organizations
              </div>
              <div className="max-h-60 overflow-y-auto">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSwitchOrganization(org.id)}
                    className={`w-full flex items-center justify-between space-x-2 px-3 py-2 rounded-md text-left ${
                      currentOrganization?.id === org.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {org.logo_url ? (
                        <img 
                          src={org.logo_url} 
                          alt={org.name} 
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        <SafeIcon icon={FiBriefcase} className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm truncate">
                        {org.display_name || org.name}
                      </span>
                    </div>
                    {currentOrganization?.id === org.id && (
                      <SafeIcon icon={FiCheck} className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                ))}
              </div>
              
              {currentUser.role === 'super_admin' && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <a
                    href="#admin"
                    onClick={() => {
                      setIsOpen(false);
                      window.location.hash = "#admin";
                      // Wait for hash change and then set tab to white-labeling
                      setTimeout(() => {
                        document.dispatchEvent(new CustomEvent('set-admin-tab', { detail: 'white-labeling' }));
                      }, 100);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    Manage Organizations
                  </a>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrganizationSelector;