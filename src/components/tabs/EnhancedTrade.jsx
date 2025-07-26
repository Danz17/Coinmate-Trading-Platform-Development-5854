import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { RoleManager } from '../../services/RoleManager';
import { ExchangeRateService } from '../../services/ExchangeRateService';
import { ValidationService } from '../../services/ValidationService';
import { NotificationService } from '../../services/NotificationService';
import { toastManager } from '../common/Toast';

const { FiDollarSign, FiTrendingUp, FiTrendingDown, FiSend, FiCheck, FiAlertTriangle, FiRefreshCw, FiInfo, FiShield } = FiIcons;

const EnhancedTrade = ({ currentUser }) => {
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
  const [validationResult, setValidationResult] = useState({ isValid: true, errors: {}, warnings: [] });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [availableBalances, setAvailableBalances] = useState({});
  const [platformBalances, setPlatformBalances] = useState({});
  const [exchangeRateInfo, setExchangeRateInfo] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);

  useEffect(() => {
    loadData();
    const unsubscribe = AppStateManager.subscribe(loadData);
    return unsubscribe;
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
        setAvailableBalances(user.bank_balances || {});
        setFormData(prev => ({ ...prev, userBank: '' }));
      }
    }
  }, [formData.selectedUser, users]);

  useEffect(() => {
    validateForm();
  }, [formData, transactionType, availableBalances, platformBalances]);

  const loadData = () => {
    const allUsers = AppStateManager.getUsers();
    const allPlatforms = AppStateManager.getPlatforms();
    const allBanks = AppStateManager.getBanks();
    const balances = AppStateManager.getBalances();
    const transactions = AppStateManager.getTransactions();

    setUsers(allUsers);
    setPlatforms(allPlatforms);
    setBanks(allBanks);
    setPlatformBalances(balances.companyUSDT || {});

    // Load rate history for better rate suggestions
    const recentRates = transactions
      .filter(t => t.rate > 0)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(t => ({ rate: t.rate, type: t.type, timestamp: t.created_at }));
    
    setRateHistory(recentRates);
  };

  const validateForm = () => {
    const balanceInfo = {
      ...availableBalances,
      platformUSDT: platformBalances
    };

    const result = ValidationService.validateTrade(formData, transactionType, balanceInfo);
    setValidationResult(result);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUSDTChange = (value) => {
    handleInputChange('usdtAmount', value);
    if (value && formData.rate && !isCalculating) {
      setIsCalculating(true);
      setTimeout(() => {
        const usdtAmount = parseFloat(value);
        const rate = parseFloat(formData.rate);
        if (!isNaN(usdtAmount) && !isNaN(rate)) {
          const phpAmount = (usdtAmount * rate).toFixed(2);
          setFormData(prev => ({ ...prev, phpAmount }));
        }
        setIsCalculating(false);
      }, 300);
    }
  };

  const handlePHPChange = (value) => {
    handleInputChange('phpAmount', value);
    if (value && formData.rate && !isCalculating) {
      setIsCalculating(true);
      setTimeout(() => {
        const phpAmount = parseFloat(value);
        const rate = parseFloat(formData.rate);
        if (!isNaN(phpAmount) && !isNaN(rate) && rate > 0) {
          const usdtAmount = (phpAmount / rate).toFixed(6);
          setFormData(prev => ({ ...prev, usdtAmount }));
        }
        setIsCalculating(false);
      }, 300);
    }
  };

  const getAvailableUsers = () => {
    const featureFlags = RoleManager.getFeatureFlags(currentUser.role);
    if (featureFlags.canTradeForOthers) {
      return users;
    }
    return users.filter(u => u.id === currentUser.id);
  };

  const getSelectedUserBanks = () => {
    if (!formData.selectedUser) return [];
    const user = users.find(u => u.name === formData.selectedUser);
    return user ? user.assigned_banks || [] : [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validationResult.isValid) {
      toastManager.error('Please fix the validation errors before submitting');
      return;
    }

    // Show warnings if any
    if (validationResult.warnings.length > 0) {
      const warningMessages = validationResult.warnings.map(w => w.message).join('\n');
      if (!window.confirm(`Warning:\n${warningMessages}\n\nDo you want to continue?`)) {
        return;
      }
    }

    const selectedUser = users.find(u => u.name === formData.selectedUser);
    const bankBalance = availableBalances[formData.userBank] || 0;
    const platformBalance = platformBalances[formData.platform] || 0;

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
      currentBankBalance: bankBalance,
      currentPlatformBalance: platformBalance,
      balanceImpact: {
        bank: transactionType === 'SELL' 
          ? bankBalance - parseFloat(formData.phpAmount)
          : bankBalance + parseFloat(formData.phpAmount),
        platform: transactionType === 'BUY'
          ? platformBalance + parseFloat(formData.usdtAmount)
          : platformBalance - parseFloat(formData.usdtAmount)
      },
      rateDeviation: exchangeRateInfo ? 
        Math.abs((parseFloat(formData.rate) - exchangeRateInfo.rate) / exchangeRateInfo.rate * 100) : 0
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
        note: formData.note
      };

      const newTransaction = await AppStateManager.addTransaction(transaction);

      // Send notifications for large transactions
      if (transaction.phpAmount > 50000) {
        await NotificationService.notifyLargeTransaction(transaction);
      } else {
        await NotificationService.notifyTransaction(transaction);
      }

      // Check for balance alerts
      const newBankBalance = confirmationData.balanceImpact.bank;
      if (newBankBalance < 1000) {
        await NotificationService.notifyBalanceAlert(
          selectedUser.name, 
          formData.userBank, 
          newBankBalance
        );
      }

      // Reset form
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
      toastManager.error('Error submitting transaction. Please try again.');
      await NotificationService.notifySystemError(error, 'Transaction Submission');
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
          Enhanced Trading Interface
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Execute trades with advanced validation and real-time balance checks
        </p>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Available PHP</h3>
          <p className="text-2xl font-bold text-green-600">
            ₱{formData.userBank && availableBalances[formData.userBank] 
              ? availableBalances[formData.userBank].toLocaleString() 
              : '0.00'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.userBank || 'Select bank account'}
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Platform USDT</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formData.platform && platformBalances[formData.platform] 
              ? platformBalances[formData.platform].toFixed(2) 
              : '0.00'} USDT
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.platform || 'Select platform'}
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Current Rate</h3>
          <p className="text-2xl font-bold text-purple-600">
            ₱{exchangeRateInfo?.rate.toFixed(4) || '0.0000'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {exchangeRateInfo?.source} • {exchangeRateInfo?.lastUpdate ? 
              new Date(exchangeRateInfo.lastUpdate).toLocaleTimeString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Validation Alerts */}
      {!validationResult.isValid && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <SafeIcon icon={FiAlertTriangle} className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-800 dark:text-red-200">Validation Errors</h3>
          </div>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {Object.values(validationResult.errors).map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {validationResult.warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <SafeIcon icon={FiInfo} className="w-5 h-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Warnings</h3>
          </div>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            {validationResult.warnings.map((warning, index) => (
              <li key={index}>• {warning.message}</li>
            ))}
          </ul>
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
                className={`select-field ${validationResult.errors.selectedUser ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select user account</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name} ({RoleManager.getRole(user.role)?.name})
                  </option>
                ))}
              </select>
              {validationResult.errors.selectedUser && (
                <p className="text-red-500 text-sm mt-1">{validationResult.errors.selectedUser}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Bank Account *
              </label>
              <select
                value={formData.userBank}
                onChange={(e) => handleInputChange('userBank', e.target.value)}
                className={`select-field ${validationResult.errors.userBank ? 'border-red-500' : ''}`}
                required
                disabled={!formData.selectedUser}
              >
                <option value="">Select bank account</option>
                {selectedUserBanks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank} - ₱{(availableBalances[bank] || 0).toLocaleString()}
                  </option>
                ))}
              </select>
              {validationResult.errors.userBank && (
                <p className="text-red-500 text-sm mt-1">{validationResult.errors.userBank}</p>
              )}
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trading Platform *
            </label>
            <select
              value={formData.platform}
              onChange={(e) => handleInputChange('platform', e.target.value)}
              className={`select-field ${validationResult.errors.platform ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Select platform</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform} - {(platformBalances[platform] || 0).toFixed(2)} USDT
                </option>
              ))}
            </select>
            {validationResult.errors.platform && (
              <p className="text-red-500 text-sm mt-1">{validationResult.errors.platform}</p>
            )}
          </div>

          {/* Rate Input with History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rate (PHP per USDT) *
            </label>
            <input
              type="number"
              step="0.0001"
              value={formData.rate}
              onChange={(e) => handleInputChange('rate', e.target.value)}
              className={`input-field ${validationResult.errors.rate ? 'border-red-500' : ''}`}
              placeholder="Enter exchange rate"
              required
            />
            {validationResult.errors.rate && (
              <p className="text-red-500 text-sm mt-1">{validationResult.errors.rate}</p>
            )}
            
            {/* Rate History */}
            {rateHistory.length > 0 && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Recent rates: </span>
                {rateHistory.slice(0, 5).map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleInputChange('rate', r.rate.toFixed(4))}
                    className="mr-2 hover:text-blue-600 dark:hover:text-blue-400 underline"
                  >
                    ₱{r.rate.toFixed(4)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount Fields */}
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
                className={`input-field ${validationResult.errors.usdtAmount ? 'border-red-500' : ''}`}
                placeholder="Enter USDT amount"
                required
              />
              {validationResult.errors.usdtAmount && (
                <p className="text-red-500 text-sm mt-1">{validationResult.errors.usdtAmount}</p>
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
                className={`input-field ${validationResult.errors.phpAmount ? 'border-red-500' : ''}`}
                placeholder="Enter PHP amount"
                required
              />
              {validationResult.errors.phpAmount && (
                <p className="text-red-500 text-sm mt-1">{validationResult.errors.phpAmount}</p>
              )}
            </div>
          </div>

          {/* Fee and Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Note
              </label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                className="input-field"
                placeholder="Optional note"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting || !validationResult.isValid || isCalculating}
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

      {/* Enhanced Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && confirmationData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm {confirmationData.type} Transaction
                </h2>
                <SafeIcon icon={FiShield} className="w-6 h-6 text-blue-600" />
              </div>

              <div className="p-6 space-y-4">
                {/* Transaction Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">User:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{confirmationData.user}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Type:</p>
                    <p className={`font-medium ${confirmationData.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                      {confirmationData.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Platform:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{confirmationData.platform}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Bank:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{confirmationData.userBank}</p>
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-400">USDT Amount:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {confirmationData.usdtAmount.toFixed(6)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-400">PHP Amount:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₱{confirmationData.phpAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Rate:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₱{confirmationData.rate.toFixed(4)}/USDT
                    </span>
                  </div>
                  {confirmationData.fee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Fee:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₱{confirmationData.fee.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Balance Impact */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Balance Impact</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Bank Balance:</span>
                      <span className="text-blue-900 dark:text-blue-100">
                        ₱{confirmationData.currentBankBalance.toLocaleString()} → ₱{confirmationData.balanceImpact.bank.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Platform USDT:</span>
                      <span className="text-blue-900 dark:text-blue-100">
                        {confirmationData.currentPlatformBalance.toFixed(2)} → {confirmationData.balanceImpact.platform.toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rate Deviation Warning */}
                {confirmationData.rateDeviation > 2 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiAlertTriangle} className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Rate Deviation: {confirmationData.rateDeviation.toFixed(1)}% from market rate
                      </span>
                    </div>
                  </div>
                )}

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

export default EnhancedTrade;