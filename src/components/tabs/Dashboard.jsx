import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { ExchangeRateService } from '../../services/ExchangeRateService';
import { format } from 'date-fns';

const { FiRefreshCw, FiDollarSign, FiTrendingUp, FiUsers, FiActivity } = FiIcons;

const Dashboard = ({ currentUser }) => {
  const [data, setData] = useState({});
  const [exchangeRate, setExchangeRate] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();
    
    // Subscribe to data changes
    const unsubscribe = AppStateManager.subscribe(loadData);
    
    // Auto-refresh setup
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshData();
      }, AppStateManager.getConfig().dashboardRefreshInterval || 10000);
    }
    
    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadData = () => {
    const users = AppStateManager.getUsers();
    const transactions = AppStateManager.getTransactions();
    const balances = AppStateManager.getBalances();
    const rate = ExchangeRateService.getCurrentRate();
    
    setData({ users, transactions, balances });
    setExchangeRate(rate);
  };

  const refreshData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    await ExchangeRateService.fetchRate();
    loadData();
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const calculateMetrics = () => {
    if (!data.transactions) return {};
    
    const todayTransactions = AppStateManager.getTransactionsByPeriod('today');
    const totalCompanyUSDT = AppStateManager.getTotalCompanyUSDT();
    const averageBuyRate = AppStateManager.getAverageBuyRate();
    const phpWorth = totalCompanyUSDT * averageBuyRate;
    
    return {
      totalCompanyUSDT,
      phpWorth,
      averageBuyRate,
      todayTransactions: todayTransactions.length,
      currentRate: exchangeRate?.rate || 0
    };
  };

  const getActiveUserBalances = () => {
    if (!data.users) return [];
    
    return data.users
      .map(user => ({
        ...user,
        totalBalance: Object.values(user.bankBalances || {}).reduce((sum, balance) => sum + balance, 0)
      }))
      .filter(user => user.totalBalance > 0)
      .sort((a, b) => b.totalBalance - a.totalBalance);
  };

  const getRecentTransactions = () => {
    if (!data.transactions) return [];
    return data.transactions.slice(0, 5);
  };

  const metrics = calculateMetrics();
  const activeUsers = getActiveUserBalances();
  const recentTransactions = getRecentTransactions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {currentUser.name}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {format(lastRefresh, 'HH:mm:ss')}
          </div>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="btn-secondary flex items-center space-x-2"
          >
            <SafeIcon 
              icon={FiRefreshCw} 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="metric-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-title">Company USDT</p>
              <p className="metric-value">{metrics.totalCompanyUSDT?.toFixed(2) || '0.00'}</p>
            </div>
            <SafeIcon icon={FiDollarSign} className="w-8 h-8 text-primary-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="metric-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-title">PHP Worth</p>
              <p className="metric-value">₱{metrics.phpWorth?.toFixed(2) || '0.00'}</p>
            </div>
            <SafeIcon icon={FiTrendingUp} className="w-8 h-8 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="metric-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-title">Exchange Rate</p>
              <p className="metric-value">₱{metrics.currentRate?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {exchangeRate?.source} • {exchangeRate?.lastUpdate ? format(new Date(exchangeRate.lastUpdate), 'HH:mm') : 'N/A'}
              </p>
            </div>
            <SafeIcon icon={FiActivity} className="w-8 h-8 text-blue-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="metric-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-title">Today's Transactions</p>
              <p className="metric-value">{metrics.todayTransactions || 0}</p>
            </div>
            <SafeIcon icon={FiUsers} className="w-8 h-8 text-purple-600" />
          </div>
        </motion.div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active User PHP Balances */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active User PHP Balances
          </h3>
          <div className="space-y-3">
            {activeUsers.length > 0 ? (
              activeUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₱{user.totalBalance.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {Object.keys(user.bankBalances || {}).length} banks
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No active balances found
              </p>
            )}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'BUY' 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      <SafeIcon 
                        icon={FiTrendingUp} 
                        className={`w-4 h-4 ${
                          transaction.type === 'BUY' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`} 
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {transaction.type} • {transaction.user_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(transaction.timestamp), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {transaction.usdtAmount} USDT
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ₱{transaction.phpAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recent transactions
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Average Buy Rate Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Average Buy Rate
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Calculated from all buy transactions
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₱{metrics.averageBuyRate?.toFixed(4) || '0.0000'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              per USDT
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;