import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import ReactECharts from 'echarts-for-react';
import { AppStateManager } from '../../services/AppStateManager';
import { format, startOfMonth, eachDayOfInterval, endOfMonth } from 'date-fns';

const { FiTrendingUp, FiDollarSign, FiBarChart3, FiPieChart } = FiIcons;

const Tracker = ({ currentUser }) => {
  const [data, setData] = useState({});
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    loadData();
    const unsubscribe = AppStateManager.subscribe(loadData);
    return unsubscribe;
  }, []);

  const loadData = () => {
    const users = AppStateManager.getUsers();
    const balances = AppStateManager.getBalances();
    
    // Get period data
    const todayData = calculatePeriodData('today');
    const weekData = calculatePeriodData('week');
    const monthData = calculatePeriodData('month');
    
    // Generate chart data
    const monthlyChartData = generateMonthlyChartData();
    
    setData({
      users,
      balances,
      today: todayData,
      week: weekData,
      month: monthData
    });
    
    setChartData(monthlyChartData);
  };

  const calculatePeriodData = (period) => {
    const transactions = AppStateManager.getTransactionsByPeriod(period);
    
    const totalPHP = transactions.reduce((sum, t) => sum + t.phpAmount, 0);
    const totalUSDT = transactions.reduce((sum, t) => sum + t.usdtAmount, 0);
    const transactionCount = transactions.length;
    
    // Fixed profit calculation logic
    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');
    
    let netProfit = 0;
    
    if (buyTransactions.length > 0 && sellTransactions.length > 0) {
      const totalBuyPHP = buyTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
      const totalBuyUSDT = buyTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
      const totalSellPHP = sellTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
      const totalSellUSDT = sellTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
      
      const avgBuyRate = totalBuyUSDT > 0 ? totalBuyPHP / totalBuyUSDT : 0;
      const avgSellRate = totalSellUSDT > 0 ? totalSellPHP / totalSellUSDT : 0;
      
      // Calculate profit based on the difference in rates and volume
      const minVolume = Math.min(totalBuyUSDT, totalSellUSDT);
      netProfit = (avgSellRate - avgBuyRate) * minVolume;
    }
    
    return {
      totalPHP,
      totalUSDT,
      netProfit: Math.max(0, netProfit),
      transactionCount,
      transactions
    };
  };

  const generateMonthlyChartData = () => {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    
    const dailyData = daysInMonth.map(day => {
      const dayTransactions = AppStateManager.getTransactions().filter(t => {
        const transactionDate = new Date(t.timestamp);
        return format(transactionDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });
      
      const totalPHP = dayTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
      const totalUSDT = dayTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
      const transactionCount = dayTransactions.length;
      
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
        dailyProfit = Math.max(0, (avgSellRate - avgBuyRate) * minVolume);
      }
      
      return {
        date: format(day, 'MM/dd'),
        totalPHP,
        totalUSDT,
        dailyProfit,
        transactionCount
      };
    });
    
    return dailyData;
  };

  const getChartOptions = () => {
    return {
      title: {
        text: 'Monthly Trading Overview',
        left: 'center',
        textStyle: {
          color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1f2937'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['PHP Volume', 'USDT Volume', 'Daily Profit', 'Transactions'],
        bottom: 10,
        textStyle: {
          color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1f2937'
        }
      },
      xAxis: {
        type: 'category',
        data: chartData.map ? chartData.map(d => d.date) : [],
        axisLabel: {
          color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#6b7280'
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Amount',
          position: 'left',
          axisLabel: {
            formatter: '₱{value}',
            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#6b7280'
          }
        },
        {
          type: 'value',
          name: 'Count',
          position: 'right',
          axisLabel: {
            formatter: '{value}',
            color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#6b7280'
          }
        }
      ],
      series: [
        {
          name: 'PHP Volume',
          type: 'bar',
          data: chartData.map ? chartData.map(d => d.totalPHP.toFixed(2)) : [],
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: 'USDT Volume',
          type: 'bar',
          data: chartData.map ? chartData.map(d => d.totalUSDT.toFixed(2)) : [],
          itemStyle: { color: '#10b981' }
        },
        {
          name: 'Daily Profit',
          type: 'line',
          data: chartData.map ? chartData.map(d => d.dailyProfit.toFixed(2)) : [],
          itemStyle: { color: '#f59e0b' },
          smooth: true
        },
        {
          name: 'Transactions',
          type: 'line',
          yAxisIndex: 1,
          data: chartData.map ? chartData.map(d => d.transactionCount) : [],
          itemStyle: { color: '#ef4444' },
          smooth: true
        }
      ],
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      }
    };
  };

  const getUserBalanceBreakdown = () => {
    if (!data.users) return [];
    
    return data.users.map(user => ({
      ...user,
      totalBalance: Object.values(user.bankBalances || {}).reduce((sum, balance) => sum + balance, 0),
      bankCount: Object.keys(user.bankBalances || {}).length
    })).filter(user => user.totalBalance > 0);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Tracker
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive analytics and performance tracking
        </p>
      </div>

      {/* Monthly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="h-96">
          <ReactECharts 
            option={getChartOptions()} 
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </motion.div>

      {/* Period Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Today's Summary
            </h3>
            <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total PHP</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₱{data.today?.totalPHP?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total USDT</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.today?.totalUSDT?.toFixed(2) || '0.00'} USDT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Net Profit</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ₱{data.today?.netProfit?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Transactions</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.today?.transactionCount || 0}
              </span>
            </div>
          </div>
        </motion.div>

        {/* This Week's Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              This Week's Summary
            </h3>
            <SafeIcon icon={FiBarChart3} className="w-6 h-6 text-green-600" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total PHP</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₱{data.week?.totalPHP?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total USDT</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.week?.totalUSDT?.toFixed(2) || '0.00'} USDT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Net Profit</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ₱{data.week?.netProfit?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Transactions</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.week?.transactionCount || 0}
              </span>
            </div>
          </div>
        </motion.div>

        {/* This Month's Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              This Month's Summary
            </h3>
            <SafeIcon icon={FiDollarSign} className="w-6 h-6 text-purple-600" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total PHP</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₱{data.month?.totalPHP?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total USDT</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.month?.totalUSDT?.toFixed(2) || '0.00'} USDT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Net Profit</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ₱{data.month?.netProfit?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Transactions</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.month?.transactionCount || 0}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Sections */}
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