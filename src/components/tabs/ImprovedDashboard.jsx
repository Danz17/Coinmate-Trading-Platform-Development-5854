import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { AppStateManager } from '../../services/AppStateManager';
import { SupabaseService } from '../../services/SupabaseService';
import { ExchangeRateService } from '../../services/ExchangeRateService';
import { AnalyticsService } from '../../services/AnalyticsService';
import { toast } from 'react-toastify';

// Chart components would be imported here
// import { LineChart, BarChart, PieChart } from 'path-to-chart-library';

const ImprovedDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    transactions: [],
    summary: {
      totalTransactions: 0,
      totalVolume: 0,
      pendingTransactions: 0,
      completedTransactions: 0,
      rejectedTransactions: 0,
      averageTransactionSize: 0
    },
    platforms: [],
    exchangeRates: {},
    userActivity: [],
    topTraders: []
  });
  const [dateRange, setDateRange] = useState('today'); // today, week, month, custom
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute by default
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshTimer, setRefreshTimer] = useState(null);
  
  // Date range options
  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];
  
  // Refresh interval options
  const refreshIntervalOptions = [
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' },
    { value: 300000, label: '5 minutes' },
    { value: 600000, label: '10 minutes' },
    { value: null, label: 'Manual refresh' }
  ];
  
  // Calculate date range based on selection
  const getDateRange = () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    
    switch(dateRange) {
      case 'today':
        return {
          start: startOfDay.toISOString(),
          end: new Date().toISOString()
        };
      case 'yesterday':
        const yesterday = new Date(startOfDay);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          start: yesterday.toISOString(),
          end: startOfDay.toISOString()
        };
      case 'week':
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        return {
          start: startOfWeek.toISOString(),
          end: new Date().toISOString()
        };
      case 'month':
        const startOfMonth = new Date(startOfDay);
        startOfMonth.setDate(1);
        return {
          start: startOfMonth.toISOString(),
          end: new Date().toISOString()
        };
      case 'custom':
        return {
          start: new Date(`${customRange.start}T00:00:00`).toISOString(),
          end: new Date(`${customRange.end}T23:59:59`).toISOString()
        };
      default:
        return {
          start: startOfDay.toISOString(),
          end: new Date().toISOString()
        };
    }
  };
  
  // Formatted date range for display
  const formattedDateRange = useMemo(() => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };
    
    const range = getDateRange();
    return `${formatDate(range.start)} - ${formatDate(range.end)}`;
  }, [dateRange, customRange]);
  
  // Calculate time since last refresh
  const timeSinceRefresh = useMemo(() => {
    const seconds = Math.floor((new Date() - lastRefreshed) / 1000);
    
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }, [lastRefreshed]);
  
  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const user = AppStateManager.getCurrentUser();
      setCurrentUser(user);
      
      const dateRangeValues = getDateRange();
      
      // Get transactions
      const transactions = await SupabaseService.getTransactions({
        startDate: dateRangeValues.start,
        endDate: dateRangeValues.end,
        userId: user.role === 'user' ? user.id : null // Filter by user if role is 'user'
      });
      
      // Get platforms
      const platforms = await SupabaseService.getPlatforms();
      
      // Get exchange rates
      const exchangeRates = await ExchangeRateService.getCurrentRates();
      
      // Get user activity (for supervisors and above)
      let userActivity = [];
      if (['supervisor', 'admin', 'super_admin'].includes(user.role)) {
        userActivity = await SupabaseService.getUserActivity(dateRangeValues.start, dateRangeValues.end);
      }
      
      // Get top traders (for supervisors and above)
      let topTraders = [];
      if (['supervisor', 'admin', 'super_admin'].includes(user.role)) {
        topTraders = await SupabaseService.getTopTraders(dateRangeValues.start, dateRangeValues.end);
      }
      
      // Calculate summary
      const completedTransactions = transactions.filter(t => t.status === 'completed');
      const pendingTransactions = transactions.filter(t => t.status === 'pending');
      const rejectedTransactions = transactions.filter(t => t.status === 'rejected');
      
      const totalVolume = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
      const averageTransactionSize = completedTransactions.length > 0
        ? totalVolume / completedTransactions.length
        : 0;
      
      setDashboardData({
        transactions,
        summary: {
          totalTransactions: transactions.length,
          totalVolume,
          pendingTransactions: pendingTransactions.length,
          completedTransactions: completedTransactions.length,
          rejectedTransactions: rejectedTransactions.length,
          averageTransactionSize
        },
        platforms,
        exchangeRates,
        userActivity,
        topTraders
      });
      
      // Track analytics event
      AnalyticsService.trackEvent('dashboard_view', {
        user_role: user.role,
        date_range: dateRange,
        custom_range: dateRange === 'custom' ? customRange : null
      });
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  // Set up auto-refresh
  useEffect(() => {
    // Clear existing timer
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    
    // Set new timer if interval is not null
    if (refreshInterval) {
      const timer = setInterval(() => {
        loadDashboardData();
      }, refreshInterval);
      setRefreshTimer(timer);
    }
    
    // Clean up
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [refreshInterval, dateRange, customRange]);
  
  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, [dateRange, customRange]);
  
  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };
  
  // Handle date range change
  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
  };
  
  // Handle custom range change
  const handleCustomRangeChange = (e) => {
    const { name, value } = e.target;
    setCustomRange({
      ...customRange,
      [name]: value
    });
  };
  
  // Handle refresh interval change
  const handleRefreshIntervalChange = (e) => {
    const value = e.target.value === 'null' ? null : parseInt(e.target.value);
    setRefreshInterval(value);
  };
  
  // Manual refresh
  const handleManualRefresh = () => {
    loadDashboardData();
  };
  
  // Card variants for animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  // Container variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">
            Overview of your trading activity and performance
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-700">Date Range:</label>
            <select
              value={dateRange}
              onChange={handleDateRangeChange}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                name="start"
                value={customRange.start}
                onChange={handleCustomRangeChange}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                name="end"
                value={customRange.end}
                onChange={handleCustomRangeChange}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          <div className="flex items-center ml-2">
            <select
              value={refreshInterval === null ? 'null' : refreshInterval}
              onChange={handleRefreshIntervalChange}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {refreshIntervalOptions.map(option => (
                <option key={option.value} value={option.value === null ? 'null' : option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleManualRefresh}
              className="ml-2 p-1 rounded-md hover:bg-gray-100 text-gray-600"
              title="Refresh now"
            >
              <SafeIcon icon={FiIcons.FiRefreshCw} className="text-lg" />
            </motion.button>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 mb-4 flex items-center">
        <SafeIcon icon={FiIcons.FiCalendar} className="mr-1" />
        <span>Showing data for: {formattedDateRange}</span>
        <span className="mx-2">•</span>
        <SafeIcon icon={FiIcons.FiClock} className="mr-1" />
        <span>Last updated: {timeSinceRefresh}</span>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <SafeIcon icon={FiIcons.FiLoader} className="animate-spin text-3xl text-blue-500" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              variants={cardVariants}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Volume</p>
                  <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(dashboardData.summary.totalVolume)}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <SafeIcon icon={FiIcons.FiDollarSign} className="text-blue-600 text-xl" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {dashboardData.summary.totalTransactions} transactions
              </div>
            </motion.div>
            
            <motion.div
              variants={cardVariants}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <h3 className="text-2xl font-bold text-gray-800">{dashboardData.summary.completedTransactions}</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <SafeIcon icon={FiIcons.FiCheckCircle} className="text-green-600 text-xl" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {dashboardData.summary.totalTransactions > 0
                  ? `${((dashboardData.summary.completedTransactions / dashboardData.summary.totalTransactions) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </div>
            </motion.div>
            
            <motion.div
              variants={cardVariants}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <h3 className="text-2xl font-bold text-gray-800">{dashboardData.summary.pendingTransactions}</h3>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <SafeIcon icon={FiIcons.FiClock} className="text-yellow-600 text-xl" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {dashboardData.summary.totalTransactions > 0
                  ? `${((dashboardData.summary.pendingTransactions / dashboardData.summary.totalTransactions) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </div>
            </motion.div>
            
            <motion.div
              variants={cardVariants}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg. Transaction</p>
                  <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(dashboardData.summary.averageTransactionSize)}</h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <SafeIcon icon={FiIcons.FiBarChart2} className="text-purple-600 text-xl" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Based on {dashboardData.summary.completedTransactions} completed trades
              </div>
            </motion.div>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <motion.div
              variants={cardVariants}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 lg:col-span-2"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Volume</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                {/* Line Chart would go here */}
                <div className="text-center">
                  <SafeIcon icon={FiIcons.FiTrendingUp} className="text-4xl mb-2" />
                  <p>Transaction Volume Chart</p>
                  <p className="text-sm">(Chart component would be rendered here)</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              variants={cardVariants}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Status</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                {/* Pie Chart would go here */}
                <div className="text-center">
                  <SafeIcon icon={FiIcons.FiPieChart} className="text-4xl mb-2" />
                  <p>Transaction Status Chart</p>
                  <p className="text-sm">(Chart component would be rendered here)</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Exchange Rates */}
          <motion.div
            variants={cardVariants}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Current Exchange Rates</h3>
              <span className="text-sm text-gray-500">
                <SafeIcon icon={FiIcons.FiClock} className="inline mr-1" />
                Updated {timeSinceRefresh}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(dashboardData.exchangeRates).length > 0 ? (
                Object.entries(dashboardData.exchangeRates).map(([currency, rate]) => (
                  <div key={currency} className="p-3 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{currency}</span>
                      <span className={`text-sm ${rate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rate > 0 ? (
                          <SafeIcon icon={FiIcons.FiArrowUp} className="inline mr-1" />
                        ) : (
                          <SafeIcon icon={FiIcons.FiArrowDown} className="inline mr-1" />
                        )}
                        {Math.abs(rate).toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-lg font-semibold mt-1">
                      {formatCurrency(1, currency)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center py-4 text-gray-500">
                  No exchange rate data available
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Recent Transactions */}
          <motion.div
            variants={cardVariants}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
            
            {dashboardData.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Platform
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.transactions.slice(0, 5).map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {transaction.id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'buy' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {transaction.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {transaction.platform_name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SafeIcon icon={FiIcons.FiInbox} className="text-4xl mb-2 mx-auto" />
                <p>No transactions found for the selected date range</p>
              </div>
            )}
            
            {dashboardData.transactions.length > 5 && (
              <div className="mt-4 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View all transactions
                </button>
              </div>
            )}
          </motion.div>
          
          {/* Admin/Supervisor Only Sections */}
          {['supervisor', 'admin', 'super_admin'].includes(currentUser?.role) && (
            <>
              {/* User Activity */}
              <motion.div
                variants={cardVariants}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">User Activity</h3>
                
                {dashboardData.userActivity.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.userActivity.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="p-3 border border-gray-200 rounded-md">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-full mr-3">
                            <SafeIcon icon={FiIcons.FiUser} className="text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{activity.user_name}</div>
                            <div className="text-sm text-gray-500">{activity.action}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          <SafeIcon icon={FiIcons.FiClock} className="inline mr-1" />
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <SafeIcon icon={FiIcons.FiActivity} className="text-4xl mb-2 mx-auto" />
                    <p>No user activity found for the selected date range</p>
                  </div>
                )}
              </motion.div>
              
              {/* Top Traders */}
              <motion.div
                variants={cardVariants}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Traders</h3>
                
                {dashboardData.topTraders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transactions
                          </th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Volume
                          </th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg. Size
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData.topTraders.slice(0, 5).map((trader, index) => (
                          <tr key={trader.user_id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{index + 1}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <div className="mr-2">
                                  <SafeIcon icon={
                                    index === 0 ? FiIcons.FiAward : FiIcons.FiUser
                                  } className={index === 0 ? "text-yellow-500" : "text-gray-500"} />
                                </div>
                                {trader.user_name}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {trader.transaction_count}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(trader.total_volume)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(trader.average_size)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <SafeIcon icon={FiIcons.FiUsers} className="text-4xl mb-2 mx-auto" />
                    <p>No trader data available for the selected date range</p>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ImprovedDashboard;