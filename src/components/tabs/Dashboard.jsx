import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {Responsive, WidthProvider} from 'react-grid-layout';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import {AppStateManager} from '../../services/AppStateManager';
import {ExchangeRateService} from '../../services/ExchangeRateService';
import {format} from 'date-fns';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const {FiRefreshCw, FiDollarSign, FiTrendingUp, FiUsers, FiActivity, FiMove, FiInfo} = FiIcons;

const ResponsiveGridLayout = WidthProvider(Responsive);

const Dashboard = ({currentUser}) => {
  const [data, setData] = useState({});
  const [exchangeRate, setExchangeRate] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [layouts, setLayouts] = useState({});
  const [isDragging, setIsDragging] = useState(false);

  // Default layout configuration
  const defaultLayout = [
    {i: 'company-usdt', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2},
    {i: 'php-worth', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2},
    {i: 'exchange-rate', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2},
    {i: 'daily-profit', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2},
    {i: 'avg-buy-rate', x: 0, y: 2, w: 3, h: 2, minW: 2, minH: 2},
    {i: 'avg-sell-rate', x: 3, y: 2, w: 3, h: 2, minW: 2, minH: 2},
    {i: 'today-transactions', x: 6, y: 2, w: 6, h: 2, minW: 3, minH: 2},
    {i: 'active-users', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3},
    {i: 'company-usdt-balances', x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3},
    {i: 'recent-transactions', x: 0, y: 8, w: 12, h: 4, minW: 6, minH: 3}
  ];

  useEffect(() => {
    loadData();
    loadLayouts();
    
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

    setData({users, transactions, balances});
    setExchangeRate(rate);
  };

  const loadLayouts = () => {
    const savedLayouts = localStorage.getItem(`coinmate-dashboard-layout-${currentUser.id}`);
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts));
      } catch (error) {
        console.error('Error loading layouts:', error);
        setLayouts({lg: defaultLayout});
      }
    } else {
      setLayouts({lg: defaultLayout});
    }
  };

  const saveLayouts = (allLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem(`coinmate-dashboard-layout-${currentUser.id}`, JSON.stringify(allLayouts));
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
    const averageSellRate = AppStateManager.getAverageSellRate();
    const phpWorth = totalCompanyUSDT * averageBuyRate;
    const dailyProfit = AppStateManager.getDailyProfit();

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
      .sort((a, b) => b.amount - a.amount);
  };

  const getRecentTransactions = () => {
    if (!data.transactions) return [];
    return data.transactions.slice(0, 5);
  };

  const metrics = calculateMetrics();
  const activeUsers = getActiveUserBalances();
  const companyBalances = getCompanyUSDTBalances();
  const recentTransactions = getRecentTransactions();

  // Widget components
  const MetricCard = ({title, value, icon, color, children, tooltip}) => (
    <div className="metric-card h-full relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <SafeIcon icon={FiMove} className="w-4 h-4 text-gray-400 cursor-move" />
      </div>
      <div className="flex items-center justify-between h-full">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <p className="metric-title">{title}</p>
            {tooltip && (
              <div className="relative group/tooltip">
                <SafeIcon icon={FiInfo} className="w-3 h-3 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {tooltip}
                </div>
              </div>
            )}
          </div>
          <p className="metric-value">{value}</p>
          {children}
        </div>
        <SafeIcon icon={icon} className={`w-8 h-8 ${color}`} />
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
        />
      )
    },
    {
      key: 'php-worth',
      component: (
        <MetricCard
          title="PHP Worth"
          value={`₱${metrics.phpWorth?.toFixed(2) || '0.00'}`}
          icon={FiTrendingUp}
          color="text-green-600"
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
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
          value={`₱${metrics.dailyProfit?.toFixed(2) || '0.00'}`}
          icon={FiTrendingUp}
          color="text-purple-600"
          tooltip="Profit calculated from daily reset time to now"
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
          tooltip="Calculated from all buy transactions"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">per USDT</p>
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
          tooltip="Calculated from all sell transactions"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">per USDT</p>
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
        />
      )
    },
    {
      key: 'active-users',
      component: (
        <div className="card p-6 h-full relative group">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <SafeIcon icon={FiMove} className="w-4 h-4 text-gray-400 cursor-move" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active User PHP Balances
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-64">
            {activeUsers.length > 0 ? (
              activeUsers.map((user) => (
                <div key={user.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₱{user.totalBalance.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(user.bankBalances)
                      .filter(([, balance]) => balance > 0)
                      .sort(([, a], [, b]) => b - a)
                      .map(([bank, balance]) => (
                        <div key={bank} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{bank}:</span>
                          <span>₱{balance.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No active balances found
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'company-usdt-balances',
      component: (
        <div className="card p-6 h-full relative group">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <SafeIcon icon={FiMove} className="w-4 h-4 text-gray-400 cursor-move" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active Company USDT Balances
          </h3>
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-blue-900 dark:text-blue-100">Total USDT:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {metrics.totalCompanyUSDT?.toFixed(2) || '0.00'} USDT
                </span>
              </div>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-48">
              {companyBalances.map((platform) => (
                <div key={platform.platform} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {platform.platform}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {platform.amount.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {platform.percentage}% of total
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'recent-transactions',
      component: (
        <div className="card p-6 h-full relative group">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <SafeIcon icon={FiMove} className="w-4 h-4 text-gray-400 cursor-move" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-64">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'BUY' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      <SafeIcon
                        icon={FiTrendingUp}
                        className={`w-4 h-4 ${
                          transaction.type === 'BUY' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
        </div>
      )
    }
  ];

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

      {/* Draggable Grid Layout */}
      <div className="relative">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={(layout, allLayouts) => saveLayouts(allLayouts)}
          breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
          cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}}
          rowHeight={80}
          isDraggable={true}
          isResizable={true}
          onDragStart={() => setIsDragging(true)}
          onDragStop={() => setIsDragging(false)}
          onResizeStart={() => setIsDragging(true)}
          onResizeStop={() => setIsDragging(false)}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
        >
          {generateWidgets().map(({key, component}) => (
            <div key={key} className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}>
              {component}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};

export default Dashboard;