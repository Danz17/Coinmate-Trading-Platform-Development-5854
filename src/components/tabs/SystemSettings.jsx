import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '@/components/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { toastManager } from '@/components/common/Toast';
import { AppStateManager } from '../../services/AppStateManager';

const { FiSave, FiClock, FiDollarSign, FiSettings, FiRefreshCw, FiGlobe, FiBell } = FiIcons;

const SystemSettings = ({ currentUser }) => {
  const [settings, setSettings] = useState({
    daily_profit_reset_time: '01:00',
    total_invested_funds: 0,
    timezone: 'Asia/Manila',
    exchange_rate_update_interval: 300000,
    dashboard_refresh_interval: 10000,
    notifications_enabled: true,
    telegram_bot_token: '',
    telegram_chat_id: '',
    coingecko_api_key: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const systemSettings = AppStateManager.getSystemSettings();
      if (systemSettings && Object.keys(systemSettings).length > 0) {
        setSettings(prev => ({ ...prev, ...systemSettings }));
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
      toastManager.error('Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentUser || !['super_admin', 'admin'].includes(currentUser.role)) {
      toastManager.error('Insufficient permissions to save system settings');
      return;
    }

    setIsSaving(true);
    try {
      await AppStateManager.updateSystemSettings(settings);
      setHasChanges(false);
      toastManager.success('System settings saved successfully');
    } catch (error) {
      console.error('Error saving system settings:', error);
      toastManager.error('Failed to save system settings');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateROI = () => {
    if (!settings.total_invested_funds || settings.total_invested_funds === 0) return 0;
    const totalCompanyUSDT = AppStateManager.getTotalCompanyUSDT() || 0;
    const currentRate = AppStateManager.getAverageBuyRate() || 56.25; // Fallback to a reasonable rate
    const currentValue = totalCompanyUSDT * currentRate;
    return ((currentValue - settings.total_invested_funds) / settings.total_invested_funds) * 100;
  };

  const formatInterval = (ms) => {
    if (!ms) return '0s';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure core system parameters and calculations
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving || !['super_admin', 'admin'].includes(currentUser.role)}
          className={`btn-primary flex items-center space-x-2 ${!hasChanges || !['super_admin', 'admin'].includes(currentUser.role) ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Save system settings"
        >
          <SafeIcon icon={isSaving ? FiRefreshCw : FiSave} className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Permission Warning */}
      {!['super_admin', 'admin'].includes(currentUser.role) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Read-only mode:</strong> You don't have permission to modify system settings.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Profit Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <SafeIcon icon={FiClock} className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Profit Settings
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reset Time ({settings.timezone})
              </label>
              <input
                type="time"
                value={settings.daily_profit_reset_time}
                onChange={(e) => handleChange('daily_profit_reset_time', e.target.value)}
                className="input-field"
                disabled={!['super_admin', 'admin'].includes(currentUser.role)}
                aria-label="Daily profit reset time"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Daily profit calculation will reset at this time each day
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="select-field"
                disabled={!['super_admin', 'admin'].includes(currentUser.role)}
                aria-label="Select timezone"
              >
                <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                <option value="UTC">UTC (UTC+0)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Capital Tracking - Now available to admins */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <SafeIcon icon={FiDollarSign} className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Capital Tracking
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Invested Funds (PHP)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.total_invested_funds}
                onChange={(e) => handleChange('total_invested_funds', parseFloat(e.target.value) || 0)}
                className="input-field"
                placeholder="Enter total invested amount"
                disabled={!['super_admin', 'admin'].includes(currentUser.role)}
                aria-label="Total invested funds"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Track initial capital investment for ROI calculations
              </p>
            </div>
            
            {/* ROI Display */}
            {settings.total_invested_funds > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current ROI:
                  </span>
                  <span className={`text-sm font-semibold ${calculateROI() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateROI().toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Based on current USDT holdings and exchange rate
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* System Intervals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <SafeIcon icon={FiRefreshCw} className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Intervals
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exchange Rate Update Interval
              </label>
              <select
                value={settings.exchange_rate_update_interval}
                onChange={(e) => handleChange('exchange_rate_update_interval', parseInt(e.target.value))}
                className="select-field"
                disabled={!['super_admin', 'admin'].includes(currentUser.role)}
              >
                <option value={60000}>1 minute</option>
                <option value={300000}>5 minutes</option>
                <option value={600000}>10 minutes</option>
                <option value={1800000}>30 minutes</option>
                <option value={3600000}>1 hour</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Currently: {formatInterval(settings.exchange_rate_update_interval)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dashboard Refresh Interval
              </label>
              <select
                value={settings.dashboard_refresh_interval}
                onChange={(e) => handleChange('dashboard_refresh_interval', parseInt(e.target.value))}
                className="select-field"
                disabled={!['super_admin', 'admin'].includes(currentUser.role)}
              >
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
                <option value={300000}>5 minutes</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Currently: {formatInterval(settings.dashboard_refresh_interval)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* External Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <SafeIcon icon={FiGlobe} className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              External Integrations
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CoinGecko API Key
              </label>
              <input
                type="password"
                value={settings.coingecko_api_key}
                onChange={(e) => handleChange('coingecko_api_key', e.target.value)}
                className="input-field"
                placeholder="Enter CoinGecko API key"
                disabled={!['super_admin', 'admin'].includes(currentUser.role)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                For real-time exchange rate updates
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telegram Bot Token
              </label>
              <input
                type="password"
                value={settings.telegram_bot_token}
                onChange={(e) => handleChange('telegram_bot_token', e.target.value)}
                className="input-field"
                placeholder="Bot token from BotFather"
                disabled={!['super_admin', 'admin'].includes(currentUser.role)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telegram Chat ID
              </label>
              <input
                type="text"
                value={settings.telegram_chat_id}
                onChange={(e) => handleChange('telegram_chat_id', e.target.value)}
                className="input-field"
                placeholder="Chat ID for notifications"
                disabled={!['super_admin', 'admin'].includes(currentUser.role)}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <SafeIcon icon={FiBell} className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notification Settings
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Telegram Notifications
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Send notifications for transactions and system events
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) => handleChange('notifications_enabled', e.target.checked)}
                className="sr-only peer"
                disabled={!['super_admin', 'admin'].includes(currentUser.role)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {settings.notifications_enabled && (
            <div className="ml-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Status:</strong> {settings.telegram_bot_token && settings.telegram_chat_id ? '✅ Configured and ready' : '⚠️ Telegram credentials required'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Settings Impact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
      >
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Settings Impact
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Daily profit reset time affects dashboard calculations</li>
          <li>• Capital tracking is used for ROI calculations and analytics</li>
          <li>• Timezone setting affects all time-based calculations</li>
          <li>• System intervals control data refresh rates</li>
          <li>• External integrations enable real-time data and notifications</li>
          <li>• Changes take effect immediately after saving</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default SystemSettings;