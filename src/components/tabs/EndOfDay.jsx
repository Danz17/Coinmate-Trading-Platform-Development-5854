import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { NotificationService } from '../../services/NotificationService';
import { ExportService } from '../../services/ExportService';
import { format } from 'date-fns';

const { 
  FiDollarSign, 
  FiUsers, 
  FiCheck, 
  FiCalendar, 
  FiX, 
  FiUpload, 
  FiSend 
} = FiIcons;

const EndOfDay = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  useEffect(() => {
    loadData();
    const unsubscribe = AppStateManager.subscribe(loadData);
    return unsubscribe;
  }, []);

  const loadData = () => {
    const allUsers = AppStateManager.getUsers();
    const transactions = AppStateManager.getTransactionsByPeriod('today');
    
    setUsers(allUsers);
    setTodayTransactions(transactions);
    
    // Calculate profit per user
    const userProfits = calculateUserProfits(allUsers, transactions);
    setProfitData(userProfits);
  };

  const calculateUserProfits = (users, transactions) => {
    const profits = [];
    
    users.forEach(user => {
      const userTransactions = transactions.filter(t => t.user_id === user.id);
      const buyTransactions = userTransactions.filter(t => t.type === 'BUY');
      const sellTransactions = userTransactions.filter(t => t.type === 'SELL');
      
      const totalBuyPHP = buyTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
      const totalBuyUSDT = buyTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
      const totalSellPHP = sellTransactions.reduce((sum, t) => sum + t.phpAmount, 0);
      const totalSellUSDT = sellTransactions.reduce((sum, t) => sum + t.usdtAmount, 0);
      
      const avgBuyRate = totalBuyUSDT > 0 ? totalBuyPHP / totalBuyUSDT : 0;
      const avgSellRate = totalSellUSDT > 0 ? totalSellPHP / totalSellUSDT : 0;
      
      // Calculate profit based on the difference in rates and volume
      const minVolume = Math.min(totalBuyUSDT, totalSellUSDT);
      const profit = Math.max(0, (avgSellRate - avgBuyRate) * minVolume);
      
      // Only include users with transactions and available banks
      if ((buyTransactions.length > 0 || sellTransactions.length > 0) && 
          user.assignedBanks && user.assignedBanks.length > 0) {
        profits.push({
          user,
          profit,
          totalTransactions: userTransactions.length,
          banks: user.assignedBanks.map(bank => ({
            name: bank,
            balance: user.bankBalances[bank] || 0
          })),
          selectedBank: user.assignedBanks[0], // Default selected bank
          manualProfit: profit.toFixed(2) // Default to calculated profit
        });
      }
    });
    
    return profits;
  };

  const handleUserToggle = (userData) => {
    if (selectedUsers.some(u => u.user.id === userData.user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.user.id !== userData.user.id));
    } else {
      setSelectedUsers([...selectedUsers, userData]);
    }
  };

  const handleProfitChange = (userId, value) => {
    setSelectedUsers(selectedUsers.map(userData => {
      if (userData.user.id === userId) {
        return { ...userData, manualProfit: value };
      }
      return userData;
    }));
  };

  const handleBankChange = (userId, bank) => {
    setSelectedUsers(selectedUsers.map(userData => {
      if (userData.user.id === userId) {
        return { ...userData, selectedBank: bank };
      }
      return userData;
    }));
  };

  const handleExecuteEOD = () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user for profit collection');
      return;
    }
    
    // Prepare confirmation data
    const totalProfit = selectedUsers.reduce(
      (sum, userData) => sum + parseFloat(userData.manualProfit), 0
    );
    
    const confirmData = {
      users: selectedUsers.map(userData => ({
        name: userData.user.name,
        profit: parseFloat(userData.manualProfit),
        bank: userData.selectedBank
      })),
      totalProfit,
      date: format(new Date(), 'MMMM dd, yyyy')
    };
    
    setConfirmationData(confirmData);
    setShowConfirmation(true);
  };

  const executeEOD = async () => {
    setIsSubmitting(true);
    
    try {
      // Process each user's profit collection
      for (const userData of selectedUsers) {
        const { user, manualProfit, selectedBank } = userData;
        const profit = parseFloat(manualProfit);
        
        if (profit > 0 && selectedBank) {
          // Adjust user balance
          const currentBalance = user.bankBalances[selectedBank] || 0;
          AppStateManager.adjustUserBalance(
            user.id,
            selectedBank,
            currentBalance - profit,
            `EOD profit collection`,
            currentUser.name
          );
          
          // Create EOD transaction record
          AppStateManager.addTransaction({
            type: 'INTERNAL_TRANSFER',
            user_id: user.id,
            user_name: user.name,
            usdtAmount: 0,
            phpAmount: profit,
            platform: null,
            bank: selectedBank,
            rate: 0,
            fee: 0,
            note: `EOD Profit Collection - ${note || 'Regular EOD'}`
          });
        }
      }
      
      // Generate EOD report
      const report = {
        totalPHP: todayTransactions.reduce((sum, t) => sum + t.phpAmount, 0),
        totalUSDT: todayTransactions.reduce((sum, t) => sum + t.usdtAmount, 0),
        profit: selectedUsers.reduce((sum, u) => sum + parseFloat(u.manualProfit), 0),
        transactionCount: todayTransactions.length,
        transactions: todayTransactions
      };
      
      // Send notification
      await NotificationService.notifyEOD(report);
      
      // Export EOD report
      ExportService.exportEODReport(report);
      
      alert('End of Day process completed successfully!');
      setSelectedUsers([]);
      setNote('');
      setShowConfirmation(false);
      
    } catch (error) {
      console.error('Error executing EOD process:', error);
      alert('Error executing EOD process. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canExecuteEOD = () => {
    return ['super_admin', 'admin', 'supervisor'].includes(currentUser.role);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          End of Day
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Process daily profit collection and generate reports
        </p>
      </div>

      {/* Today's Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Today's Summary
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {todayTransactions.length}
              </p>
            </div>
            <SafeIcon icon={FiCalendar} className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">PHP Volume</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₱{todayTransactions.reduce((sum, t) => sum + t.phpAmount, 0).toFixed(2)}
              </p>
            </div>
            <SafeIcon icon={FiDollarSign} className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">USDT Volume</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {todayTransactions.reduce((sum, t) => sum + t.usdtAmount, 0).toFixed(2)} USDT
              </p>
            </div>
            <SafeIcon icon={FiDollarSign} className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </motion.div>

      {/* Profit Collection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profit Collection
          </h2>
          <SafeIcon icon={FiUsers} className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <div className="space-y-4">
          {profitData.length > 0 ? (
            <div className="space-y-4">
              {profitData.map((userData) => {
                const isSelected = selectedUsers.some(u => u.user.id === userData.user.id);
                const selectedUserData = selectedUsers.find(u => u.user.id === userData.user.id) || userData;
                
                return (
                  <div 
                    key={userData.user.id} 
                    className={`border rounded-lg p-4 transition-colors ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-primary-100 dark:bg-primary-900' : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <SafeIcon 
                            icon={isSelected ? FiCheck : FiUsers} 
                            className={`w-4 h-4 ${
                              isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
                            }`} 
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {userData.user.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {userData.totalTransactions} transactions today
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mr-3">
                          Calculated Profit: ₱{userData.profit.toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleUserToggle(userData)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            isSelected 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bank for Profit Collection
                          </label>
                          <select
                            value={selectedUserData.selectedBank}
                            onChange={(e) => handleBankChange(userData.user.id, e.target.value)}
                            className="select-field"
                          >
                            {userData.banks.map((bank) => (
                              <option key={bank.name} value={bank.name}>
                                {bank.name} - ₱{bank.balance.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Profit Amount (PHP)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={selectedUserData.manualProfit}
                            onChange={(e) => handleProfitChange(userData.user.id, e.target.value)}
                            className="input-field"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input-field"
                    rows={3}
                    placeholder="Add any notes or observations about today's EOD process"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleExecuteEOD}
                    disabled={!canExecuteEOD() || selectedUsers.length === 0 || isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="loading-spinner mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>Execute End of Day</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No users with transactions today
            </div>
          )}
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && confirmationData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm End of Day Process
                </h2>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Please review the profit collection for {confirmationData.date}:
                </p>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {confirmationData.users.map((user, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-green-600 dark:text-green-400">₱{user.profit.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Bank: {user.bank}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Profit Collected:</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      ₱{confirmationData.totalProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeEOD}
                    disabled={isSubmitting}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <SafeIcon icon={FiSend} className="w-4 h-4" />
                        <span>Confirm & Execute</span>
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

export default EndOfDay;