import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { RoleManager } from '../../services/RoleManager';
import { ExchangeRateService } from '../../services/ExchangeRateService';
import { NotificationService } from '../../services/NotificationService';

const { FiDollarSign, FiTrendingUp, FiTrendingDown, FiSend } = FiIcons;

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

  useEffect(() => {
    loadData();
    loadMemorySettings();
    const unsubscribe = AppStateManager.subscribe(loadData);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Set current exchange rate as default
    const rate = ExchangeRateService.getCurrentRate();
    if (rate.rate && !formData.rate) {
      setFormData(prev => ({ ...prev, rate: rate.rate.toFixed(2) }));
    }
  }, []);

  useEffect(() => {
    // Update available banks when user changes
    if (formData.selectedUser) {
      const user = users.find(u => u.name === formData.selectedUser);
      if (user) {
        setFormData(prev => ({ ...prev, userBank: '' }));
      }
    }
  }, [formData.selectedUser, users]);

  useEffect(() => {
    // Load remembered user/bank pair when transaction type changes
    loadMemoryForType(transactionType);
  }, [transactionType]);

  const loadData = () => {
    const allUsers = AppStateManager.getUsers();
    const allPlatforms = AppStateManager.getPlatforms();
    const allBanks = AppStateManager.getBanks();
    const transactions = AppStateManager.getTransactions();

    setUsers(allUsers);
    setPlatforms(allPlatforms);
    setBanks(allBanks);

    // Calculate last buy/sell rates
    const buyTransactions = transactions.filter(t => t.type === 'BUY');
    const sellTransactions = transactions.filter(t => t.type === 'SELL');
    const lastBuy = buyTransactions.length > 0 ? buyTransactions[0].rate : 0;
    const lastSell = sellTransactions.length > 0 ? sellTransactions[0].rate : 0;

    setLastRates({ buy: lastBuy, sell: lastSell });
  };

  const loadMemorySettings = () => {
    const savedMemory = localStorage.getItem(`coinmate-trade-memory-${currentUser.id}`);
    if (savedMemory) {
      try {
        const memory = JSON.parse(savedMemory);
        // Check if memory is still valid (within 24 hours)
        const now = new Date();
        const memoryTime = new Date(memory.timestamp || 0);
        const hoursDiff = (now - memoryTime) / (1000 * 60 * 60);

        if (hoursDiff <= 24) {
          // Memory is still valid, load for current type
          loadMemoryForType(transactionType, memory);
        } else {
          // Memory expired, clear it
          localStorage.removeItem(`coinmate-trade-memory-${currentUser.id}`);
        }
      } catch (error) {
        console.error('Error loading trade memory:', error);
      }
    }
  };

  const loadMemoryForType = (type, memory = null) => {
    if (!memory) {
      const savedMemory = localStorage.getItem(`coinmate-trade-memory-${currentUser.id}`);
      if (savedMemory) {
        try {
          memory = JSON.parse(savedMemory);
        } catch (error) {
          return;
        }
      } else {
        return;
      }
    }

    const typeKey = type.toLowerCase();
    if (memory[typeKey]) {
      setFormData(prev => ({
        ...prev,
        selectedUser: memory[typeKey].selectedUser || '',
        userBank: memory[typeKey].userBank || ''
      }));
    }
  };

  const saveMemorySettings = () => {
    if (!formData.selectedUser || !formData.userBank) return;

    const savedMemory = localStorage.getItem(`coinmate-trade-memory-${currentUser.id}`);
    let memory = {};

    if (savedMemory) {
      try {
        memory = JSON.parse(savedMemory);
      } catch (error) {
        memory = {};
      }
    }

    const typeKey = transactionType.toLowerCase();
    memory[typeKey] = {
      selectedUser: formData.selectedUser,
      userBank: formData.userBank
    };
    memory.timestamp = new Date().toISOString();

    localStorage.setItem(`coinmate-trade-memory-${currentUser.id}`, JSON.stringify(memory));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUSDTBlur = () => {
    if (isCalculating || !formData.usdtAmount || !formData.rate) return;

    setIsCalculating(true);
    const usdtAmount = parseFloat(formData.usdtAmount);
    const rate = parseFloat(formData.rate);

    if (!isNaN(usdtAmount) && !isNaN(rate)) {
      const phpAmount = (usdtAmount * rate).toFixed(2);
      setFormData(prev => ({ ...prev, phpAmount }));
    }

    setTimeout(() => setIsCalculating(false), 100);
  };

  const handlePHPBlur = () => {
    if (isCalculating || !formData.phpAmount || !formData.rate) return;

    setIsCalculating(true);
    const phpAmount = parseFloat(formData.phpAmount);
    const rate = parseFloat(formData.rate);

    if (!isNaN(phpAmount) && !isNaN(rate) && rate > 0) {
      const usdtAmount = (phpAmount / rate).toFixed(2);
      setFormData(prev => ({ ...prev, usdtAmount }));
    }

    setTimeout(() => setIsCalculating(false), 100);
  };

  const getAvailableUsers = () => {
    const featureFlags = RoleManager.getFeatureFlags(currentUser.role);
    
    if (featureFlags.canTradeForOthers) {
      // Can trade for all users or assigned users
      if (RoleManager.hasPermission(currentUser.role, 'trade_all_users')) {
        return users; // All users
      } else if (RoleManager.hasPermission(currentUser.role, 'trade_assigned_users')) {
        // For now, return all users. In a real app, you'd filter by assigned users
        return users;
      }
    }
    
    // Can only trade for own account
    return users.filter(u => u.id === currentUser.id);
  };

  const getSelectedUserBanks = () => {
    if (!formData.selectedUser) return [];
    const user = users.find(u => u.name === formData.selectedUser);
    return user ? user.assignedBanks || [] : [];
  };

  const validateForm = () => {
    const required = ['selectedUser', 'rate', 'usdtAmount', 'phpAmount', 'userBank', 'platform'];
    return required.every(field => formData[field] && formData[field].toString().trim() !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    // Check permissions
    const selectedUser = users.find(u => u.name === formData.selectedUser);
    if (selectedUser.id !== currentUser.id) {
      const featureFlags = RoleManager.getFeatureFlags(currentUser.role);
      if (!featureFlags.canTradeForOthers) {
        alert('You do not have permission to trade for other users');
        return;
      }
    }

    setIsSubmitting(true);

    try {
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

      const newTransaction = AppStateManager.addTransaction(transaction);

      // Save memory settings
      saveMemorySettings();

      // Send notification
      await NotificationService.notifyTransaction(newTransaction);

      // Reset form (but keep rate)
      setFormData({
        selectedUser: '',
        rate: ExchangeRateService.getCurrentRate().rate.toFixed(2),
        usdtAmount: '',
        phpAmount: '',
        userBank: '',
        platform: '',
        transferFee: '',
        note: ''
      });

      alert(`${transactionType} transaction completed successfully!`);
    } catch (error) {
      console.error('Error submitting transaction:', error);
      alert('Error submitting transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableUsers = getAvailableUsers();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Trading Interface
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Execute buy/sell transactions with real-time calculations
        </p>
      </div>

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
          {/* User and Bank Selection - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Account *
              </label>
              <select
                value={formData.selectedUser}
                onChange={(e) => handleInputChange('selectedUser', e.target.value)}
                className="select-field"
                required
              >
                <option value="">Select user account</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name} ({RoleManager.getRole(user.role)?.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Bank Account *
              </label>
              <select
                value={formData.userBank}
                onChange={(e) => handleInputChange('userBank', e.target.value)}
                className="select-field"
                required
                disabled={!formData.selectedUser}
              >
                <option value="">Select bank account</option>
                {getSelectedUserBanks().map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rate and Last Rates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rate (PHP per USDT) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={(e) => handleInputChange('rate', e.target.value)}
              className="input-field"
              placeholder="Enter exchange rate"
              required
            />
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Last Buy: ₱{lastRates.buy.toFixed(2)}</span>
              <span>Last Sell: ₱{lastRates.sell.toFixed(2)}</span>
            </div>
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                USDT Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.usdtAmount}
                onChange={(e) => handleInputChange('usdtAmount', e.target.value)}
                onBlur={handleUSDTBlur}
                className="input-field"
                placeholder="Enter USDT amount"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PHP Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.phpAmount}
                onChange={(e) => handleInputChange('phpAmount', e.target.value)}
                onBlur={handlePHPBlur}
                className="input-field"
                placeholder="Enter PHP amount"
                required
              />
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
                className="select-field"
                required
              >
                <option value="">Select platform</option>
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
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
              Note
            </label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              className="input-field"
              placeholder="Transaction description"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting || !validateForm()}
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

      {/* Calculation Info */}
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
                {parseFloat(formData.usdtAmount).toFixed(2)} USDT
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
                ₱{parseFloat(formData.rate).toFixed(2)}/USDT
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Trade;