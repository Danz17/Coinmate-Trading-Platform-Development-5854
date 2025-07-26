class ValidationServiceClass {
  constructor() {
    this.validationRules = {
      trade: {
        minAmount: 0.01,
        maxAmount: 1000000,
        requiredFields: ['selectedUser', 'userBank', 'platform', 'usdtAmount', 'phpAmount', 'rate']
      }
    };
  }

  // Validate trade transaction
  validateTrade(formData, transactionType, availableBalances) {
    const errors = {};
    const warnings = [];

    // Required fields validation
    this.validationRules.trade.requiredFields.forEach(field => {
      if (!formData[field] || formData[field] === '') {
        errors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      }
    });

    // Amount validations
    const usdtAmount = parseFloat(formData.usdtAmount) || 0;
    const phpAmount = parseFloat(formData.phpAmount) || 0;
    const rate = parseFloat(formData.rate) || 0;

    if (usdtAmount < this.validationRules.trade.minAmount) {
      errors.usdtAmount = `USDT amount must be at least ${this.validationRules.trade.minAmount}`;
    }

    if (usdtAmount > this.validationRules.trade.maxAmount) {
      errors.usdtAmount = `USDT amount cannot exceed ${this.validationRules.trade.maxAmount}`;
    }

    if (phpAmount <= 0) {
      errors.phpAmount = 'PHP amount must be greater than 0';
    }

    if (rate <= 0) {
      errors.rate = 'Exchange rate must be greater than 0';
    }

    // Balance validation for SELL transactions
    if (transactionType === 'SELL' && formData.userBank && availableBalances) {
      const bankBalance = availableBalances[formData.userBank] || 0;
      if (phpAmount > bankBalance) {
        errors.phpAmount = `Insufficient balance. Available: ₱${bankBalance.toFixed(2)}`;
      }
    }

    // Platform USDT validation for BUY transactions
    if (transactionType === 'BUY' && formData.platform && availableBalances.platformUSDT) {
      const platformBalance = availableBalances.platformUSDT[formData.platform] || 0;
      if (usdtAmount > platformBalance) {
        errors.platform = `Insufficient USDT on platform. Available: ${platformBalance.toFixed(2)} USDT`;
      }
    }

    // Rate validation warnings
    if (rate > 0) {
      const currentMarketRate = 56.25; // This should come from ExchangeRateService
      const deviation = Math.abs((rate - currentMarketRate) / currentMarketRate) * 100;
      
      if (deviation > 5) {
        warnings.push({
          type: 'rate_deviation',
          message: `Rate deviates ${deviation.toFixed(1)}% from market rate (₱${currentMarketRate.toFixed(2)})`
        });
      }
    }

    // Large transaction warning
    if (usdtAmount > 10000) {
      warnings.push({
        type: 'large_transaction',
        message: 'Large transaction amount - please verify details carefully'
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  // Validate user balance adjustment
  validateBalanceAdjustment(userId, bank, newAmount, reason, currentBalances) {
    const errors = {};
    
    if (!userId) errors.userId = 'User is required';
    if (!bank) errors.bank = 'Bank is required';
    if (!reason || reason.trim().length < 10) {
      errors.reason = 'Reason must be at least 10 characters long';
    }

    const amount = parseFloat(newAmount) || 0;
    if (amount < 0) {
      errors.amount = 'Balance cannot be negative';
    }

    // Check for pending transactions that might affect this balance
    // This would need integration with transaction service
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Validate user deletion
  validateUserDeletion(userId, userBalances, pendingTransactions) {
    const errors = {};
    const warnings = [];

    // Check for non-zero balances
    const totalBalance = Object.values(userBalances || {}).reduce((sum, balance) => sum + balance, 0);
    if (totalBalance > 0) {
      errors.balances = `User has non-zero balances totaling ₱${totalBalance.toFixed(2)}`;
    }

    // Check for pending transactions
    if (pendingTransactions && pendingTransactions.length > 0) {
      errors.transactions = `User has ${pendingTransactions.length} pending transactions`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  // Validate platform/bank deletion
  validatePlatformDeletion(platformName, platformBalance, recentTransactions) {
    const errors = {};
    
    if (platformBalance > 0) {
      errors.balance = `Platform has non-zero balance: ${platformBalance.toFixed(2)} USDT`;
    }

    // Check for recent transactions (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTxns = recentTransactions.filter(tx => 
      new Date(tx.created_at) > oneDayAgo && tx.platform === platformName
    );

    if (recentTxns.length > 0) {
      errors.recentActivity = `Platform has ${recentTxns.length} transactions in the last 24 hours`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Validate system settings
  validateSystemSettings(settings) {
    const errors = {};
    
    if (settings.daily_profit_reset_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(settings.daily_profit_reset_time)) {
        errors.daily_profit_reset_time = 'Invalid time format (HH:MM)';
      }
    }

    if (settings.total_invested_funds !== undefined) {
      const amount = parseFloat(settings.total_invested_funds);
      if (isNaN(amount) || amount < 0) {
        errors.total_invested_funds = 'Invalid investment amount';
      }
    }

    if (settings.exchange_rate_update_interval) {
      const interval = parseInt(settings.exchange_rate_update_interval);
      if (isNaN(interval) || interval < 60000) { // Minimum 1 minute
        errors.exchange_rate_update_interval = 'Update interval must be at least 1 minute';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Validate organization settings
  validateOrganization(orgData) {
    const errors = {};
    
    if (!orgData.name || orgData.name.trim().length < 2) {
      errors.name = 'Organization name must be at least 2 characters';
    }

    if (!orgData.display_name || orgData.display_name.trim().length < 2) {
      errors.display_name = 'Display name must be at least 2 characters';
    }

    // Validate name format (lowercase with underscores only)
    if (orgData.name && !/^[a-z0-9_]+$/.test(orgData.name)) {
      errors.name = 'Name can only contain lowercase letters, numbers, and underscores';
    }

    // Validate color formats
    if (orgData.primary_color_light && !/^#[0-9A-Fa-f]{6}$/.test(orgData.primary_color_light)) {
      errors.primary_color_light = 'Invalid color format';
    }

    if (orgData.primary_color_dark && !/^#[0-9A-Fa-f]{6}$/.test(orgData.primary_color_dark)) {
      errors.primary_color_dark = 'Invalid color format';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export const ValidationService = new ValidationServiceClass();