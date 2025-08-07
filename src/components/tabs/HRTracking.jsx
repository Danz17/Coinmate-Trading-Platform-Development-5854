import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '@/components/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { ExportService } from '../../services/ExportService';
import { format, differenceInSeconds } from 'date-fns';

const { FiClock, FiLogOut, FiDownload, FiUser, FiUsers } = FiIcons;

const HRTracking = ({ currentUser }) => {
  const [hrLogs, setHrLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [todayActivity, setTodayActivity] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    loadData();
    
    const unsubscribe = AppStateManager.subscribe(loadData);
    
    // Update current time every second for session duration calculation
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);
  
  const loadData = () => {
    const allUsers = AppStateManager.getUsers();
    const logs = AppStateManager.getHRLogs();
    
    setUsers(allUsers);
    setHrLogs(logs);
    
    // Find current user's active session
    const activeSession = logs.find(
      log => log.user === currentUser.name && log.status === 'active'
    );
    
    setCurrentSession(activeSession);
    
    // Find all currently online users
    const online = allUsers.filter(user => user.isLoggedIn);
    setActiveUsers(online);
    
    // Get today's activity
    const today = new Date().toLocaleDateString();
    const todayLogs = logs.filter(log => 
      new Date(log.loginTime).toLocaleDateString() === today
    );
    
    setTodayActivity(todayLogs);
  };
  
  const formatDuration = (loginTime) => {
    if (!loginTime) return '0:00:00';
    
    const loginDate = new Date(loginTime);
    const diffSeconds = differenceInSeconds(currentTime, loginDate);
    
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleManualLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      AppStateManager.logout();
      window.location.reload();
    }
  };
  
  const exportToCSV = () => {
    const exportData = hrLogs.map(log => ({
      User: log.user,
      'Login Time': log.loginTime,
      'Logout Time': log.logoutTime,
      'Total Hours': log.totalHours,
      Status: log.status,
      'Logout Type': log.logoutType || '-'
    }));
    
    ExportService.exportToCSV(exportData, 'hr_time_logs.csv');
  };
  
  const exportToPDF = () => {
    ExportService.exportHRLogsToPDF(hrLogs, 'HR Time Logs');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            HR Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor user sessions and activity
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center space-x-2"
          >
            <SafeIcon icon={FiDownload} className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={exportToPDF}
            className="btn-secondary flex items-center space-x-2"
          >
            <SafeIcon icon={FiDownload} className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
      
      {/* Current Session */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Current Session
          </h2>
          <SafeIcon icon={FiClock} className="w-6 h-6 text-blue-600" />
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="space-y-2 mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">Login Time:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {currentSession?.loginTime || 'Not available'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">Current Duration:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {currentSession 
                    ? formatDuration(currentSession.loginTime)
                    : '0:00:00'
                  }
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="status-badge status-active">
                  Active
                </span>
              </div>
            </div>
            
            <button
              onClick={handleManualLogout}
              className="btn-danger flex items-center space-x-2"
            >
              <SafeIcon icon={FiLogOut} className="w-4 h-4" />
              <span>Manual Logout</span>
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Currently Online */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Currently Online
          </h2>
          <SafeIcon icon={FiUsers} className="w-6 h-6 text-green-600" />
        </div>
        
        <div className="space-y-3">
          {activeUsers.length > 0 ? (
            activeUsers.map((user) => {
              const userLog = hrLogs.find(
                log => log.user === user.name && log.status === 'active'
              );
              
              return (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <SafeIcon icon={FiUser} className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {user.role.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {userLog ? formatDuration(userLog.loginTime) : '0:00:00'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Since {userLog ? format(new Date(userLog.loginTime), 'HH:mm') : 'Unknown'}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No other users currently online
            </p>
          )}
        </div>
      </motion.div>
      
      {/* Today's Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Today's Activity
          </h2>
          <SafeIcon icon={FiClock} className="w-6 h-6 text-purple-600" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Login Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Logout Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Logout Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {todayActivity.length > 0 ? (
                todayActivity.map((log, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {log.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.loginTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.logoutTime === 'Active' ? (
                        <span className="text-green-600 dark:text-green-400">Currently Active</span>
                      ) : (
                        log.logoutTime
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.status === 'active' ? formatDuration(log.loginTime) : log.totalHours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${
                        log.status === 'active' ? 'status-active' : 'status-completed'
                      }`}>
                        {log.status === 'active' ? 'Active' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.logoutType || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No activity recorded today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default HRTracking;