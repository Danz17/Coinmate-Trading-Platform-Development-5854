import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Responsive, WidthProvider } from 'react-grid-layout';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { TooltipIcon } from '../common/Tooltip';
import { AppStateManager } from '../../services/AppStateManager';
import { ExchangeRateService } from '../../services/ExchangeRateService';
import { toastManager } from '../common/Toast';
import SupabaseService from '../../services/SupabaseService.js';
import { format } from 'date-fns';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const { FiRefreshCw, FiDollarSign, FiTrendingUp, FiTrendingDown, FiUsers, FiActivity, FiMove, FiInfo, FiHelpCircle } = FiIcons;

const ResponsiveGridLayout = WidthProvider(Responsive);

const Dashboard = ({ currentUser }) => {
  const [data, setData] = useState({});
  const [exchangeRate, setExchangeRate] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [layouts, setLayouts] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingLayout, setIsLoadingLayout] = useState(true);
  const [systemSettings, setSystemSettings] = useState({});
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [calculationInfo, setCalculationInfo] = useState(null);

  // Enhanced responsive breakpoints
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  // Default layout
  const defaultLayout = [
    { i: 'company-usdt', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'php-worth', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'exchange-rate', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'daily-profit', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'avg-buy-rate', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'avg-sell-rate', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'today-transactions', x: 6, y: 3, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'interactive-chart', x: 0, y: 6, w: 12, h: 6, minW: 6, minH: 4 },
    { i: 'active-users', x: 0, y: 12, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'recent-transactions', x: 6, y: 12, w: 6, h: 8, minW: 4, minH: 6 }
  ];

  useEffect(() => {
    initializeDashboard();
    const unsubscribe = AppStateManager.subscribe(loadData);

    // Auto-refresh setup
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshData();
      }, systemSettings.dashboard_refresh_interval || 10000);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, systemSettings.dashboard_refresh_interval]);

  const initializeDashboard = async () => {
    try {
      await AppStateManager.initialize();
      loadData();
      await loadLayouts();
      loadSystemSettings();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      toastManager.error('Failed to initialize dashboard');
    }
  };

  const loadData = () => {
    const appData = AppStateManager.data;
    const rate = ExchangeRateService.getCurrentRate();
    setData(appData);
    setExchangeRate(rate);
  };

  const loadSystemSettings = () => {
    const settings = AppStateManager.getSystemSettings();
    setSystemSettings(settings);
  };

  const loadLayouts = async () => {
    setIsLoadingLayout(true);
    try {
      const layoutData = await SupabaseService.getUserDashboardLayout(currentUser.id);
      if (layoutData) {
        setLayouts(layoutData);
      } else {
        setLayouts(generateDefaultLayouts());
      }
    } catch (error) {
      console.error('Error loading layouts:', error);
      setLayouts(generateDefaultLayouts());
    } finally {
      setIsLoadingLayout(false);
    }
  };

  const generateDefaultLayouts = () => {
    return {
      lg: defaultLayout,
      md: defaultLayout.map(item => ({
        ...item,
        w: Math.max(Math.floor(item.w * 0.8), item.minW || 2),
        x: Math.min(item.x, cols.md - (item.minW || 2))
      })),
      sm: defaultLayout.map(item => ({
        ...item,
        w: Math.max(Math.floor(item.w * 0.6), item.minW || 2),
        x: Math.min(item.x, cols.sm - (item.minW || 2))
      })),
      xs: defaultLayout.map((item, index) => ({
        ...item,
        w: Math.min(item.w, cols.xs),
        x: 0,
        y: index * (item.h || 3)
      })),
      xxs: defaultLayout.map((item, index) => ({
        ...item,
        w: cols.xxs,
        x: 0,
        y: index * (item.h || 3)
      }))
    };
  };

  const saveLayouts = async (allLayouts) => {
    setLayouts(allLayouts);
    try {
      await SupabaseService.saveUserDashboardLayout(currentUser.id, allLayouts);
      toastManager.success('Dashboard layout saved');
    } catch (error) {
      console.error('Error saving layouts:', error);
      toastManager.error('Failed to save layout');
    }
  };

  const refreshData = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await AppStateManager.loadAllData();
      await ExchangeRateService.fetchRate();
      loadData();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
      toastManager.error('Failed to refresh data', {
        action: {
          label: 'Retry',
          onClick: refreshData
        }
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const calculateDailyProfit = () => {
    if (!data.transactions || !systemSettings.daily_profit_reset_time) return 0;

    const resetTime = systemSettings.daily_profit_reset_time || '01:00';
    const [resetHours, resetMinutes] = resetTime.split(':').map(Number);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), resetHours, resetMinutes);
    
    let startTime = today;
    if (now < today) {
      startTime = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    }

    const transactions = data.transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return transactionDate >= startTime && transactionDate <= now;
    });

    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');

    if (buyTransactions.length === 0 || sellTransactions.length === 0) return 0;

    const totalBuyPHP = buyTransactions.reduce((sum, t) => sum + t.php_amount, 0);
    const totalBuyUSDT = buyTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);
    const totalSellPHP = sellTransactions.reduce((sum, t) => sum + t.php_amount, 0);
    const totalSellUSDT = sellTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);

    const avgBuyRate = totalBuyUSDT > 0 ? totalBuyPHP / totalBuyUSDT : 0;
    const avgSellRate = totalSellUSDT > 0 ? totalSellPHP / totalSellUSDT : 0;

    const profit = (avgSellRate - avgBuyRate) * Math.min(totalBuyUSDT, totalSellUSDT);
    return Math.max(0, profit);
  };

  const calculateMetrics = () => {
    if (!data.transactions) return {};

    const todayTransactions = AppStateManager.getTransactionsByPeriod(selectedTimeRange);
    const totalCompanyUSDT = AppStateManager.getTotalCompanyUSDT();
    const averageBuyRate = AppStateManager.getAverageBuyRate();
    const averageSellRate = AppStateManager.getAverageSellRate();
    const phpWorth = totalCompanyUSDT * (exchangeRate?.rate || averageBuyRate);
    const dailyProfit = calculateDailyProfit();

    return {
      totalCompanyUSDT,
      phpWorth,
      averageBuyRate,
      averageSellRate,
      dailyProfit,
      todayTransactions: todayTransactions.length,
      currentRate: exchangeRate?.rate || 0
    };
  };

  const showCalculationDetails = (type) => {
    const transactions = data.transactions || [];
    let info = {};

    switch (type) {
      case 'buy-rate':
        const buyTransactions = transactions.filter(t => t.type === 'BUY');
        const totalBuyPHP = buyTransactions.reduce((sum, t) => sum + t.php_amount, 0);
        const totalBuyUSDT = buyTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);
        info = {
          title: 'Average Buy Rate Calculation',
          formula: 'Total PHP Amount ÷ Total USDT Amount',
          calculation: `₱${totalBuyPHP.toFixed(2)} ÷ ${totalBuyUSDT.toFixed(2)} USDT = ₱${(totalBuyPHP / totalBuyUSDT).toFixed(4)}`,
          transactions: buyTransactions.length,
          details: `Based on ${buyTransactions.length} buy transactions`
        };
        break;
      case 'sell-rate':
        const sellTransactions = transactions.filter(t => t.type === 'SELL');
        const totalSellPHP = sellTransactions.reduce((sum, t) => sum + t.php_amount, 0);
        const totalSellUSDT = sellTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);
        info = {
          title: 'Average Sell Rate Calculation',
          formula: 'Total PHP Amount ÷ Total USDT Amount',
          calculation: `₱${totalSellPHP.toFixed(2)} ÷ ${totalSellUSDT.toFixed(2)} USDT = ₱${(totalSellPHP / totalSellUSDT).toFixed(4)}`,
          transactions: sellTransactions.length,
          details: `Based on ${sellTransactions.length} sell transactions`
        };
        break;
      case 'daily-profit':
        info = {
          title: 'Daily Profit Calculation',
          formula: '(Average Sell Rate - Average Buy Rate) × Min(Buy Volume, Sell Volume)',
          calculation: `Profit margin × Transaction volume`,
          details: `Calculated from ${systemSettings.daily_profit_reset_time || '01:00'} to now`
        };
        break;
    }

    setCalculationInfo(info);
    setShowCalculationModal(true);
  };

  const getActiveUserBalances = () => {
    if (!data.users) return [];
    return data.users
      .map(user => ({
        ...user,
        totalBalance: Object.values(user.bank_balances || {}).reduce((sum, balance) => sum + balance, 0),
        bankBalances: user.bank_balances || {}
      }))
      .filter(user => user.totalBalance > 0)
      .sort((a, b) => b.totalBalance - a.totalBalance);
  };

  const getRecentTransactions = () => {
    if (!data.transactions) return [];
    return data.transactions
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);
  };

  const generateChartData = () => {
    if (!data.transactions) return [];
    
    const transactions = AppStateManager.getTransactionsByPeriod(selectedTimeRange);
    const dailyData = {};

    transactions.forEach(transaction => {
      const date = format(new Date(transaction.created_at), 'yyyy-MM-dd');
      if (!dailyData[date]) {
        dailyData[date] = { buy: 0, sell: 0, profit: 0, volume: 0 };
      }
      
      if (transaction.type === 'BUY') {
        dailyData[date].buy += transaction.php_amount;
        dailyData[date].volume += transaction.usdt_amount;
      } else if (transaction.type === 'SELL') {
        dailyData[date].sell += transaction.php_amount;
        dailyData[date].volume += transaction.usdt_amount;
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data,
      profit: data.sell - data.buy
    }));
  };

  const metrics = calculateMetrics();
  const activeUsers = getActiveUserBalances();
  const recentTransactions = getRecentTransactions();
  const chartData = generateChartData();

  // Enhanced MetricCard component
  const MetricCard = ({ title, value, icon, color, children, tooltip, showInfo, onInfoClick }) => (
    <div className="metric-card h-full relative group flex flex-col">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
          <SafeIcon icon={FiMove} className="w-4 h-4 text-gray-400 cursor-move" />
        </div>
      </div>
      <div className="flex items-start justify-between h-full p-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-3">
            <p className="metric-title text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </p>
            {tooltip && <TooltipIcon content={tooltip} />}
            {showInfo && (
              <button
                onClick={onInfoClick}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <SafeIcon icon={FiHelpCircle} className="w-3 h-3 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <p className="metric-value text-2xl font-bold text-gray-900 dark:text-white mb-2 truncate">
            {value}
          </p>
          {children}
        </div>
        <div className="flex-shrink-0 ml-4">
          <SafeIcon icon={icon} className={`w-8 h-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  // Interactive Chart Component
  const InteractiveChart = () => (
    <div className="card h-full relative group overflow-hidden flex flex-col">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
          <SafeIcon icon={FiMove} className="w-4 h-4 text-gray-400 cursor-move" />
        </div>
      </div>
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trading Analytics
          </h3>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="select-field text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
      <div className="flex-1 px-6 pb-6">
        {chartData.length > 0 ? (
          <div className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Volume</div>
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {chartData.reduce((sum, d) => sum + d.volume, 0).toFixed(2)} USDT
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">Total Profit</div>
                <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                  ₱{chartData.reduce((sum, d) => sum + d.profit, 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <div className="text-sm text-purple-600 dark:text-purple-400">Avg Daily</div>
                <div className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  {chartData.length > 0 ? (chartData.reduce((sum, d) => sum + d.volume, 0) / chartData.length).toFixed(2) : '0.00'} USDT
                </div>
              </div>
            </div>
            <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <SafeIcon icon={FiActivity} className="w-8 h-8 mx-auto mb-2" />
                <p>Chart visualization would appear here</p>
                <p className="text-sm">Interactive charts showing profit, volume, and trends</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <SafeIcon icon={FiActivity} className="w-12 h-12 mx-auto mb-4" />
              <p>No transaction data available</p>
              <p className="text-sm">Start trading to see analytics</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const generateWidgets = () => [
    {
      key: 'company-usdt',
      component: (
        <MetricCard
          title="Company USDT"
          value={metrics.totalCompanyUSDT?.toFixed(2) || '0.00'}
          icon={FiDollarSign}
          color="text-primary-600"
          tooltip="Total USDT holdings across all trading platforms"
        />
      )
    },
    {
      key: 'php-worth',
      component: (
        <MetricCard
          title="PHP Worth"
          value={`₱${metrics.phpWorth?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={FiTrendingUp}
          color="text-green-600"
          tooltip="Total PHP value of company USDT holdings at current exchange rate"
        />
      )
    },
    {
      key: 'exchange-rate',
      component: (
        <MetricCard
          title="Exchange Rate"
          value={`₱${metrics.currentRate?.toFixed(2) || '0.00'}`}
          icon={FiActivity}
          color="text-blue-600"
          tooltip="Current USDT to PHP exchange rate"
        >
          <div className="flex items-center space-x-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {exchangeRate?.source} • {exchangeRate?.lastUpdate ? format(new Date(exchangeRate.lastUpdate), 'HH:mm') : 'N/A'}
            </p>
            <div className={`w-2 h-2 rounded-full ${exchangeRate?.source === 'CoinGecko' ? 'bg-green-500' : 'bg-yellow-500'}`} />
          </div>
        </MetricCard>
      )
    },
    {
      key: 'daily-profit',
      component: (
        <MetricCard
          title="Daily Profit"
          value={`₱${metrics.dailyProfit?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={FiTrendingUp}
          color="text-purple-600"
          tooltip={`Profit calculated from daily reset time (${systemSettings.daily_profit_reset_time || '01:00'}) to now`}
          showInfo={true}
          onInfoClick={() => showCalculationDetails('daily-profit')}
        />
      )
    },
    {
      key: 'avg-buy-rate',
      component: (
        <MetricCard
          title="Average Buy Rate"
          value={`₱${metrics.averageBuyRate?.toFixed(4) || '0.0000'}`}
          icon={FiTrendingUp}
          color="text-green-600"
          tooltip="Average rate calculated from all buy transactions"
          showInfo={true}
          onInfoClick={() => showCalculationDetails('buy-rate')}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">per USDT</p>
        </MetricCard>
      )
    },
    {
      key: 'avg-sell-rate',
      component: (
        <MetricCard
          title="Average Sell Rate"
          value={`₱${metrics.averageSellRate?.toFixed(4) || '0.0000'}`}
          icon={FiTrendingDown}
          color="text-red-600"
          tooltip="Average rate calculated from all sell transactions"
          showInfo={true}
          onInfoClick={() => showCalculationDetails('sell-rate')}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">per USDT</p>
        </MetricCard>
      )
    },
    {
      key: 'today-transactions',
      component: (
        <MetricCard
          title={`${selectedTimeRange.charAt(0).toUpperCase() + selectedTimeRange.slice(1)}'s Transactions`}
          value={metrics.todayTransactions || 0}
          icon={FiUsers}
          color="text-indigo-600"
          tooltip={`Total number of transactions processed ${selectedTimeRange}`}
        />
      )
    },
    {
      key: 'interactive-chart',
      component: <InteractiveChart />
    },
    {
      key: 'active-users',
      component: (
        <div className="card h-full relative group overflow-hidden flex flex-col">
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
              <SafeIcon icon={FiMove} className="w-4 h-4 text-gray-400 cursor-move" />
            </div>
          </div>
          <div className="p-6 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Active User PHP Balances
              </h3>
              <TooltipIcon content="Users with non-zero PHP balances sorted by total amount" />
            </div>
          </div>
          <div className="flex-1 px-6 pb-6 overflow-y-auto">
            <div className="space-y-3">
              {activeUsers.length > 0 ? (
                activeUsers.map((user) => (
                  <div key={user.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <SafeIcon icon={FiUsers} className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {user.role?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ₱{user.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(user.bankBalances)
                        .filter(([, balance]) => balance > 0)
                        .sort(([, a], [, b]) => b - a)
                        .map(([bank, balance]) => (
                          <div key={bank} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{bank}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              ₱{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <SafeIcon icon={FiUsers} className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No active balances found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Users will appear here when they have PHP balances</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'recent-transactions',
      component: (
        <div className="card h-full relative group overflow-hidden flex flex-col">
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
              <SafeIcon icon={FiMove} className="w-4 h-4 text-gray-400 cursor-move" />
            </div>
          </div>
          <div className="p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Transactions
                </h3>
                <TooltipIcon content="Latest transactions across all users and platforms" />
              </div>
              <button
                onClick={() => window.location.hash = '#transactions'}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View All
              </button>
            </div>
          </div>
          <div className="flex-1 px-6 pb-6 overflow-y-auto">
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'BUY' ? 'bg-green-100 dark:bg-green-900' : 
                        transaction.type === 'SELL' ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-100 dark:bg-blue-900'
                      }`}>
                        <SafeIcon icon={
                          transaction.type === 'BUY' ? FiTrendingUp : 
                          transaction.type === 'SELL' ? FiTrendingDown : FiActivity
                        } className={`w-4 h-4 ${
                          transaction.type === 'BUY' ? 'text-green-600 dark:text-green-400' : 
                          transaction.type === 'SELL' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {transaction.type} • {transaction.user_name}
                          </p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(transaction.created_at), 'MMM dd, HH:mm')} • {transaction.platform}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {transaction.usdt_amount.toFixed(2)} USDT
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ₱{transaction.php_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <SafeIcon icon={FiActivity} className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No recent transactions</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Transactions will appear here as they're processed</p>
                  <button
                    onClick={() => window.location.hash = '#trade'}
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Start Trading
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
  ];

  if (isLoadingLayout) {
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
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Auto-refresh</span>
          </label>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="btn-secondary flex items-center space-x-2"
            aria-label="Refresh dashboard data"
          >
            <SafeIcon icon={FiRefreshCw} className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Enhanced Draggable Grid Layout */}
      <div className="relative">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={(layout, allLayouts) => saveLayouts(allLayouts)}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={60}
          isDraggable={true}
          isResizable={true}
          onDragStart={() => setIsDragging(true)}
          onDragStop={() => setIsDragging(false)}
          onResizeStart={() => setIsDragging(true)}
          onResizeStop={() => setIsDragging(false)}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          compactType="vertical"
          preventCollision={false}
          draggableHandle=".drag-handle"
        >
          {generateWidgets().map(({ key, component }) => (
            <div key={key} className={`${isDragging ? 'cursor-grabbing' : ''} h-full w-full`}>
              <div className="drag-handle absolute inset-0 z-0" />
              {component}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {/* Calculation Details Modal */}
      {showCalculationModal && calculationInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {calculationInfo.title}
              </h2>
              <button
                onClick={() => setShowCalculationModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <SafeIcon icon={FiInfo} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formula</h3>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <code className="text-sm text-gray-800 dark:text-gray-200">{calculationInfo.formula}</code>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Calculation</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">{calculationInfo.calculation}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{calculationInfo.details}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;