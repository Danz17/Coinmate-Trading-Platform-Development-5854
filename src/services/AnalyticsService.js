import { AppStateManager } from './AppStateManager';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

class AnalyticsServiceClass {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async generateAdvancedAnalytics(period = '30d', filters = {}) {
    const cacheKey = `analytics_${period}_${JSON.stringify(filters)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const transactions = this.getFilteredTransactions(period, filters);
      const users = AppStateManager.getUsers();
      const platforms = AppStateManager.getPlatforms();

      const analytics = {
        totalRevenue: this.calculateTotalRevenue(transactions),
        totalVolume: this.calculateTotalVolume(transactions),
        profitMargin: this.calculateProfitMargin(transactions),
        activeTraders: this.getActiveTraders(transactions, users).length,
        revenueChange: this.calculateRevenueChange(transactions, period),
        volumeChange: this.calculateVolumeChange(transactions, period),
        marginChange: this.calculateMarginChange(transactions, period),
        tradersChange: this.calculateTradersChange(transactions, users, period),
        chartData: this.generateChartData(transactions, period),
        topPerformers: this.getTopPerformers(transactions, users),
        platformAnalysis: this.analyzePlatforms(transactions, platforms),
        timeAnalysis: this.analyzeTimePatterns(transactions),
        riskMetrics: this.calculateRiskMetrics(transactions),
        efficiency: this.calculateEfficiency(transactions)
      };

      this.cache.set(cacheKey, { data: analytics, timestamp: Date.now() });
      return analytics;
    } catch (error) {
      console.error('Error generating advanced analytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  getFilteredTransactions(period, filters) {
    let transactions = AppStateManager.getTransactions();
    
    // Filter by time period
    const now = new Date();
    const days = parseInt(period.replace('d', '')) || 30;
    const startDate = subDays(now, days);
    
    transactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return transactionDate >= startDate;
    });

    // Apply filters
    if (filters.users && filters.users.length > 0) {
      transactions = transactions.filter(t => filters.users.includes(t.user_id));
    }

    if (filters.platforms && filters.platforms.length > 0) {
      transactions = transactions.filter(t => filters.platforms.includes(t.platform));
    }

    if (filters.transactionTypes && filters.transactionTypes.length > 0) {
      transactions = transactions.filter(t => filters.transactionTypes.includes(t.type));
    }

    if (filters.minAmount) {
      transactions = transactions.filter(t => t.usdt_amount >= parseFloat(filters.minAmount));
    }

    if (filters.maxAmount) {
      transactions = transactions.filter(t => t.usdt_amount <= parseFloat(filters.maxAmount));
    }

    return transactions;
  }

  calculateTotalRevenue(transactions) {
    return transactions.reduce((sum, t) => sum + t.php_amount, 0);
  }

  calculateTotalVolume(transactions) {
    return transactions.reduce((sum, t) => sum + t.usdt_amount, 0);
  }

  calculateProfitMargin(transactions) {
    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');

    if (buyTransactions.length === 0 || sellTransactions.length === 0) return 0;

    const totalBuyPHP = buyTransactions.reduce((sum, t) => sum + t.php_amount, 0);
    const totalBuyUSDT = buyTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);
    const totalSellPHP = sellTransactions.reduce((sum, t) => sum + t.php_amount, 0);
    const totalSellUSDT = sellTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);

    const avgBuyRate = totalBuyUSDT > 0 ? totalBuyPHP / totalBuyUSDT : 0;
    const avgSellRate = totalSellUSDT > 0 ? totalSellPHP / totalSellUSDT : 0;

    return avgBuyRate > 0 ? ((avgSellRate - avgBuyRate) / avgBuyRate) * 100 : 0;
  }

  getActiveTraders(transactions, users) {
    const activeUserIds = new Set(transactions.map(t => t.user_id));
    return users.filter(u => activeUserIds.has(u.id));
  }

  calculateRevenueChange(transactions, period) {
    const days = parseInt(period.replace('d', '')) || 30;
    const halfPeriod = Math.floor(days / 2);
    
    const now = new Date();
    const midPoint = subDays(now, halfPeriod);
    
    const recentTransactions = transactions.filter(t => new Date(t.created_at) >= midPoint);
    const olderTransactions = transactions.filter(t => new Date(t.created_at) < midPoint);
    
    const recentRevenue = this.calculateTotalRevenue(recentTransactions);
    const olderRevenue = this.calculateTotalRevenue(olderTransactions);
    
    return olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 : 0;
  }

  calculateVolumeChange(transactions, period) {
    const days = parseInt(period.replace('d', '')) || 30;
    const halfPeriod = Math.floor(days / 2);
    
    const now = new Date();
    const midPoint = subDays(now, halfPeriod);
    
    const recentTransactions = transactions.filter(t => new Date(t.created_at) >= midPoint);
    const olderTransactions = transactions.filter(t => new Date(t.created_at) < midPoint);
    
    const recentVolume = this.calculateTotalVolume(recentTransactions);
    const olderVolume = this.calculateTotalVolume(olderTransactions);
    
    return olderVolume > 0 ? ((recentVolume - olderVolume) / olderVolume) * 100 : 0;
  }

  calculateMarginChange(transactions, period) {
    const days = parseInt(period.replace('d', '')) || 30;
    const halfPeriod = Math.floor(days / 2);
    
    const now = new Date();
    const midPoint = subDays(now, halfPeriod);
    
    const recentTransactions = transactions.filter(t => new Date(t.created_at) >= midPoint);
    const olderTransactions = transactions.filter(t => new Date(t.created_at) < midPoint);
    
    const recentMargin = this.calculateProfitMargin(recentTransactions);
    const olderMargin = this.calculateProfitMargin(olderTransactions);
    
    return olderMargin > 0 ? ((recentMargin - olderMargin) / olderMargin) * 100 : 0;
  }

  calculateTradersChange(transactions, users, period) {
    const days = parseInt(period.replace('d', '')) || 30;
    const halfPeriod = Math.floor(days / 2);
    
    const now = new Date();
    const midPoint = subDays(now, halfPeriod);
    
    const recentTransactions = transactions.filter(t => new Date(t.created_at) >= midPoint);
    const olderTransactions = transactions.filter(t => new Date(t.created_at) < midPoint);
    
    const recentTraders = this.getActiveTraders(recentTransactions, users).length;
    const olderTraders = this.getActiveTraders(olderTransactions, users).length;
    
    return olderTraders > 0 ? ((recentTraders - olderTraders) / olderTraders) * 100 : 0;
  }

  generateChartData(transactions, period) {
    const days = parseInt(period.replace('d', '')) || 30;
    const chartData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });
      
      const revenue = this.calculateTotalRevenue(dayTransactions);
      const volume = this.calculateTotalVolume(dayTransactions);
      const buyVolume = dayTransactions.filter(t => t.type === 'BUY').reduce((sum, t) => sum + t.usdt_amount, 0);
      const sellVolume = dayTransactions.filter(t => t.type === 'SELL').reduce((sum, t) => sum + t.usdt_amount, 0);
      const profit = this.calculateDailyProfit(dayTransactions);
      
      chartData.push({
        date: format(date, 'MM/dd'),
        revenue,
        volume,
        buyVolume,
        sellVolume,
        netVolume: buyVolume - sellVolume,
        transactions: dayTransactions.length,
        profit,
        roi: this.calculateDailyROI(dayTransactions),
        efficiency: this.calculateDailyEfficiency(dayTransactions),
        riskScore: this.calculateDailyRisk(dayTransactions)
      });
    }
    
    return chartData;
  }

  calculateDailyProfit(transactions) {
    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');
    
    if (buyTransactions.length === 0 || sellTransactions.length === 0) return 0;
    
    const totalBuyPHP = buyTransactions.reduce((sum, t) => sum + t.php_amount, 0);
    const totalBuyUSDT = buyTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);
    const totalSellPHP = sellTransactions.reduce((sum, t) => sum + t.php_amount, 0);
    const totalSellUSDT = sellTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);
    
    const avgBuyRate = totalBuyUSDT > 0 ? totalBuyPHP / totalBuyUSDT : 0;
    const avgSellRate = totalSellUSDT > 0 ? totalSellPHP / totalSellUSDT : 0;
    
    const minVolume = Math.min(totalBuyUSDT, totalSellUSDT);
    return Math.max(0, (avgSellRate - avgBuyRate) * minVolume);
  }

  calculateDailyROI(transactions) {
    const revenue = this.calculateTotalRevenue(transactions);
    const investment = transactions.filter(t => t.type === 'BUY').reduce((sum, t) => sum + t.php_amount, 0);
    
    return investment > 0 ? ((revenue - investment) / investment) * 100 : 0;
  }

  calculateDailyEfficiency(transactions) {
    if (transactions.length === 0) return 0;
    
    const successfulTransactions = transactions.filter(t => t.status === 'completed');
    return (successfulTransactions.length / transactions.length) * 100;
  }

  calculateDailyRisk(transactions) {
    if (transactions.length === 0) return 0;
    
    const amounts = transactions.map(t => t.usdt_amount);
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Normalize risk score to 0-100 scale
    return Math.min(100, (standardDeviation / mean) * 100);
  }

  getTopPerformers(transactions, users) {
    const userPerformance = users.map(user => {
      const userTransactions = transactions.filter(t => t.user_id === user.id);
      const profit = this.calculateDailyProfit(userTransactions);
      const volume = this.calculateTotalVolume(userTransactions);
      const profitMargin = volume > 0 ? (profit / (volume * 56)) * 100 : 0; // Assuming avg rate of 56
      
      return {
        ...user,
        profit,
        volume,
        profitMargin,
        transactions: userTransactions.length
      };
    })
    .filter(user => user.transactions > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);
    
    return userPerformance;
  }

  analyzePlatforms(transactions, platforms) {
    const totalVolume = this.calculateTotalVolume(transactions);
    
    return platforms.map(platform => {
      const platformTransactions = transactions.filter(t => t.platform === platform);
      const volume = this.calculateTotalVolume(platformTransactions);
      const percentage = totalVolume > 0 ? (volume / totalVolume) * 100 : 0;
      const efficiency = this.calculateDailyEfficiency(platformTransactions);
      
      return {
        name: platform,
        volume,
        percentage,
        efficiency,
        transactions: platformTransactions.length
      };
    })
    .filter(platform => platform.transactions > 0)
    .sort((a, b) => b.volume - a.volume);
  }

  analyzeTimePatterns(transactions) {
    const hourlyData = Array(24).fill(0);
    const dailyData = Array(7).fill(0);
    
    transactions.forEach(t => {
      const date = new Date(t.created_at);
      const hour = date.getHours();
      const day = date.getDay();
      
      hourlyData[hour] += t.usdt_amount;
      dailyData[day] += t.usdt_amount;
    });
    
    return {
      hourlyPattern: hourlyData,
      dailyPattern: dailyData,
      peakHour: hourlyData.indexOf(Math.max(...hourlyData)),
      peakDay: dailyData.indexOf(Math.max(...dailyData))
    };
  }

  calculateRiskMetrics(transactions) {
    const amounts = transactions.map(t => t.usdt_amount);
    if (amounts.length === 0) return { volatility: 0, maxDrawdown: 0, sharpeRatio: 0 };
    
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    const volatility = Math.sqrt(variance);
    
    // Calculate max drawdown
    let peak = amounts[0];
    let maxDrawdown = 0;
    
    amounts.forEach(amount => {
      if (amount > peak) peak = amount;
      const drawdown = (peak - amount) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    // Simple Sharpe ratio calculation
    const returns = amounts.slice(1).map((amount, i) => (amount - amounts[i]) / amounts[i]);
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const returnVariance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const sharpeRatio = Math.sqrt(returnVariance) > 0 ? meanReturn / Math.sqrt(returnVariance) : 0;
    
    return {
      volatility,
      maxDrawdown: maxDrawdown * 100,
      sharpeRatio
    };
  }

  calculateEfficiency(transactions) {
    if (transactions.length === 0) return 0;
    
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const successRate = (completedTransactions.length / transactions.length) * 100;
    
    const avgTransactionTime = 1; // Assume 1 hour average processing time
    const totalTime = transactions.length * avgTransactionTime;
    const timeEfficiency = totalTime > 0 ? (completedTransactions.length / totalTime) * 100 : 0;
    
    return (successRate + timeEfficiency) / 2;
  }

  async generatePredictions(analyticsData) {
    try {
      const chartData = analyticsData.chartData || [];
      if (chartData.length < 7) return this.getDefaultPredictions();
      
      // Simple linear regression for volume prediction
      const volumes = chartData.map(d => d.volume);
      const trend = this.calculateTrend(volumes);
      const lastVolume = volumes[volumes.length - 1];
      
      // Predict next week volume
      const nextWeekVolume = Math.max(0, lastVolume * (1 + trend / 100));
      
      // Predict profit based on current margin
      const avgMargin = analyticsData.profitMargin || 0;
      const nextWeekProfit = nextWeekVolume * (avgMargin / 100) * 56; // Assuming avg rate
      
      // Calculate growth trend
      const recentData = chartData.slice(-7);
      const olderData = chartData.slice(-14, -7);
      const recentAvg = recentData.reduce((sum, d) => sum + d.volume, 0) / recentData.length;
      const olderAvg = olderData.reduce((sum, d) => sum + d.volume, 0) / olderData.length;
      const growthTrend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      
      // Risk assessment
      const riskMetrics = analyticsData.riskMetrics || {};
      const riskLevel = riskMetrics.volatility > 20 ? 'High' : 
                       riskMetrics.volatility > 10 ? 'Medium' : 'Low';
      
      return {
        nextWeekVolume,
        nextWeekProfit,
        growthTrend,
        riskLevel,
        confidence: Math.min(95, chartData.length * 5) // Higher confidence with more data
      };
    } catch (error) {
      console.error('Error generating predictions:', error);
      return this.getDefaultPredictions();
    }
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;
    
    return avgY > 0 ? (slope / avgY) * 100 : 0;
  }

  async generateAlerts(analyticsData) {
    const alerts = [];
    
    // Volume alert
    if (analyticsData.volumeChange < -20) {
      alerts.push({
        type: 'warning',
        title: 'Volume Decline',
        message: `Trading volume has decreased by ${Math.abs(analyticsData.volumeChange).toFixed(1)}% recently.`
      });
    }
    
    // Profit margin alert
    if (analyticsData.profitMargin < 1) {
      alerts.push({
        type: 'error',
        title: 'Low Profit Margin',
        message: `Current profit margin is only ${analyticsData.profitMargin.toFixed(2)}%. Consider reviewing pricing strategy.`
      });
    }
    
    // Risk alert
    const riskMetrics = analyticsData.riskMetrics || {};
    if (riskMetrics.volatility > 25) {
      alerts.push({
        type: 'warning',
        title: 'High Volatility',
        message: `Transaction volatility is high (${riskMetrics.volatility.toFixed(1)}%). Monitor risk exposure.`
      });
    }
    
    // Efficiency alert
    if (analyticsData.efficiency < 80) {
      alerts.push({
        type: 'info',
        title: 'Efficiency Opportunity',
        message: `System efficiency is ${analyticsData.efficiency.toFixed(1)}%. Consider process optimization.`
      });
    }
    
    return alerts;
  }

  getDefaultAnalytics() {
    return {
      totalRevenue: 0,
      totalVolume: 0,
      profitMargin: 0,
      activeTraders: 0,
      revenueChange: 0,
      volumeChange: 0,
      marginChange: 0,
      tradersChange: 0,
      chartData: [],
      topPerformers: [],
      platformAnalysis: [],
      timeAnalysis: { hourlyPattern: [], dailyPattern: [], peakHour: 0, peakDay: 0 },
      riskMetrics: { volatility: 0, maxDrawdown: 0, sharpeRatio: 0 },
      efficiency: 0
    };
  }

  getDefaultPredictions() {
    return {
      nextWeekVolume: 0,
      nextWeekProfit: 0,
      growthTrend: 0,
      riskLevel: 'Low',
      confidence: 0
    };
  }
}

export const AnalyticsService = new AnalyticsServiceClass();