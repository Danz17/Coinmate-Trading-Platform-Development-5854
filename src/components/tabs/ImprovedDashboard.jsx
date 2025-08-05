import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Responsive, WidthProvider } from 'react-grid-layout';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { TooltipIcon } from '../common/Tooltip';
import { AppStateManager } from '../../services/AppStateManager';
import { ExchangeRateService } from '../../services/ExchangeRateService';
import { toastManager } from '../common/Toast';
import { format } from 'date-fns';
import supabase from '../../lib/supabase';

const { FiRefreshCw, FiDollarSign, FiTrendingUp, FiUsers, FiActivity, FiMove } = FiIcons;

const ResponsiveGridLayout = WidthProvider(Responsive);

const ImprovedDashboard = ({ currentUser }) => {
  const [data, setData] = useState({});
  const [exchangeRate, setExchangeRate] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [layouts, setLayouts] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingLayout, setIsLoadingLayout] = useState(true);
  const [systemSettings, setSystemSettings] = useState({});

  // Enhanced responsive breakpoints
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  // Default layout with better responsive design
  const defaultLayout = [
    { i: 'company-usdt', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'php-worth', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'exchange-rate', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'daily-profit', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'avg-buy-rate', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'avg-sell-rate', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'today-transactions', x: 6, y: 3, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'active-users', x: 0, y: 6, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'company-usdt-balances', x: 6, y: 6, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'recent-transactions', x: 0, y: 14, w: 12, h: 8, minW: 6, minH: 6 }
  ];

  useEffect(() => {
    loadData();
    loadLayouts();
    loadSystemSettings();
    
    const unsubscribe = AppStateManager.subscribe(loadData);
    return unsubscribe;
  }, []);

  const loadData = () => {
    const users = AppStateManager.getUsers();
    const transactions = AppStateManager.getTransactions();
    const balances = AppStateManager.getBalances();
    const rate = ExchangeRateService.getCurrentRate();
    
    setData({ users, transactions, balances });
    setExchangeRate(rate);
  };

  const loadSystemSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading system settings:', error);
      }

      if (settings) {
        setSystemSettings(settings);
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const loadLayouts = async () => {
    setIsLoadingLayout(true);
    try {
      const { data: layoutData, error } = await supabase
        .from('user_dashboard_layouts')
        .select('layouts')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading layouts:', error);
      }

      if (layoutData?.layouts) {
        setLayouts(layoutData.layouts);
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
      await supabase
        .from('user_dashboard_layouts')
        .upsert({
          user_id: currentUser.id,
          layouts: allLayouts,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
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
      await ExchangeRateService.fetchRate();
      loadData();
      setLastRefresh(new Date());
      toastManager.success('Data refreshed successfully');
    } catch (error) {
      toastManager.error('Failed to refresh data', {
        action: { label: 'Retry', onClick: refreshData }
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
      const transactionDate = new Date(t.timestamp);
      return transactionDate >= startTime && transactionDate <= now;
    });

    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');

    if (buyTransactions.length === 0 || sellTransactions.length === 0) return 0;

    const totalBuyPHP = buyTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
    const totalBuyUSDT = buyTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
    const totalSellPHP = sellTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
    const totalSellUSDT = sellTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);

    const avgBuyRate = totalBuyUSDT > 0 ? totalBuyPHP / totalBuyUSDT : 0;
    const avgSellRate = totalSellUSDT > 0 ? totalSellPHP / totalSellUSDT : 0;

    const profit = (avgSellRate - avgBuyRate) * Math.min(totalBuyUSDT, totalSellUSDT);
    return Math.max(0, profit);
  };

  const calculateMetrics = () => {
    if (!data.transactions) return {};
    
    const todayTransactions = AppStateManager.getTransactionsByPeriod('today');
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

  const getActiveUserBalances = () => {
    if (!data.users) return [];
    
    return data.users
      .map(user => ({
        ...user,
        totalBalance: Object.values(user.bankBalances || {}).reduce((sum, balance) => sum + balance, 0),
        bankBalances: user.bankBalances || {}
      }))
      .filter(user => user.totalBalance > 0)
      .sort((a, b) => b.totalBalance - a.totalBalance);
  };

  const getCompanyUSDTBalances = () => {
    if (!data.balances?.companyUSDT) return [];
    
    const total = Object.values(data.balances.companyUSDT).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(data.balances.companyUSDT)
      .map(([platform, amount]) => ({
        platform,
        amount,
        percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : 0
      }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  };

  const getRecentTransactions = () => {
    if (!data.transactions) return [];
    return data.transactions.slice(0, 8);
  };

  const metrics = calculateMetrics();
  const activeUsers = getActiveUserBalances();
  const companyBalances = getCompanyUSDTBalances();
  const recentTransactions = getRecentTransactions();

  // Enhanced MetricCard with proper tooltips and responsive design
  const MetricCard = ({ title, value, icon, color, children, tooltip }) => (
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
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {exchangeRate?.source} • {exchangeRate?.lastUpdate ? format(new Date(exchangeRate.lastUpdate), 'HH:mm') : 'N/A'}
          </p>
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
          icon={FiTrendingUp}
          color="text-red-600"
          tooltip="Average rate calculated from all sell transactions"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">per USDT</p>
        </MetricCard>
      )
    },
    {
      key: 'today-transactions',
      component: (
        <MetricCard
          title="Today's Transactions"
          value={metrics.todayTransactions || 0}
          icon={FiUsers}
          color="text-indigo-600"
          tooltip="Total number of transactions processed today"
        />
      )
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
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
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
                  <p className="text-gray-500 dark:text-gray-400">No active balances found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'company-usdt-balances',
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
                Company USDT Balances
              </h3>
              <TooltipIcon content="USDT distribution across trading platforms with percentage breakdown" />
            </div>
          </div>
          <div className="flex-1 px-6 pb-6 overflow-y-auto">
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900 dark:text-blue-100">Total USDT:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {metrics.totalCompanyUSDT?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} USDT
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {companyBalances.length > 0 ? (
                  companyBalances.map((platform) => (
                    <div key={platform.platform} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {platform.platform}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {platform.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {platform.percentage}% of total
                        </div>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${platform.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">No platform balances found</p>
                  </div>
                )}
              </div>
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
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Transactions
              </h3>
              <TooltipIcon content="Latest 8 transactions across all users and platforms" />
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
                        transaction.type === 'SELL' ? 'bg-red-100 dark:bg-red-900' : 
                        'bg-blue-100 dark:bg-blue-900'
                      }`}>
                        <SafeIcon
                          icon={transaction.type === 'BUY' ? FiTrendingUp : 
                                transaction.type === 'SELL' ? FiTrendingUp : 
                                FiActivity}
                          className={`w-4 h-4 ${
                            transaction.type === 'BUY' ? 'text-green-600 dark:text-green-400' : 
                            transaction.type === 'SELL' ? 'text-red-600 dark:text-red-400' : 
                            'text-blue-600 dark:text-blue-400'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {transaction.type} • {transaction.user_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(transaction.timestamp), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {transaction.usdtAmount.toFixed(2)} USDT
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ₱{transaction.phpAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No recent transactions</p>
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
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="btn-secondary flex items-center space-x-2"
            aria-label="Refresh dashboard data"
          >
            <SafeIcon
              icon={FiRefreshCw}
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
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
    </div>
  );
};

export default ImprovedDashboard;