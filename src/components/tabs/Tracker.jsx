import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '@/components/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { format, startOfMonth, eachDayOfInterval, endOfMonth, subDays } from 'date-fns';

const { FiTrendingUp, FiDollarSign, FiBarChart3, FiPieChart, FiActivity, FiUsers, FiTarget, FiTrendingDown } = FiIcons;

// Import ReactECharts with a fallback
let ReactECharts = () => <div>Loading charts...</div>;
try {
  ReactECharts = require('echarts-for-react').default;
} catch (err) {
  console.error('Failed to load echarts:', err);
}

const Tracker = ({ currentUser }) => {
  const [data, setData] = useState({});
  const [chartData, setChartData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('volume');
  const [selectedChart, setSelectedChart] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const unsubscribe = AppStateManager.subscribe(loadData);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      const newChartData = generateChartData();
      setChartData(newChartData);
      generateAnalytics();
      setLoading(false);
    }
  }, [data, selectedPeriod]);

  const loadData = () => {
    try {
      const users = AppStateManager.getUsers();
      const balances = AppStateManager.getBalances();
      const platforms = AppStateManager.getPlatforms();

      // Get period data
      const todayData = calculatePeriodData('today');
      const weekData = calculatePeriodData('week');
      const monthData = calculatePeriodData('month');

      setData({
        users,
        balances,
        platforms,
        today: todayData,
        week: weekData,
        month: monthData
      });
    } catch (error) {
      console.error('Error loading tracker data:', error);
      setLoading(false);
    }
  };

  const calculatePeriodData = (period) => {
    const transactions = AppStateManager.getTransactionsByPeriod(period);
    const totalPHP = transactions.reduce((sum, t) => sum + t.phpAmount, 0);
    const totalUSDT = transactions.reduce((sum, t) => sum + t.usdtAmount, 0);
    const transactionCount = transactions.length;

    // Enhanced profit calculation
    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');
    
    let netProfit = 0;
    let totalFees = transactions.reduce((sum, t) => sum + (t.fee || 0), 0);
    
    if (buyTransactions.length > 0 && sellTransactions.length > 0) {
      const totalBuyPHP = buyTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
      const totalBuyUSDT = buyTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
      const totalSellPHP = sellTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
      const totalSellUSDT = sellTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);

      const avgBuyRate = totalBuyUSDT > 0 ? totalBuyPHP / totalBuyUSDT : 0;
      const avgSellRate = totalSellUSDT > 0 ? totalSellPHP / totalSellUSDT : 0;

      const minVolume = Math.min(totalBuyUSDT, totalSellUSDT);
      netProfit = (avgSellRate - avgBuyRate) * minVolume - totalFees;
    }

    return {
      totalPHP,
      totalUSDT,
      netProfit: Math.max(0, netProfit),
      transactionCount,
      transactions,
      totalFees,
      avgTransactionSize: transactionCount > 0 ? totalUSDT / transactionCount : 0
    };
  };

  const generateChartData = () => {
    const now = new Date();
    let dateRange = [];
    
    switch (selectedPeriod) {
      case 'week':
        dateRange = Array.from({ length: 7 }, (_, i) => subDays(now, 6 - i));
        break;
      case 'month':
        const startDate = startOfMonth(now);
        const endDate = endOfMonth(now);
        dateRange = eachDayOfInterval({ start: startDate, end: endDate });
        break;
      case 'quarter':
        dateRange = Array.from({ length: 90 }, (_, i) => subDays(now, 89 - i));
        break;
      default:
        dateRange = eachDayOfInterval({ 
          start: startOfMonth(now), 
          end: endOfMonth(now) 
        });
    }

    return dateRange.map(day => {
      const dayTransactions = AppStateManager.getTransactions().filter(t => {
        const transactionDate = new Date(t.timestamp);
        return format(transactionDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });

      const totalPHP = dayTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
      const totalUSDT = dayTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
      const transactionCount = dayTransactions.length;
      const totalFees = dayTransactions.reduce((sum, t) => sum + (t.fee || 0), 0);

      // Calculate daily profit
      const buyTransactions = dayTransactions.filter(t => t.type === 'BUY');
      const sellTransactions = dayTransactions.filter(t => t.type === 'SELL');
      
      let dailyProfit = 0;
      if (buyTransactions.length > 0 && sellTransactions.length > 0) {
        const totalBuyPHP = buyTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
        const totalBuyUSDT = buyTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
        const totalSellPHP = sellTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
        const totalSellUSDT = sellTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);

        const avgBuyRate = totalBuyUSDT > 0 ? totalBuyPHP / totalBuyUSDT : 0;
        const avgSellRate = totalSellUSDT > 0 ? totalSellPHP / totalSellUSDT : 0;
        const minVolume = Math.min(totalBuyUSDT, totalSellUSDT);
        dailyProfit = Math.max(0, (avgSellRate - avgBuyRate) * minVolume - totalFees);
      }

      return {
        date: format(day, selectedPeriod === 'week' ? 'EEE' : 'MM/dd'),
        fullDate: format(day, 'yyyy-MM-dd'),
        totalPHP,
        totalUSDT,
        dailyProfit,
        transactionCount,
        totalFees,
        buyCount: buyTransactions.length,
        sellCount: sellTransactions.length
      };
    });
  };

  const generateAnalytics = () => {
    if (!data.users) return;

    // User Performance Analysis
    const userPerformance = data.users.map(user => {
      const userTransactions = AppStateManager.getTransactions().filter(t => t.user_id === user.id);
      const totalVolume = userTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
      const totalProfit = calculateUserProfit(userTransactions);
      const avgTransactionSize = userTransactions.length > 0 ? totalVolume / userTransactions.length : 0;
      
      return {
        ...user,
        totalVolume,
        totalProfit,
        transactionCount: userTransactions.length,
        avgTransactionSize,
        profitMargin: totalVolume > 0 ? (totalProfit / (totalVolume * 56)) * 100 : 0
      };
    }).filter(user => user.transactionCount > 0);

    // Platform Performance Analysis
    const platformPerformance = data.platforms?.map(platform => {
      const platformTransactions = AppStateManager.getTransactions().filter(t => t.platform === platform);
      const totalVolume = platformTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
      const balance = data.balances?.companyUSDT?.[platform] || 0;
      
      return {
        platform,
        totalVolume,
        balance,
        transactionCount: platformTransactions.length,
        utilization: balance > 0 ? (totalVolume / balance) * 100 : 0
      };
    }) || [];

    // Trend Analysis
    const last30Days = chartData.slice(-30);
    const profitTrend = calculateTrend(last30Days.map(d => d.dailyProfit));
    const volumeTrend = calculateTrend(last30Days.map(d => d.totalUSDT));

    setAnalyticsData({
      userPerformance,
      platformPerformance,
      trends: {
        profit: profitTrend,
        volume: volumeTrend
      }
    });
  };

  const calculateUserProfit = (transactions) => {
    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');
    
    if (buyTransactions.length === 0 || sellTransactions.length === 0) return 0;

    const totalBuyPHP = buyTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
    const totalBuyUSDT = buyTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
    const totalSellPHP = sellTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
    const totalSellUSDT = sellTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);

    const avgBuyRate = totalBuyUSDT > 0 ? totalBuyPHP / totalBuyUSDT : 0;
    const avgSellRate = totalSellUSDT > 0 ? totalSellPHP / totalSellUSDT : 0;
    const minVolume = Math.min(totalBuyUSDT, totalSellUSDT);
    
    return Math.max(0, (avgSellRate - avgBuyRate) * minVolume);
  };

  const calculateTrend = (values) => {
    if (values.length < 2) return 0;
    
    const recent = values.slice(-7).reduce((sum, val) => sum + val, 0) / 7;
    const previous = values.slice(-14, -7).reduce((sum, val) => sum + val, 0) / 7;
    
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  };

  const getChartOptions = () => {
    if (chartData.length === 0) return {};
    
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f1f5f9' : '#1f2937';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    switch (selectedChart) {
      case 'profit':
        return {
          title: {
            text: 'Profit & Loss Analysis',
            left: 'center',
            textStyle: { color: textColor }
          },
          tooltip: {
            trigger: 'axis',
            formatter: (params) => {
              const data = params[0];
              return `
                <div>
                  <strong>${data.axisValue}</strong><br/>
                  Profit: ₱${data.value.toFixed(2)}<br/>
                  Fees: ₱${chartData[data.dataIndex]?.totalFees?.toFixed(2) || '0.00'}
                </div>
              `;
            }
          },
          xAxis: {
            type: 'category',
            data: chartData.map(d => d.date),
            axisLabel: { color: textColor }
          },
          yAxis: {
            type: 'value',
            name: 'Amount (₱)',
            axisLabel: { 
              formatter: '₱{value}',
              color: textColor 
            }
          },
          series: [{
            name: 'Daily Profit',
            type: 'line',
            data: chartData.map(d => d.dailyProfit),
            itemStyle: { color: '#10b981' },
            areaStyle: { color: 'rgba(16, 185, 129, 0.1)' },
            smooth: true
          }],
          grid: { 
            left: '3%', 
            right: '4%', 
            bottom: '3%', 
            containLabel: true,
            borderColor: gridColor
          }
        };

      case 'volume':
        return {
          title: {
            text: 'Trading Volume Analysis',
            left: 'center',
            textStyle: { color: textColor }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
          },
          legend: {
            data: ['PHP Volume', 'USDT Volume'],
            bottom: 10,
            textStyle: { color: textColor }
          },
          xAxis: {
            type: 'category',
            data: chartData.map(d => d.date),
            axisLabel: { color: textColor }
          },
          yAxis: [
            {
              type: 'value',
              name: 'PHP',
              position: 'left',
              axisLabel: { 
                formatter: '₱{value}',
                color: textColor 
              }
            },
            {
              type: 'value',
              name: 'USDT',
              position: 'right',
              axisLabel: { 
                formatter: '{value}',
                color: textColor 
              }
            }
          ],
          series: [
            {
              name: 'PHP Volume',
              type: 'bar',
              data: chartData.map(d => d.totalPHP),
              itemStyle: { color: '#3b82f6' }
            },
            {
              name: 'USDT Volume',
              type: 'line',
              yAxisIndex: 1,
              data: chartData.map(d => d.totalUSDT),
              itemStyle: { color: '#f59e0b' },
              smooth: true
            }
          ],
          grid: { 
            left: '3%', 
            right: '4%', 
            bottom: '15%', 
            containLabel: true 
          }
        };

      case 'transactions':
        return {
          title: {
            text: 'Transaction Pattern Analysis',
            left: 'center',
            textStyle: { color: textColor }
          },
          tooltip: {
            trigger: 'axis',
            formatter: (params) => {
              const data = params[0];
              const dayData = chartData[data.dataIndex];
              return `
                <div>
                  <strong>${data.axisValue}</strong><br/>
                  Total: ${dayData.transactionCount}<br/>
                  Buy: ${dayData.buyCount}<br/>
                  Sell: ${dayData.sellCount}
                </div>
              `;
            }
          },
          legend: {
            data: ['Buy Transactions', 'Sell Transactions'],
            bottom: 10,
            textStyle: { color: textColor }
          },
          xAxis: {
            type: 'category',
            data: chartData.map(d => d.date),
            axisLabel: { color: textColor }
          },
          yAxis: {
            type: 'value',
            name: 'Count',
            axisLabel: { color: textColor }
          },
          series: [
            {
              name: 'Buy Transactions',
              type: 'bar',
              stack: 'total',
              data: chartData.map(d => d.buyCount),
              itemStyle: { color: '#10b981' }
            },
            {
              name: 'Sell Transactions',
              type: 'bar',
              stack: 'total',
              data: chartData.map(d => d.sellCount),
              itemStyle: { color: '#ef4444' }
            }
          ],
          grid: { 
            left: '3%', 
            right: '4%', 
            bottom: '15%', 
            containLabel: true 
          }
        };

      default:
        return {
          title: {
            text: 'Trading Overview',
            left: 'center',
            textStyle: { color: textColor }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
          },
          legend: {
            data: ['PHP Volume', 'USDT Volume', 'Daily Profit', 'Transactions'],
            bottom: 10,
            textStyle: { color: textColor }
          },
          xAxis: {
            type: 'category',
            data: chartData.map(d => d.date),
            axisLabel: { color: textColor }
          },
          yAxis: [
            {
              type: 'value',
              name: 'Amount',
              position: 'left',
              axisLabel: { 
                formatter: '₱{value}',
                color: textColor 
              }
            },
            {
              type: 'value',
              name: 'Count',
              position: 'right',
              axisLabel: { 
                formatter: '{value}',
                color: textColor 
              }
            }
          ],
          series: [
            {
              name: 'PHP Volume',
              type: 'bar',
              data: chartData.map(d => d.totalPHP.toFixed(2)),
              itemStyle: { color: '#3b82f6' }
            },
            {
              name: 'USDT Volume',
              type: 'bar',
              data: chartData.map(d => d.totalUSDT.toFixed(2)),
              itemStyle: { color: '#10b981' }
            },
            {
              name: 'Daily Profit',
              type: 'line',
              data: chartData.map(d => d.dailyProfit.toFixed(2)),
              itemStyle: { color: '#f59e0b' },
              smooth: true
            },
            {
              name: 'Transactions',
              type: 'line',
              yAxisIndex: 1,
              data: chartData.map(d => d.transactionCount),
              itemStyle: { color: '#ef4444' },
              smooth: true
            }
          ],
          grid: { 
            left: '3%', 
            right: '4%', 
            bottom: '15%', 
            containLabel: true 
          }
        };
    }
  };

  const getUserBalanceBreakdown = () => {
    if (!data.users) return [];
    return data.users
      .map(user => ({
        ...user,
        totalBalance: Object.values(user.bankBalances || {}).reduce((sum, balance) => sum + balance, 0),
        bankCount: Object.keys(user.bankBalances || {}).length
      }))
      .filter(user => user.totalBalance > 0)
      .sort((a, b) => b.totalBalance - a.totalBalance);
  };

  const getPlatformDistribution = () => {
    if (!data.balances?.companyUSDT) return [];
    const total = Object.values(data.balances.companyUSDT).reduce((sum, amount) => sum + amount, 0);
    return Object.entries(data.balances.companyUSDT).map(([platform, amount]) => ({
      platform,
      amount,
      percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : 0
    }));
  };

  const userBalances = getUserBalanceBreakdown();
  const platformDistribution = getPlatformDistribution();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Advanced Analytics & Tracker
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive analytics with advanced insights and performance tracking
        </p>
      </div>

      {/* Analytics Controls */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="select-field"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="quarter">Last 90 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chart Type
              </label>
              <select
                value={selectedChart}
                onChange={(e) => setSelectedChart(e.target.value)}
                className="select-field"
              >
                <option value="overview">Overview</option>
                <option value="profit">Profit & Loss</option>
                <option value="volume">Volume Analysis</option>
                <option value="transactions">Transaction Patterns</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="metric-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-title">Total Profit</p>
              <p className="metric-value">₱{data.month?.netProfit?.toFixed(2) || '0.00'}</p>
              <div className="flex items-center mt-2">
                <SafeIcon 
                  icon={analyticsData.trends?.profit >= 0 ? FiTrendingUp : FiTrendingDown} 
                  className={`w-4 h-4 mr-1 ${analyticsData.trends?.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} 
                />
                <span className={`text-sm ${analyticsData.trends?.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(analyticsData.trends?.profit || 0).toFixed(1)}%
                </span>
              </div>
            </div>
            <SafeIcon icon={FiDollarSign} className="w-8 h-8 text-green-600" />
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
              <p className="metric-title">Trading Volume</p>
              <p className="metric-value">{data.month?.totalUSDT?.toFixed(0) || '0'} USDT</p>
              <div className="flex items-center mt-2">
                <SafeIcon 
                  icon={analyticsData.trends?.volume >= 0 ? FiTrendingUp : FiTrendingDown} 
                  className={`w-4 h-4 mr-1 ${analyticsData.trends?.volume >= 0 ? 'text-green-500' : 'text-red-500'}`} 
                />
                <span className={`text-sm ${analyticsData.trends?.volume >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(analyticsData.trends?.volume || 0).toFixed(1)}%
                </span>
              </div>
            </div>
            <SafeIcon icon={FiTrendingUp} className="w-8 h-8 text-blue-600" />
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
              <p className="metric-title">Avg Transaction Size</p>
              <p className="metric-value">{data.month?.avgTransactionSize?.toFixed(0) || '0'} USDT</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Per transaction
              </p>
            </div>
            <SafeIcon icon={FiTarget} className="w-8 h-8 text-purple-600" />
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
              <p className="metric-title">Active Traders</p>
              <p className="metric-value">{analyticsData.userPerformance?.length || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                With transactions
              </p>
            </div>
            <SafeIcon icon={FiUsers} className="w-8 h-8 text-indigo-600" />
          </div>
        </motion.div>
      </div>

      {/* Advanced Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="h-96">
          {typeof ReactECharts === 'function' && chartData.length > 0 ? (
            <ReactECharts
              option={getChartOptions()}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <SafeIcon icon={FiBarChart3} className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Chart visualization is loading...</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Performance Analysis */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Performance Analysis
            </h3>
            <SafeIcon icon={FiUsers} className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {analyticsData.userPerformance?.length > 0 ? (
              analyticsData.userPerformance.map((user) => (
                <div key={user.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Total Volume</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user.totalVolume.toFixed(0)} USDT
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Total Profit</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        ₱{user.totalProfit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Transactions</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user.transactionCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Profit Margin</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {user.profitMargin.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No user performance data available
              </p>
            )}
          </div>
        </motion.div>

        {/* Platform Performance Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Platform Performance
            </h3>
            <SafeIcon icon={FiActivity} className="w-6 h-6 text-orange-600" />
          </div>
          <div className="space-y-3">
            {analyticsData.platformPerformance?.length > 0 ? (
              analyticsData.platformPerformance.map((platform) => (
                <div key={platform.platform} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {platform.platform}
                    </h4>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      platform.utilization > 50 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {platform.utilization.toFixed(1)}% utilized
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Balance</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {platform.balance.toFixed(2)} USDT
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Volume</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {platform.totalVolume.toFixed(0)} USDT
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No platform performance data available
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Traditional sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Bank Balances Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Bank Balances
            </h3>
            <SafeIcon icon={FiPieChart} className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="space-y-3">
            {userBalances.length > 0 ? (
              userBalances.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.bankCount} bank{user.bankCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₱{user.totalBalance.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No user balances found
              </p>
            )}
          </div>
        </motion.div>

        {/* Company USDT Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              USDT Platform Distribution
            </h3>
            <SafeIcon icon={FiDollarSign} className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="space-y-3">
            {platformDistribution.length > 0 ? (
              platformDistribution.map((platform) => (
                <div key={platform.platform} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {platform.platform}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {platform.percentage}% of total
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {platform.amount.toFixed(2)} USDT
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No platform balances found
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Tracker;