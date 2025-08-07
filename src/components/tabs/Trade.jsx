import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { RoleManager } from '../../services/RoleManager';
import { ExchangeRateService } from '../../services/ExchangeRateService';
import { toastManager } from '../common/Toast.jsx';
import supabase from '../../lib/supabase';

const { FiDollarSign, FiTrendingUp, FiTrendingDown, FiSend, FiCheck, FiAlertTriangle, FiRefreshCw, FiInfo } = FiIcons;

const Trade = ({ currentUser }) => {
  const [formData, setFormData] = useState({
    selectedUser: '',
    rate: '',
    usdtAmount: '',
    phpAmount: '',
    userBank: '',
    platform: '',
    transferFee: '',
    note: ''
  });
  const [transactionType, setTransactionType] = useState('BUY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [users, setUsers] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [lastRates, setLastRates] = useState({ buy: 0, sell: 0 });
  const [validationErrors, setValidationErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [selectedUserBankBalances, setSelectedUserBankBalances] = useState({});
  const [availableBalance, setAvailableBalance] = useState(0);
  const [exchangeRateInfo, setExchangeRateInfo] = useState(null);
  const [rateUpdateInterval, setRateUpdateInterval] = useState(null);

  useEffect(() => {
    loadData();
    loadTradeMemory();
    startRateUpdates();
    
    const unsubscribe = AppStateManager.subscribe(loadData);
    return () => {
      unsubscribe();
      if (rateUpdateInterval) clearInterval(rateUpdateInterval);
    };
  }, []);

  useEffect(() => {
    const rate = ExchangeRateService.getCurrentRate();
    if (rate.rate && !formData.rate) {
      setFormData(prev => ({ ...prev, rate: rate.rate.toFixed(4) }));
    }
    setExchangeRateInfo(rate);
  }, []);

  useEffect(() => {
    if (formData.selectedUser) {
      const user = users.find(u => u.name === formData.selectedUser);
      if (user) {
        setFormData(prev => ({ ...prev, userBank: '' }));
        setSelectedUserBankBalances(user.bank_balances || {});
      }
    }
  }, [formData.selectedUser, users]);

  useEffect(() => {
    if (formData.selectedUser && formData.userBank) {
      const balance = selectedUserBankBalances[formData.userBank] || 0;
      setAvailableBalance(balance);
    }
  }, [formData.selectedUser, formData.userBank, selectedUserBankBalances]);

  useEffect(() => {
    loadTradeMemoryForType(transactionType);
  }, [transactionType]);

  const startRateUpdates = () => {
    // Update exchange rate every 30 seconds
    const interval = setInterval(async () => {
      try {
        await ExchangeRateService.fetchRate();
        const rate = ExchangeRateService.getCurrentRate();
        setExchangeRateInfo(rate);
        
        // Auto-update rate if user hasn't manually set it
        if (!formData.rate || formData.rate === rate.rate.toFixed(4)) {
          setFormData(prev => ({ ...prev, rate: rate.rate.toFixed(4) }));
        }
      } catch (error) {
        console.error('Error updating exchange rate:', error);
      }
    }, 30000);
    
    setRateUpdateInterval(interval);
  };

  const loadData = () => {
    const allUsers = AppStateManager.getUsers();
    const allPlatforms = AppStateManager.getPlatforms();
    const allBanks = AppStateManager.getBanks();
    const transactions = AppStateManager.getTransactions();

    setUsers(allUsers);
    setPlatforms(allPlatforms);
    setBanks(allBanks);

    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');
    const lastBuy = buyTransactions.length > 0 ? buyTransactions[0].rate : 0;
    const lastSell = sellTransactions.length > 0 ? sellTransactions[0].rate : 0;

    setLastRates({ buy: lastBuy, sell: lastSell });
  };

  const loadTradeMemory = async () => {
    try {
      const { data: memory, error } = await supabase
        .from('user_trade_memory')
        .select('*')
        .eq('user_id', currentUser.id)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error loading trade memory:', error);
        return;
      }

      if (memory && memory.length > 0) {
        loadTradeMemoryForType(transactionType, memory);
      }
    } catch (error) {
      console.error('Error loading trade memory:', error);
    }
  };

  const loadTradeMemoryForType = (type, memory = null) => {
    if (!memory) return;

    const typeKey = type.toLowerCase();
    const memoryForType = memory.find(m => m.transaction_type === typeKey);

    if (memoryForType) {
      setFormData(prev => ({
        ...prev,
        selectedUser: memoryForType.selected_user || '',
        userBank: memoryForType.user_bank || ''
      }));
    }
  };

  const saveTradeMemory = async () => {
    if (!formData.selectedUser || !formData.userBank) return;

    const typeKey = transactionType.toLowerCase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    try {
      await supabase
        .from('user_trade_memory')
        .upsert({
          user_id: currentUser.id,
          transaction_type: typeKey,
          selected_user: formData.selectedUser,
          user_bank: formData.userBank,
          expires_at: expiresAt.toISOString()
        }, { onConflict: 'user_id,transaction_type' });
    } catch (error) {
      console.error('Error saving trade memory:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleUSDTChange = (value) => {
    handleInputChange('usdtAmount', value);
    if (value && formData.rate && !isCalculating) {
      setIsCalculating(true);
      const usdtAmount = parseFloat(value);
      const rate = parseFloat(formData.rate);
      if (!isNaN(usdtAmount) && !isNaN(rate)) {
        const phpAmount = (usdtAmount * rate).toFixed(2);
        setFormData(prev => ({ ...prev, phpAmount }));
      }
      setTimeout(() => setIsCalculating(false), 100);
    }
  };

  const handlePHPChange = (value) => {
    handleInputChange('phpAmount', value);
    if (value && formData.rate && !isCalculating) {
      setIsCalculating(true);
      const phpAmount = parseFloat(value);
      const rate = parseFloat(formData.rate);
      if (!isNaN(phpAmount) && !isNaN(rate) && rate > 0) {
        const usdtAmount = (phpAmount / rate).toFixed(6);
        setFormData(prev => ({ ...prev, usdtAmount }));
      }
      setTimeout(() => setIsCalculating(false), 100);
    }
  };

  const handleRateChange = (value) => {
    handleInputChange('rate', value);
    // Recalculate amounts when rate changes
    if (value && formData.usdtAmount) {
      const usdtAmount = parseFloat(formData.usdtAmount);
      const rate = parseFloat(value);
      if (!isNaN(usdtAmount) && !isNaN(rate)) {
        const phpAmount = (usdtAmount * rate).toFixed(2);
        setFormData(prev => ({ ...prev, phpAmount }));
      }
    }
  };

  const getAvailableUsers = () => {
    const featureFlags = RoleManager.getFeatureFlags(currentUser.role);
    if (featureFlags.canTradeForOthers) {
      if (RoleManager.hasPermission(currentUser.role, 'trade_all_users')) {
        return users;
      } else if (RoleManager.hasPermission(currentUser.role, 'trade_assigned_users')) {
        return users;
      }
    }
    return users.filter(u => u.id === currentUser.id);
  };

  const getSelectedUserBanks = () => {
    if (!formData.selectedUser) return [];
    const user = users.find(u => u.name === formData.selectedUser);
    return user ? user.assigned_banks || [] : [];
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.selectedUser) errors.selectedUser = 'Please select a user account';
    if (!formData.userBank) errors.userBank = 'Please select a bank account';
    if (!formData.rate) errors.rate = 'Please enter an exchange rate';
    if (!formData.usdtAmount) errors.usdtAmount = 'Please enter USDT amount';
    if (!formData.phpAmount) errors.phpAmount = 'Please enter PHP amount';
    if (!formData.platform) errors.platform = 'Please select a trading platform';

    // Validate amounts
    if (formData.usdtAmount && parseFloat(formData.usdtAmount) <= 0) {
      errors.usdtAmount = 'USDT amount must be greater than 0';
    }
    if (formData.phpAmount && parseFloat(formData.phpAmount) <= 0) {
      errors.phpAmount = 'PHP amount must be greater than 0';
    }
    if (formData.rate && parseFloat(formData.rate) <= 0) {
      errors.rate = 'Exchange rate must be greater than 0';
    }

    // Validate balance for SELL transactions
    if (transactionType === 'SELL' && formData.phpAmount && availableBalance) {
      const phpAmount = parseFloat(formData.phpAmount);
      if (phpAmount > availableBalance) {
        errors.phpAmount = `Insufficient balance. Available: ₱${availableBalance.toFixed(2)}`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toastManager.error('Please fix the validation errors before submitting');
      return;
    }

    const selectedUser = users.find(u => u.name === formData.selectedUser);
    
    if (selectedUser.id !== currentUser.id) {
      const featureFlags = RoleManager.getFeatureFlags(currentUser.role);
      if (!featureFlags.canTradeForOthers) {
        toastManager.error('You do not have permission to trade for other users');
        return;
      }
    }

    // Prepare confirmation data
    const confirmation = {
      type: transactionType,
      user: selectedUser.name,
      userBank: formData.userBank,
      platform: formData.platform,
      usdtAmount: parseFloat(formData.usdtAmount),
      phpAmount: parseFloat(formData.phpAmount),
      rate: parseFloat(formData.rate),
      fee: parseFloat(formData.transferFee) || 0,
      note: formData.note,
      availableBalance: availableBalance,
      impact: transactionType === 'SELL' ? 
        `₱${availableBalance.toFixed(2)} → ₱${(availableBalance - parseFloat(formData.phpAmount)).toFixed(2)}` :
        `₱${availableBalance.toFixed(2)} → ₱${(availableBalance + parseFloat(formData.phpAmount)).toFixed(2)}`
    };

    setConfirmationData(confirmation);
    setShowConfirmation(true);
  };

  const executeTransaction = async () => {
    setIsSubmitting(true);
    try {
      const selectedUser = users.find(u => u.name === formData.selectedUser);
      
      const transaction = {
        type: transactionType,
        user_id: selectedUser.id,
        user_name: selectedUser.name,
        usdtAmount: parseFloat(formData.usdtAmount),
        phpAmount: parseFloat(formData.phpAmount),
        platform: formData.platform,
        bank: formData.userBank,
        rate: parseFloat(formData.rate),
        fee: parseFloat(formData.transferFee) || 0,
        note: formData.note,
        selectedUser: formData.selectedUser
      };

      await AppStateManager.addTransaction(transaction);
      await saveTradeMemory();

      // Reset form but keep rate and user selection
      setFormData({
        selectedUser: formData.selectedUser,
        rate: ExchangeRateService.getCurrentRate().rate.toFixed(4),
        usdtAmount: '',
        phpAmount: '',
        userBank: formData.userBank,
        platform: '',
        transferFee: '',
        note: ''
      });

      setShowConfirmation(false);
      toastManager.success(`${transactionType} transaction completed successfully!`, {
        action: {
          label: 'View Transaction',
          onClick: () => {
            window.location.hash = '#transactions';
          }
        }
      });
    } catch (error) {
      console.error('Error submitting transaction:', error);
      toastManager.error('Error submitting transaction. Please try again.', {
        action: {
          label: 'Retry',
          onClick: () => executeTransaction()
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableUsers = getAvailableUsers();
  const selectedUserBanks = getSelectedUserBanks();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Trading Interface
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Execute buy/sell transactions with real-time rate updates and validation
        </p>
      </div>

      {/* Exchange Rate Info */}
      {exchangeRateInfo && (
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${exchangeRateInfo.source === 'CoinGecko' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Current Rate: ₱{exchangeRateInfo.rate.toFixed(4)} per USDT
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Source: {exchangeRateInfo.source} • Updated: {exchangeRateInfo.lastUpdate ? new Date(exchangeRateInfo.lastUpdate).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleRateChange(exchangeRateInfo.rate.toFixed(4))}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <SafeIcon icon={FiRefreshCw} className="w-3 h-3" />
              <span>Use Current</span>
            </button>
          </div>
        </div>
      )}

      {/* Permission Info */}
      {availableUsers.length === 1 && availableUsers[0].id === currentUser.id && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Trading Permissions:</strong> You can only trade for your own account.
          </p>
        </div>
      )}

      {/* Transaction Type Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setTransactionType('BUY')}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
              transactionType === 'BUY'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <SafeIcon icon={FiTrendingUp} className="w-4 h-4" />
            <span>BUY</span>
          </button>
          <button
            onClick={() => setTransactionType('SELL')}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
              transactionType === 'SELL'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <SafeIcon icon={FiTrendingDown} className="w-4 h-4" />
            <span>SELL</span>
          </button>
        </div>
      </motion.div>

      {/* Trading Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User and Bank Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Account *
              </label>
              <select
                value={formData.selectedUser}
                onChange={(e) => handleInputChange('selectedUser', e.target.value)}
                className={`select-field ${validationErrors.selectedUser ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select user account</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name} ({RoleManager.getRole(user.role)?.name})
                  </option>
                ))}
              </select>
              {validationErrors.selectedUser && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.selectedUser}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Bank Account *
              </label>
              <select
                value={formData.userBank}
                onChange={(e) => handleInputChange('userBank', e.target.value)}
                className={`select-field ${validationErrors.userBank ? 'border-red-500' : ''}`}
                required
                disabled={!formData.selectedUser}
              >
                <option value="">Select bank account</option>
                {selectedUserBanks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank} - ₱{(selectedUserBankBalances[bank] || 0).toFixed(2)}
                  </option>
                ))}
              </select>
              {validationErrors.userBank && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.userBank}</p>
              )}
              {formData.userBank && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Available: ₱{availableBalance.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Rate and Last Rates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rate (PHP per USDT) *
            </label>
            <input
              type="number"
              step="0.0001"
              value={formData.rate}
              onChange={(e) => handleRateChange(e.target.value)}
              className={`input-field ${validationErrors.rate ? 'border-red-500' : ''}`}
              placeholder="Enter exchange rate"
              required
            />
            {validationErrors.rate && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.rate}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Last Buy: ₱{lastRates.buy.toFixed(4)}</span>
              <span>Last Sell: ₱{lastRates.sell.toFixed(4)}</span>
              <span>Current: ₱{exchangeRateInfo?.rate.toFixed(4) || '0.0000'}</span>
            </div>
          </div>

          {/* Amount Fields with Auto-calculation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                USDT Amount *
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.usdtAmount}
                onChange={(e) => handleUSDTChange(e.target.value)}
                className={`input-field ${validationErrors.usdtAmount ? 'border-red-500' : ''}`}
                placeholder="Enter USDT amount"
                required
              />
              {validationErrors.usdtAmount && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.usdtAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PHP Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.phpAmount}
                onChange={(e) => handlePHPChange(e.target.value)}
                className={`input-field ${validationErrors.phpAmount ? 'border-red-500' : ''}`}
                placeholder="Enter PHP amount"
                required
              />
              {validationErrors.phpAmount && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.phpAmount}</p>
              )}
            </div>
          </div>

          {/* Platform and Fee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trading Platform *
              </label>
              <select
                value={formData.platform}
                onChange={(e) => handleInputChange('platform', e.target.value)}
                className={`select-field ${validationErrors.platform ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select platform</option>
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
              {validationErrors.platform && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.platform}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transfer Fee (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.transferFee}
                onChange={(e) => handleInputChange('transferFee', e.target.value)}
                className="input-field"
                placeholder="Enter fee amount"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction Note
            </label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              className="input-field"
              placeholder="Optional transaction description"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting || isCalculating}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center space-x-2 ${
                transactionType === 'BUY'
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
              } disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <SafeIcon icon={FiSend} className="w-4 h-4" />
                  <span>Execute {transactionType}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Calculation Preview */}
      {(formData.usdtAmount && formData.phpAmount && formData.rate) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-4 bg-blue-50 dark:bg-blue-900/20"
        >
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">USDT Amount</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {parseFloat(formData.usdtAmount).toFixed(6)} USDT
              </p>
            </div>
            <SafeIcon icon={FiDollarSign} className="text-gray-400" />
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">PHP Amount</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                ₱{parseFloat(formData.phpAmount).toFixed(2)}
              </p>
            </div>
            <SafeIcon icon={FiDollarSign} className="text-gray-400" />
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Rate</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                ₱{parseFloat(formData.rate).toFixed(4)}/USDT
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && confirmationData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm {confirmationData.type} Transaction
                </h2>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SafeIcon icon={FiAlertTriangle} className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">User:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{confirmationData.user}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Bank:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{confirmationData.userBank}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Platform:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{confirmationData.platform}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Rate:</p>
                    <p className="font-medium text-gray-900 dark:text-white">₱{confirmationData.rate.toFixed(4)}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-400">USDT Amount:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{confirmationData.usdtAmount.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-400">PHP Amount:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₱{confirmationData.phpAmount.toFixed(2)}</span>
                  </div>
                  {confirmationData.fee > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Fee:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">₱{confirmationData.fee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-gray-600 dark:text-gray-400">Balance Impact:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{confirmationData.impact}</span>
                  </div>
                </div>

                {confirmationData.note && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Note:</p>
                    <p className="text-gray-900 dark:text-white text-sm">{confirmationData.note}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeTransaction}
                    disabled={isSubmitting}
                    className={`btn-primary flex items-center space-x-2 ${
                      confirmationData.type === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <SafeIcon icon={FiCheck} className="w-4 h-4" />
                        <span>Confirm {confirmationData.type}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Trade;