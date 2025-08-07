import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import SupabaseService from './SupabaseService.js';

class AppStateManagerClass {
  constructor() {
    this.currentUser = null;
    this.subscribers = new Set();
    this.data = {
      users: [],
      transactions: [],
      platforms: [],
      banks: [],
      systemLogs: [],
      hrLogs: [],
      systemSettings: {}
    };
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    try {
      // Load current user session
      const savedUser = localStorage.getItem('coinmate-current-user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }

      // Load all data from Supabase
      await this.loadAllData();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AppStateManager:', error);
      // Fallback to localStorage if available
      this.loadFromLocalStorage();
      this.isInitialized = true;
      // Continue even if there's an error
    }
  }

  async loadAllData() {
    try {
      const [users, transactions, platforms, banks, systemSettings, systemLogs, hrLogs] = await Promise.all([
        SupabaseService.getUsers().catch(() => []),
        SupabaseService.getTransactions().catch(() => []),
        SupabaseService.getPlatforms().catch(() => []),
        SupabaseService.getBanks().catch(() => []),
        SupabaseService.getSystemSettings().catch(() => ({})),
        SupabaseService.getSystemLogs().catch(() => []),
        SupabaseService.getHRLogs().catch(() => [])
      ]);

      this.data = {
        users: users || [],
        transactions: transactions || [],
        platforms: platforms || [],
        banks: banks || [],
        systemSettings: systemSettings || {},
        systemLogs: systemLogs || [],
        hrLogs: hrLogs || []
      };
      this.notify();
    } catch (error) {
      console.error('Error loading data:', error);
      // Don't throw error, just log it and continue with empty data
    }
  }

  loadFromLocalStorage() {
    const savedData = localStorage.getItem('coinmate-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        this.data = { ...this.data, ...parsedData };
        this.notify();
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
      }
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.data));
  }

  // User management
  getCurrentUser() {
    return this.currentUser;
  }

  async setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem('coinmate-current-user', JSON.stringify(user));

    // Update user login status
    try {
      await SupabaseService.updateUser(user.id, { is_logged_in: true, login_time: new Date().toISOString() });

      // Add HR log
      await SupabaseService.createHRLog({
        user_name: user.name,
        login_time: new Date().toISOString(),
        status: 'active'
      });
      await this.loadAllData();
    } catch (error) {
      console.error('Error updating user login status:', error);
    }
  }

  async logout() {
    if (this.currentUser) {
      try {
        // Update user logout status
        await SupabaseService.updateUser(this.currentUser.id, { is_logged_in: false, login_time: null });

        // Update HR log
        const hrLogs = await SupabaseService.getHRLogs();
        const activeLog = hrLogs.find(log => log.user_name === this.currentUser.name && log.status === 'active');
        if (activeLog) {
          const logoutTime = new Date();
          const loginTime = new Date(activeLog.login_time);
          const totalHours = this.calculateHours(loginTime, logoutTime);

          await SupabaseService.updateHRLog(activeLog.id, {
            logout_time: logoutTime.toISOString(),
            total_hours: totalHours,
            status: 'completed',
            logout_type: 'manual'
          });
        }
      } catch (error) {
        console.error('Error updating logout status:', error);
      }
    }
    this.currentUser = null;
    localStorage.removeItem('coinmate-current-user');
  }

  calculateHours(startTime, endTime) {
    const diffMs = endTime - startTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  // Data getters
  getUsers() {
    return this.data.users;
  }

  getTransactions() {
    return this.data.transactions;
  }

  getPlatforms() {
    return this.data.platforms.map(p => p.name || p);
  }

  getBanks() {
    return this.data.banks.map(b => b.name || b);
  }

  getSystemLogs() {
    return this.data.systemLogs;
  }

  getHRLogs() {
    return this.data.hrLogs;
  }

  getSystemSettings() {
    return this.data.systemSettings;
  }

  // Get platform balances
  getBalances() {
    const companyUSDT = {};
    this.data.platforms.forEach(platform => {
      const name = platform.name || platform;
      companyUSDT[name] = platform.usdt_balance || 0;
    });
    return { companyUSDT };
  }

  // Transaction management
  async addTransaction(transaction) {
    try {
      const newTransaction = await SupabaseService.createTransaction({
        type: transaction.type,
        user_id: transaction.user_id,
        user_name: transaction.user_name,
        usdt_amount: transaction.usdtAmount,
        php_amount: transaction.phpAmount,
        platform: transaction.platform,
        bank: transaction.bank,
        rate: transaction.rate,
        fee: transaction.fee || 0,
        note: transaction.note || '',
        status: 'completed'
      });

      // Update balances
      await this.updateBalances(newTransaction);
      await this.loadAllData();
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  async updateBalances(transaction) {
    const { type, user_id, usdt_amount, php_amount, platform, bank } = transaction;
    try {
      // Update user PHP balance
      if (bank) {
        const user = this.data.users.find(u => u.id === user_id);
        if (user) {
          const currentBalances = user.bank_balances || {};
          const currentBalance = currentBalances[bank] || 0;
          let newBalance;
          if (type === 'BUY') {
            newBalance = currentBalance + php_amount;
          } else if (type === 'SELL') {
            newBalance = currentBalance - php_amount;
          } else {
            newBalance = currentBalance;
          }
          const updatedBalances = { ...currentBalances, [bank]: newBalance };
          await SupabaseService.updateUser(user_id, { bank_balances: updatedBalances });
        }
      }

      // Update platform USDT balance
      if (platform) {
        const platformData = this.data.platforms.find(p => (p.name || p) === platform);
        if (platformData) {
          let newBalance;
          const currentBalance = platformData.usdt_balance || 0;
          if (type === 'BUY') {
            newBalance = currentBalance + usdt_amount;
          } else if (type === 'SELL') {
            newBalance = currentBalance - usdt_amount;
          } else {
            newBalance = currentBalance;
          }
          await SupabaseService.updatePlatformBalance(platform, newBalance);
        }
      }
    } catch (error) {
      console.error('Error updating balances:', error);
      throw error;
    }
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
      const transactionDate = new Date(t.created_at);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  getAverageBuyRate() {
    const buyTransactions = this.data.transactions.filter(t => t.type === 'BUY');
    if (buyTransactions.length === 0) return 0;
    const totalPHP = buyTransactions.reduce((sum, t) => sum + t.php_amount, 0);
    const totalUSDT = buyTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);
    return totalUSDT > 0 ? totalPHP / totalUSDT : 0;
  }

  getAverageSellRate() {
    const sellTransactions = this.data.transactions.filter(t => t.type === 'SELL');
    if (sellTransactions.length === 0) return 0;
    const totalPHP = sellTransactions.reduce((sum, t) => sum + t.php_amount, 0);
    const totalUSDT = sellTransactions.reduce((sum, t) => sum + t.usdt_amount, 0);
    return totalUSDT > 0 ? totalPHP / totalUSDT : 0;
  }

  getTotalCompanyUSDT() {
    return this.data.platforms.reduce((sum, platform) => {
      return sum + (platform.usdt_balance || 0);
    }, 0);
  }

  // User management methods
  async addUser(userData) {
    try {
      const newUser = await SupabaseService.createUser({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        assigned_banks: userData.assignedBanks || [],
        bank_balances: {}
      });
      await this.loadAllData();
      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async updateUser(userId, updates) {
    try {
      const updatedUser = await SupabaseService.updateUser(userId, {
        name: updates.name,
        email: updates.email,
        role: updates.role,
        assigned_banks: updates.assignedBanks
      });
      await this.loadAllData();
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      await SupabaseService.deleteUser(userId);
      await this.loadAllData();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Platform and bank management
  async addPlatform(platformName) {
    try {
      await SupabaseService.createPlatform(platformName, 0);
      await this.loadAllData();
    } catch (error) {
      console.error('Error adding platform:', error);
      throw error;
    }
  }

  async deletePlatform(platformName) {
    // Check if platform has non-zero balance
    const balances = this.getBalances();
    const platformBalance = balances.companyUSDT[platformName] || 0;
    if (platformBalance > 0) {
      throw new Error('Cannot delete platform with non-zero balance');
    }

    try {
      await SupabaseService.deletePlatform(platformName);
      await this.loadAllData();
    } catch (error) {
      console.error('Error deleting platform:', error);
      throw error;
    }
  }

  async addBank(bankName) {
    try {
      await SupabaseService.createBank(bankName);
      await this.loadAllData();
    } catch (error) {
      console.error('Error adding bank:', error);
      throw error;
    }
  }

  async deleteBank(bankName) {
    // Check if any user has a non-zero balance for this bank
    const users = this.getUsers();
    const bankInUse = users.some(user => {
      const bankBalance = user.bank_balances?.[bankName] || 0;
      return bankBalance > 0;
    });

    if (bankInUse) {
      throw new Error('Cannot delete bank with active balances');
    }

    try {
      await SupabaseService.deleteBank(bankName);
      await this.loadAllData();
    } catch (error) {
      console.error('Error deleting bank:', error);
      throw error;
    }
  }

  async adjustUserBalance(userId, bank, amount, reason, adjustedBy) {
    try {
      const user = this.data.users.find(u => u.id === userId);
      if (user) {
        const currentBalances = user.bank_balances || {};
        const updatedBalances = { ...currentBalances, [bank]: amount };
        await SupabaseService.updateUser(userId, { bank_balances: updatedBalances });
        await this.loadAllData();
      }
    } catch (error) {
      console.error('Error adjusting user balance:', error);
      throw error;
    }
  }

  async adjustCompanyUSDTBalance(platform, amount, reason, adjustedBy) {
    try {
      await SupabaseService.updatePlatformBalance(platform, amount);
      await this.loadAllData();
    } catch (error) {
      console.error('Error adjusting platform balance:', error);
      throw error;
    }
  }
  
  // System logs
  async addSystemLog(logData) {
    try {
      await SupabaseService.createSystemLog({
        type: logData.type,
        user: logData.user,
        target_id: logData.target_id,
        reason: logData.reason,
        old_value: logData.old_value,
        new_value: logData.new_value,
      });
      await this.loadAllData();
    } catch (error) {
      console.error('Error creating system log:', error);
    }
  }

  // System settings
  async updateSystemSettings(settings) {
    try {
      await SupabaseService.updateSystemSettings(settings);
      await this.loadAllData();
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }
}

export const AppStateManager = new AppStateManagerClass();