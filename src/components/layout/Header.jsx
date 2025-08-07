import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '@/components/common/SafeIcon';
import RoleBadge from '../common/RoleBadge';

const Header = ({ onLogout, user, organization }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    onLogout();
    setShowUserMenu(false);
  };

  const goToSettings = (settingsType) => {
    navigate(`/${settingsType}`);
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          {organization?.logo_url ? (
            <img 
              src={organization.logo_url} 
              alt="Organization Logo" 
              className="h-10 mr-3" 
            />
          ) : (
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600 mr-2">B</span>
              <span className="text-lg font-medium">BaryaBazaar</span>
            </div>
          )}
          
          {organization && (
            <div className="ml-6 px-3 py-1 bg-gray-100 rounded-md flex items-center">
              <SafeIcon icon={FiIcons.FiHome} className="text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-800">{organization.name}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          {/* Notification Icon */}
          <button className="p-2 rounded-full hover:bg-gray-100 relative mr-2">
            <SafeIcon icon={FiIcons.FiBell} className="text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* User Profile */}
          <div className="relative">
            <motion.button
              className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
              onClick={toggleUserMenu}
              whileTap={{ scale: 0.97 }}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-800">{user?.name || 'User'}</div>
                <RoleBadge role={user?.role || 'user'} />
              </div>
              <SafeIcon 
                icon={showUserMenu ? FiIcons.FiChevronUp : FiIcons.FiChevronDown} 
                className="text-gray-600" 
              />
            </motion.button>
            
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
              >
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-800">{user?.name}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  
                  {user?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => goToSettings('system-settings')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <SafeIcon icon={FiIcons.FiSettings} className="mr-2" />
                        System Settings
                      </button>
                      <button
                        onClick={() => goToSettings('branding')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <SafeIcon icon={FiIcons.FiPackage} className="mr-2" />
                        Branding
                      </button>
                    </>
                  )}
                  
                  {user?.role === 'super_admin' && (
                    <button
                      onClick={() => goToSettings('white-labeling')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <SafeIcon icon={FiIcons.FiLayers} className="mr-2" />
                      White Labeling
                    </button>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center"
                  >
                    <SafeIcon icon={FiIcons.FiLogOut} className="mr-2" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;