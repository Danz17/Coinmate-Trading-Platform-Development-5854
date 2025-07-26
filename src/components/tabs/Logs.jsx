import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { ExportService } from '../../services/ExportService';
import { format } from 'date-fns';

const { FiActivity, FiFilter, FiDownload, FiSearch, FiAlertCircle, FiUser, FiSettings, FiDollarSign } = FiIcons;

const Logs = ({ currentUser }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    type: 'ALL',
    user: '',
    dateRange: { start: '', end: '' },
    search: ''
  });
  const [logTypes] = useState([
    'ALL', 'TRANSACTION', 'BALANCE_ADJUSTMENT', 'USER_MANAGEMENT', 
    'SYSTEM_CONFIG', 'LOGIN', 'LOGOUT', 'ERROR'
  ]);

  useEffect(() => {
    loadLogs();
    const unsubscribe = AppStateManager.subscribe(loadLogs);
    return unsubscribe;
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const loadLogs = () => {
    const systemLogs = AppStateManager.getSystemLogs();
    const hrLogs = AppStateManager.getHRLogs();
    
    // Combine and format logs
    const combinedLogs = [
      ...systemLogs.map(log => ({
        ...log,
        category: 'system',
        icon: getLogIcon(log.type)
      })),
      ...hrLogs.map(log => ({
        ...log,
        category: 'hr',
        type: log.status === 'active' ? 'LOGIN' : 'LOGOUT',
        user: log.user_name,
        timestamp: log.login_time || log.logout_time,
        icon: log.status === 'active' ? FiUser : FiUser
      }))
    ].sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at));

    setLogs(combinedLogs);
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'TRANSACTION': return FiDollarSign;
      case 'BALANCE_ADJUSTMENT': return FiSettings;
      case 'USER_MANAGEMENT': return FiUser;
      case 'LOGIN': case 'LOGOUT': return FiUser;
      case 'ERROR': return FiAlertCircle;
      default: return FiActivity;
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Type filter
    if (filters.type !== 'ALL') {
      filtered = filtered.filter(log => log.type === filters.type);
    }

    // User filter
    if (filters.user) {
      filtered = filtered.filter(log => 
        log.user?.toLowerCase().includes(filters.user.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(filters.user.toLowerCase())
      );
    }

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(log =>
        log.reason?.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.type?.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.note?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp || log.created_at) >= new Date(filters.dateRange.start)
      );
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp || log.created_at) <= new Date(filters.dateRange.end + 'T23:59:59')
      );
    }

    setFilteredLogs(filtered);
  };

  const exportLogs = () => {
    const exportData = filteredLogs.map(log => ({
      'Date/Time': format(new Date(log.timestamp || log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      'Type': log.type,
      'User': log.user || log.user_name || '-',
      'Category': log.category,
      'Reason': log.reason || log.note || '-',
      'Details': log.old_value ? `${log.old_value} → ${log.new_value}` : '-'
    }));
    ExportService.exportToCSV(exportData, 'system_logs.csv');
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'ERROR': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'LOGIN': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'LOGOUT': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'TRANSACTION': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'BALANCE_ADJUSTMENT': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor system activities and audit trails
          </p>
        </div>
        <button
          onClick={exportLogs}
          className="btn-primary flex items-center space-x-2"
        >
          <SafeIcon icon={FiDownload} className="w-4 h-4" />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Log Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="select-field"
            >
              {logTypes.map(type => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User
            </label>
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={filters.user}
                onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                className="input-field pl-10"
                placeholder="Filter by user"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              className="input-field"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input-field pl-10"
              placeholder="Search in reasons, notes, and descriptions..."
            />
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Activity Logs ({filteredLogs.length})
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <SafeIcon icon={FiFilter} className="w-4 h-4" />
              <span>Showing {filteredLogs.length} of {logs.length} logs</span>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredLogs.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={log.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full ${getLogColor(log.type)}`}>
                      <SafeIcon icon={log.icon} className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.type.replace('_', ' ')}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(log.timestamp || log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">User:</span> {log.user || log.user_name || 'System'}
                      </div>
                      
                      {log.reason && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <span className="font-medium">Reason:</span> {log.reason}
                        </p>
                      )}
                      
                      {log.old_value && log.new_value && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <span className="font-medium">Change:</span> {JSON.stringify(log.old_value)} → {JSON.stringify(log.new_value)}
                        </div>
                      )}
                      
                      {log.total_hours && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Duration:</span> {log.total_hours}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <SafeIcon icon={FiActivity} className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No logs found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;