import {format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth} from 'date-fns';

class AppStateManagerClass {
  constructor() {
    this.currentUser = null;
    this.subscribers = new Set();
    this.data = {
      users: [],
      transactions: [],
      balances: {companyUSDT: {}},
      platforms: [],
      banks: [],
      systemLogs: [],
      hrLogs: [],
      config: {}
    };
  }

  initialize() {
    // Load data from localStorage
    const savedData = localStorage.getItem('coinmate-data');
    if (savedData) {
      this.data = {...this.data, ...JSON.parse(savedData)};
    }

    // Initialize with default data if empty
    if (this.data.users.length === 0) {
      this.initializeDefaultData();
    }

    // Load current user session
    const savedUser = localStorage.getItem('coinmate-current-user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  initializeDefaultData() {
    // Default users
    this.data.users = [
      {
        id: 1,
        email: 'alaa@coinmate.com',
        name: 'Alaa Qweider',
        role: 'super_admin',
        assignedBanks: ['BDO', 'BPI', 'GCash'],
        bankBalances: {BDO: 50000, BPI: 75000, GCash: 25000},
        isLoggedIn: false,
        loginTime: null
      },
      {
        id: 2,
        email: 'allen@coinmate.com',
        name: 'Allen Tagle',
        role: 'admin',
        assignedBanks: ['BDO', 'Metrobank'],
        bankBalances: {BDO: 30000, Metrobank: 40000},
        isLoggedIn: false,
        loginTime: null
      },
      {
        id: 3,
        email: 'supervisor@coinmate.com',
        name: 'Senior Analyst',
        role: 'supervisor',
        assignedBanks: ['BPI', 'UnionBank'],
        bankBalances: {BPI: 20000, UnionBank: 15000},
        isLoggedIn: false,
        loginTime: null
      },
      {
        id: 4,
        email: 'trader@coinmate.com',
        name: 'Trader One',
        role: 'analyst',
        assignedBanks: ['GCash'],
        bankBalances: {GCash: 10000},
        isLoggedIn: false,
        loginTime: null
      }
    ];

    // Default platforms and banks
    this.data.platforms = ['Binance', 'OKX', 'Bybit', 'KuCoin'];
    this.data.banks = ['BDO', 'BPI', 'Metrobank', 'UnionBank', 'GCash', 'PayMaya'];

    // Default company USDT balances
    this.data.balances.companyUSDT = {
      'Binance': 15000,
      'OKX': 12000,
      'Bybit': 8000,
      'KuCoin': 5000
    };

    // Default configuration
    this.data.config = {
      coinGeckoApiKey: '',
      telegramBotToken: '',
      telegramChatId: '',
      supabaseUrl: '',
      supabaseKey: '',
      exchangeRateUpdateInterval: 300000, // 5 minutes
      dashboardRefreshInterval: 10000, // 10 seconds
      notificationsEnabled: true,
      requireMFAForAdmin: false,
      logAllActions: true,
      darkMode: false,
      dailyProfitResetTime: '01:00', // Asia/Manila time
      totalInvestedFunds: 0,
      brandSettings: {
        favicon: null,
        logo: null,
        primaryColorLight: '#2563eb',
        primaryColorDark: '#3b82f6'
      }
    };

    // Sample transactions
    this.generateSampleTransactions();
    this.saveData();
  }

  generateSampleTransactions() {
    const sampleTransactions = [];
    const now = new Date();

    // Generate transactions for the last 30 days
    for (let i = 0; i < 50; i++) {
      const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const usdtAmount = parseFloat((Math.random() * 1000 + 100).toFixed(2));
      const rate = parseFloat((55 + Math.random() * 2).toFixed(2));
      const phpAmount = parseFloat((usdtAmount * rate).toFixed(2));

      sampleTransactions.push({
        id: `tx_${Date.now()}_${i}`,
        type,
        user_id: Math.floor(Math.random() * 4) + 1,
        user_name: this.data.users[Math.floor(Math.random() * 4)].name,
        usdtAmount,
        phpAmount,
        platform: this.data.platforms[Math.floor(Math.random() * this.data.platforms.length)],
        bank: this.data.banks[Math.floor(Math.random() * this.data.banks.length)],
        rate,
        fee: parseFloat((Math.random() * 50).toFixed(2)),
        timestamp: date,
        note: `Sample ${type.toLowerCase()} transaction`,
        status: 'completed'
      });
    }

    this.data.transactions = sampleTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.data));
  }

  saveData() {
    localStorage.setItem('coinmate-data', JSON.stringify(this.data));
    this.notify();
  }

  // User management
  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem('coinmate-current-user', JSON.stringify(user));

    // Update user login status
    const userIndex = this.data.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      this.data.users[userIndex].isLoggedIn = true;
      this.data.users[userIndex].loginTime = new Date();

      // Add HR log entry
      this.addHRLog({
        user: user.name,
        loginTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        logoutTime: 'Active',
        totalHours: '0:00',
        status: 'active',
        logoutType: null
      });

      this.saveData();
    }
  }

  logout() {
    if (this.currentUser) {
      const userIndex = this.data.users.findIndex(u => u.id === this.currentUser.id);
      if (userIndex !== -1) {
        const loginTime = new Date(this.data.users[userIndex].loginTime);
        const logoutTime = new Date();
        const totalHours = this.calculateHours(loginTime, logoutTime);

        this.data.users[userIndex].isLoggedIn = false;
        this.data.users[userIndex].loginTime = null;

        // Update HR log
        this.updateHRLog(this.currentUser.name, logoutTime, totalHours, 'manual');
      }
    }

    this.currentUser = null;
    localStorage.removeItem('coinmate-current-user');
    this.saveData();
  }

  // Data getters
  getUsers() {
    return this.data.users;
  }

  getTransactions() {
    return this.data.transactions;
  }

  getBalances() {
    return this.data.balances;
  }

  getPlatforms() {
    return this.data.platforms;
  }

  getBanks() {
    return this.data.banks;
  }

  getSystemLogs() {
    return this.data.systemLogs;
  }

  getHRLogs() {
    return this.data.hrLogs;
  }

  getConfig() {
    return this.data.config;
  }

  // Transaction management
  addTransaction(transaction) {
    const newTransaction = {
      ...transaction,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'completed'
    };

    this.data.transactions.unshift(newTransaction);
    this.updateBalances(newTransaction);
    this.saveData();
    return newTransaction;
  }

  updateTransaction(id, updates, reason, updatedBy) {
    const index = this.data.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      const oldTransaction = {...this.data.transactions[index]};
      this.data.transactions[index] = {...this.data.transactions[index], ...updates};

      // Log the change
      this.addSystemLog({
        type: 'TRANSACTION_EDIT',
        user: updatedBy,
        target_id: id,
        reason,
        old_value: oldTransaction,
        new_value: this.data.transactions[index]
      });

      this.saveData();
      return this.data.transactions[index];
    }
    return null;
  }

  deleteTransaction(id, reason, deletedBy) {
    const index = this.data.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      const deletedTransaction = this.data.transactions[index];
      this.data.transactions.splice(index, 1);

      // Log the deletion
      this.addSystemLog({
        type: 'TRANSACTION_DELETE',
        user: deletedBy,
        target_id: id,
        reason,
        old_value: deletedTransaction,
        new_value: null
      });

      this.saveData();
      return deletedTransaction;
    }
    return null;
  }

  updateBalances(transaction) {
    const {type, user_id, usdtAmount, phpAmount, platform, bank} = transaction;

    // Update user PHP balance
    const userIndex = this.data.users.findIndex(u => u.id === user_id);
    if (userIndex !== -1 && bank) {
      if (type === 'BUY') {
        this.data.users[userIndex].bankBalances[bank] = (this.data.users[userIndex].bankBalances[bank] || 0) + phpAmount;
      } else if (type === 'SELL') {
        this.data.users[userIndex].bankBalances[bank] = (this.data.users[userIndex].bankBalances[bank] || 0) - phpAmount;
      }
    }

    // Update company USDT balance
    if (platform) {
      if (type === 'BUY') {
        this.data.balances.companyUSDT[platform] = (this.data.balances.companyUSDT[platform] || 0) + usdtAmount;
      } else if (type === 'SELL') {
        this.data.balances.companyUSDT[platform] = (this.data.balances.companyUSDT[platform] || 0) - usdtAmount;
      }
    }
  }

  // Balance management
  adjustUserBalance(userId, bank, amount, reason, adjustedBy) {
    const userIndex = this.data.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const oldBalance = this.data.users[userIndex].bankBalances[bank] || 0;
      this.data.users[userIndex].bankBalances[bank] = amount;

      this.addSystemLog({
        type: 'BALANCE_ADJUSTMENT',
        user: adjustedBy,
        target_id: `user_${userId}_${bank}`,
        reason,
        old_value: oldBalance,
        new_value: amount
      });

      this.saveData();
    }
  }

  adjustCompanyUSDTBalance(platform, amount, reason, adjustedBy) {
    const oldBalance = this.data.balances.companyUSDT[platform] || 0;
    this.data.balances.companyUSDT[platform] = amount;

    this.addSystemLog({
      type: 'BALANCE_ADJUSTMENT',
      user: adjustedBy,
      target_id: `company_${platform}`,
      reason,
      old_value: oldBalance,
      new_value: amount
    });

    this.saveData();
  }

  // User management
  addUser(user) {
    const newUser = {
      ...user,
      id: Math.max(...this.data.users.map(u => u.id), 0) + 1,
      bankBalances: {},
      isLoggedIn: false,
      loginTime: null
    };

    this.data.users.push(newUser);

    this.addSystemLog({
      type: 'USER_ADDED',
      user: this.currentUser?.name || 'System',
      target_id: `user_${newUser.id}`,
      reason: 'New user created',
      old_value: null,
      new_value: newUser
    });

    this.saveData();
    return newUser;
  }

  updateUser(userId, updates) {
    const userIndex = this.data.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const oldUser = {...this.data.users[userIndex]};
      this.data.users[userIndex] = {...this.data.users[userIndex], ...updates};

      this.addSystemLog({
        type: 'USER_UPDATED',
        user: this.currentUser?.name || 'System',
        target_id: `user_${userId}`,
        reason: 'User information updated',
        old_value: oldUser,
        new_value: this.data.users[userIndex]
      });

      this.saveData();
      return this.data.users[userIndex];
    }
    return null;
  }

  deleteUser(userId) {
    const userIndex = this.data.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const deletedUser = this.data.users[userIndex];
      this.data.users.splice(userIndex, 1);

      this.addSystemLog({
        type: 'USER_DELETED',
        user: this.currentUser?.name || 'System',
        target_id: `user_${userId}`,
        reason: 'User deleted',
        old_value: deletedUser,
        new_value: null
      });

      this.saveData();
      return deletedUser;
    }
    return null;
  }

  // Platform and bank management
  addPlatform(platform) {
    if (!this.data.platforms.includes(platform)) {
      this.data.platforms.push(platform);
      this.data.balances.companyUSDT[platform] = 0;

      this.addSystemLog({
        type: 'PLATFORM_ADDED',
        user: this.currentUser?.name || 'System',
        target_id: `platform_${platform}`,
        reason: 'New platform added',
        old_value: null,
        new_value: platform
      });

      this.saveData();
    }
  }

  addBank(bank) {
    if (!this.data.banks.includes(bank)) {
      this.data.banks.push(bank);

      this.addSystemLog({
        type: 'BANK_ADDED',
        user: this.currentUser?.name || 'System',
        target_id: `bank_${bank}`,
        reason: 'New bank added',
        old_value: null,
        new_value: bank
      });

      this.saveData();
    }
  }

  deletePlatform(platform) {
    const balance = this.data.balances.companyUSDT[platform] || 0;
    if (balance !== 0) {
      throw new Error('Platform can only be deleted when USDT balance is 0');
    }

    const platformIndex = this.data.platforms.indexOf(platform);
    if (platformIndex !== -1) {
      this.data.platforms.splice(platformIndex, 1);
      delete this.data.balances.companyUSDT[platform];

      this.addSystemLog({
        type: 'PLATFORM_DELETED',
        user: this.currentUser?.name || 'System',
        target_id: `platform_${platform}`,
        reason: 'Platform deleted',
        old_value: platform,
        new_value: null
      });

      this.saveData();
    }
  }

  deleteBank(bank) {
    // Check if any user has balance in this bank
    const usersWithBalance = this.data.users.filter(user => 
      user.bankBalances && user.bankBalances[bank] && user.bankBalances[bank] !== 0
    );

    if (usersWithBalance.length > 0) {
      throw new Error('Bank can only be deleted when all user PHP balances are 0');
    }

    const bankIndex = this.data.banks.indexOf(bank);
    if (bankIndex !== -1) {
      this.data.banks.splice(bankIndex, 1);

      // Remove bank from all users' assigned banks
      this.data.users.forEach(user => {
        if (user.assignedBanks && user.assignedBanks.includes(bank)) {
          user.assignedBanks = user.assignedBanks.filter(b => b !== bank);
        }
        if (user.bankBalances && user.bankBalances[bank] !== undefined) {
          delete user.bankBalances[bank];
        }
      });

      this.addSystemLog({
        type: 'BANK_DELETED',
        user: this.currentUser?.name || 'System',
        target_id: `bank_${bank}`,
        reason: 'Bank deleted',
        old_value: bank,
        new_value: null
      });

      this.saveData();
    }
  }

  // System logs
  addSystemLog(log) {
    const newLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.data.systemLogs.unshift(newLog);
    this.saveData();
  }

  // HR logs
  addHRLog(log) {
    this.data.hrLogs.unshift(log);
    this.saveData();
  }

  updateHRLog(userName, logoutTime, totalHours, logoutType) {
    const logIndex = this.data.hrLogs.findIndex(
      log => log.user === userName && log.status === 'active'
    );

    if (logIndex !== -1) {
      this.data.hrLogs[logIndex] = {
        ...this.data.hrLogs[logIndex],
        logoutTime: format(logoutTime, 'yyyy-MM-dd HH:mm:ss'),
        totalHours,
        status: 'completed',
        logoutType
      };

      this.saveData();
    }
  }

  calculateHours(startTime, endTime) {
    const diffMs = endTime - startTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  // Analytics
  getTransactionsByPeriod(period = 'today') {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
    }

    return this.data.transactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  getAverageBuyRate() {
    const buyTransactions = this.data.transactions.filter(t => t.type === 'BUY');
    if (buyTransactions.length === 0) return 0;

    const totalPHP = buyTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
    const totalUSDT = buyTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);

    return totalUSDT > 0 ? totalPHP / totalUSDT : 0;
  }

  getAverageSellRate() {
    const sellTransactions = this.data.transactions.filter(t => t.type === 'SELL');
    if (sellTransactions.length === 0) return 0;

    const totalPHP = sellTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
    const totalUSDT = sellTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);

    return totalUSDT > 0 ? totalPHP / totalUSDT : 0;
  }

  getTotalCompanyUSDT() {
    return Object.values(this.data.balances.companyUSDT).reduce((sum, amount) => sum + amount, 0);
  }

  getDailyProfit() {
    const resetTime = this.data.config.dailyProfitResetTime || '01:00';
    const [resetHours, resetMinutes] = resetTime.split(':').map(Number);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), resetHours, resetMinutes);
    
    // If current time is before reset time, use yesterday's reset time
    let startTime = today;
    if (now < today) {
      startTime = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    }

    const transactions = this.data.transactions.filter(t => {
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

    // Profit = (Sell Rate - Buy Rate) * USDT Volume
    const profit = (avgSellRate - avgBuyRate) * Math.min(totalBuyUSDT, totalSellUSDT);
    return Math.max(0, profit);
  }

  getNetProfit(period = 'today') {
    const transactions = this.getTransactionsByPeriod(period);
    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');

    const totalBuyPHP = buyTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
    const totalBuyUSDT = buyTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
    const totalSellPHP = sellTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
    const totalSellUSDT = sellTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);

    const avgBuyRate = totalBuyUSDT > 0 ? totalBuyPHP / totalBuyUSDT : 0;
    const avgSellRate = totalSellUSDT > 0 ? totalSellPHP / totalSellUSDT : 0;

    // Profit = (Sell Rate - Buy Rate) * USDT Volume
    const profit = (avgSellRate - avgBuyRate) * Math.min(totalBuyUSDT, totalSellUSDT);
    return Math.max(0, profit);
  }

  // Configuration
  updateConfig(updates) {
    this.data.config = {...this.data.config, ...updates};
    this.saveData();
  }

  // Force logout all users (for EOD)
  forceLogoutAllUsers() {
    const logoutTime = new Date();
    
    this.data.users.forEach(user => {
      if (user.isLoggedIn && user.loginTime) {
        const loginTime = new Date(user.loginTime);
        const totalHours = this.calculateHours(loginTime, logoutTime);
        
        user.isLoggedIn = false;
        user.loginTime = null;
        
        // Update HR log
        this.updateHRLog(user.name, logoutTime, totalHours, 'eod_forced');
      }
    });

    this.saveData();
  }

  // Check if user can unassign bank
  canUnassignBank(userId, bank) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user || !user.bankBalances) return true;
    
    const balance = user.bankBalances[bank] || 0;
    return balance === 0;
  }

  // Role hierarchy check
  canManageRole(currentRole, targetRole) {
    const hierarchy = ['super_admin', 'admin', 'supervisor', 'analyst'];
    const currentIndex = hierarchy.indexOf(currentRole);
    const targetIndex = hierarchy.indexOf(targetRole);
    
    return currentIndex < targetIndex;
  }
}

export const AppStateManager = new AppStateManagerClass();