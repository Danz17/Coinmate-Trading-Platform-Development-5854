import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '@/components/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { AnalyticsService } from '../../services/AnalyticsService';
import { ExportService } from '../../services/ExportService';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const {
  FiTrendingUp, FiTrendingDown, FiBarChart3, FiPieChart, FiActivity,
  FiDollarSign, FiUsers, FiCalendar, FiDownload, FiRefreshCw,
  FiTarget, FiAlertTriangle, FiInfo, FiFilter, FiSettings
} = FiIcons;

// Import ReactECharts with fallback
let ReactECharts = () => <div>Loading charts...</div>;
try {
  ReactECharts = require('echarts-for-react').default;
} catch (err) {
  console.error('Failed to load echarts:', err);
}

const AdvancedAnalytics = ({ currentUser }) => {
  const [analyticsData, setAnalyticsData] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedChart, setSelectedChart] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    users: [],
    platforms: [],
    transactionTypes: [],
    minAmount: '',
    maxAmount: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [predictions, setPredictions] = useState({});
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, filters]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await AnalyticsService.generateAdvancedAnalytics(selectedPeriod, filters);
      setAnalyticsData(data);
      
      // Generate predictions
      const predictionData = await AnalyticsService.generatePredictions(data);
      setPredictions(predictionData);
      
      // Check for alerts
      const alertData = await AnalyticsService.generateAlerts(data);
      setAlerts(alertData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
  };

  const exportReport = () => {
    ExportService.exportAdvancedAnalytics(analyticsData, selectedPeriod);
  };

  const getKPICards = () => [
    {
      title: 'Total Revenue',
      value: `₱${analyticsData.totalRevenue?.toLocaleString() || '0'}`,
      change: analyticsData.revenueChange || 0,
      icon: FiDollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Trading Volume',
      value: `${analyticsData.totalVolume?.toFixed(2) || '0'} USDT`,
      change: analyticsData.volumeChange || 0,
      icon: FiTrendingUp,
      color: 'text-blue-600'
    },
    {
      title: 'Profit Margin',
      value: `${analyticsData.profitMargin?.toFixed(2) || '0'}%`,
      change: analyticsData.marginChange || 0,
      icon: FiTarget,
      color: 'text-purple-600'
    },
    {
      title: 'Active Traders',
      value: analyticsData.activeTraders || 0,
      change: analyticsData.tradersChange || 0,
      icon: FiUsers,
      color: 'text-indigo-600'
    }
  ];

  const getChartOptions = () => {
    if (!analyticsData.chartData) return {};

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f1f5f9' : '#1f2937';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    switch (selectedChart) {
      case 'revenue':
        return {
          title: {
            text: 'Revenue Analysis',
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
                  Revenue: ₱${data.value.toFixed(2)}<br/>
                  Profit: ₱${analyticsData.chartData[data.dataIndex]?.profit?.toFixed(2) || '0.00'}
                </div>
              `;
            }
          },
          xAxis: {
            type: 'category',
            data: analyticsData.chartData.map(d => d.date),
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
          series: [
            {
              name: 'Revenue',
              type: 'line',
              data: analyticsData.chartData.map(d => d.revenue),
              itemStyle: { color: '#10b981' },
              areaStyle: { color: 'rgba(16,185,129,0.1)' },
              smooth: true
            },
            {
              name: 'Profit',
              type: 'line',
              data: analyticsData.chartData.map(d => d.profit),
              itemStyle: { color: '#3b82f6' },
              smooth: true
            }
          ],
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
            text: 'Trading Volume Trends',
            left: 'center',
            textStyle: { color: textColor }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
          },
          legend: {
            data: ['Buy Volume', 'Sell Volume', 'Net Volume'],
            bottom: 10,
            textStyle: { color: textColor }
          },
          xAxis: {
            type: 'category',
            data: analyticsData.chartData.map(d => d.date),
            axisLabel: { color: textColor }
          },
          yAxis: {
            type: 'value',
            name: 'USDT',
            axisLabel: { color: textColor }
          },
          series: [
            {
              name: 'Buy Volume',
              type: 'bar',
              data: analyticsData.chartData.map(d => d.buyVolume),
              itemStyle: { color: '#10b981' }
            },
            {
              name: 'Sell Volume',
              type: 'bar',
              data: analyticsData.chartData.map(d => d.sellVolume),
              itemStyle: { color: '#ef4444' }
            },
            {
              name: 'Net Volume',
              type: 'line',
              data: analyticsData.chartData.map(d => d.netVolume),
              itemStyle: { color: '#3b82f6' },
              smooth: true
            }
          ]
        };

      case 'performance':
        return {
          title: {
            text: 'Performance Metrics',
            left: 'center',
            textStyle: { color: textColor }
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: ['ROI', 'Efficiency', 'Risk Score'],
            bottom: 10,
            textStyle: { color: textColor }
          },
          xAxis: {
            type: 'category',
            data: analyticsData.chartData.map(d => d.date),
            axisLabel: { color: textColor }
          },
          yAxis: [
            {
              type: 'value',
              name: 'Percentage',
              position: 'left',
              axisLabel: {
                formatter: '{value}%',
                color: textColor
              }
            },
            {
              type: 'value',
              name: 'Score',
              position: 'right',
              axisLabel: { color: textColor }
            }
          ],
          series: [
            {
              name: 'ROI',
              type: 'line',
              data: analyticsData.chartData.map(d => d.roi),
              itemStyle: { color: '#10b981' },
              smooth: true
            },
            {
              name: 'Efficiency',
              type: 'line',
              data: analyticsData.chartData.map(d => d.efficiency),
              itemStyle: { color: '#3b82f6' },
              smooth: true
            },
            {
              name: 'Risk Score',
              type: 'line',
              yAxisIndex: 1,
              data: analyticsData.chartData.map(d => d.riskScore),
              itemStyle: { color: '#f59e0b' },
              smooth: true
            }
          ]
        };

      default:
        return {
          title: {
            text: 'Analytics Overview',
            left: 'center',
            textStyle: { color: textColor }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
          },
          legend: {
            data: ['Revenue', 'Volume', 'Transactions'],
            bottom: 10,
            textStyle: { color: textColor }
          },
          xAxis: {
            type: 'category',
            data: analyticsData.chartData?.map(d => d.date) || [],
            axisLabel: { color: textColor }
          },
          yAxis: [
            {
              type: 'value',
              name: 'Amount',
              position: 'left',
              axisLabel: { color: textColor }
            },
            {
              type: 'value',
              name: 'Count',
              position: 'right',
              axisLabel: { color: textColor }
            }
          ],
          series: [
            {
              name: 'Revenue',
              type: 'bar',
              data: analyticsData.chartData?.map(d => d.revenue) || [],
              itemStyle: { color: '#3b82f6' }
            },
            {
              name: 'Volume',
              type: 'line',
              data: analyticsData.chartData?.map(d => d.volume) || [],
              itemStyle: { color: '#10b981' },
              smooth: true
            },
            {
              name: 'Transactions',
              type: 'line',
              yAxisIndex: 1,
              data: analyticsData.chartData?.map(d => d.transactions) || [],
              itemStyle: { color: '#f59e0b' },
              smooth: true
            }
          ]
        };
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights and predictive analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <SafeIcon icon={FiFilter} className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={refreshAnalytics}
            disabled={isRefreshing}
            className="btn-secondary flex items-center space-x-2"
          >
            <SafeIcon 
              icon={FiRefreshCw} 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportReport}
            className="btn-primary flex items-center space-x-2"
          >
            <SafeIcon icon={FiDownload} className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'warning' 
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' 
                  : alert.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <SafeIcon 
                  icon={alert.type === 'warning' ? FiAlertTriangle : FiInfo} 
                  className={`w-5 h-5 ${
                    alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} 
                />
                <div>
                  <h4 className="font-medium">{alert.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Analytics Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Period
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="select-field"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Amount (USDT)
                </label>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Amount (USDT)
                </label>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="input-field"
                  placeholder="No limit"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getKPICards().map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="metric-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-title">{kpi.title}</p>
                <p className="metric-value">{kpi.value}</p>
                <div className="flex items-center mt-2">
                  <SafeIcon 
                    icon={kpi.change >= 0 ? FiTrendingUp : FiTrendingDown} 
                    className={`w-4 h-4 mr-1 ${
                      kpi.change >= 0 ? 'text-green-500' : 'text-red-500'
                    }`} 
                  />
                  <span className={`text-sm ${
                    kpi.change >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.abs(kpi.change).toFixed(1)}%
                  </span>
                </div>
              </div>
              <SafeIcon icon={kpi.icon} className={`w-8 h-8 ${kpi.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart Controls */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Analytics Charts
          </h3>
          <div className="flex items-center space-x-2">
            <select
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value)}
              className="select-field"
            >
              <option value="overview">Overview</option>
              <option value="revenue">Revenue Analysis</option>
              <option value="volume">Volume Trends</option>
              <option value="performance">Performance Metrics</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="h-96">
          {typeof ReactECharts === 'function' && analyticsData.chartData ? (
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Performance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Performers
            </h3>
            <SafeIcon icon={FiUsers} className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="space-y-3">
            {analyticsData.topPerformers?.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.transactions} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₱{user.profit.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600">
                    {user.profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Platform Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Platform Analysis
            </h3>
            <SafeIcon icon={FiPieChart} className="w-6 h-6 text-green-600" />
          </div>
          <div className="space-y-3">
            {analyticsData.platformAnalysis?.map((platform) => (
              <div key={platform.name} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {platform.name}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {platform.percentage}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Volume</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {platform.volume.toFixed(2)} USDT
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Efficiency</p>
                    <p className="font-semibold text-green-600">
                      {platform.efficiency.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${platform.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Predictions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Predictions
            </h3>
            <SafeIcon icon={FiTarget} className="w-6 h-6 text-purple-600" />
          </div>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Next 7 Days
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-blue-700 dark:text-blue-300">Expected Volume</p>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {predictions.nextWeekVolume?.toFixed(2) || '0'} USDT
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 dark:text-blue-300">Projected Profit</p>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    ₱{predictions.nextWeekProfit?.toFixed(2) || '0'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                Growth Trend
              </h4>
              <div className="flex items-center space-x-2">
                <SafeIcon 
                  icon={predictions.growthTrend >= 0 ? FiTrendingUp : FiTrendingDown} 
                  className={`w-4 h-4 ${predictions.growthTrend >= 0 ? 'text-green-600' : 'text-red-600'}`} 
                />
                <span className={`text-sm font-semibold ${
                  predictions.growthTrend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {predictions.growthTrend >= 0 ? '+' : ''}{predictions.growthTrend?.toFixed(1) || '0'}%
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Based on recent performance
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                Risk Assessment
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  Risk Level
                </span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${
                  predictions.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                  predictions.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {predictions.riskLevel || 'Low'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;