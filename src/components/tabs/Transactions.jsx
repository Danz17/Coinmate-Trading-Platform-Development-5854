import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '@/components/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { ExportService } from '../../services/ExportService';
import { format } from 'date-fns';

const { 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiEdit3, 
  FiTrash2, 
  FiArrowRightCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiX,
  FiSave
} = FiIcons;

const Transactions = ({ currentUser }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showInternalTransfer, setShowInternalTransfer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editReason, setEditReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);
  const [internalTransferData, setInternalTransferData] = useState({
    type: 'PHP', // 'PHP' or 'USDT'
    fromUser: '',
    fromBank: '',
    toUser: '',
    toBank: '',
    fromPlatform: '',
    toPlatform: '',
    amount: '',
    note: ''
  });

  useEffect(() => {
    loadData();
    const unsubscribe = AppStateManager.subscribe(loadData);
    return unsubscribe;
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, filterType, dateRange]);

  const loadData = () => {
    const allTransactions = AppStateManager.getTransactions();
    const logs = AppStateManager.getSystemLogs();
    setTransactions(allTransactions);
    setSystemLogs(logs);
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.platform && t.platform.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.bank && t.bank.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (filterType !== 'ALL') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(t => 
        new Date(t.timestamp) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => 
        new Date(t.timestamp) <= new Date(dateRange.end + 'T23:59:59')
      );
    }

    setFilteredTransactions(filtered);
  };

  const canEditDelete = () => {
    return ['super_admin', 'admin', 'supervisor'].includes(currentUser?.role);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction({ ...transaction });
    setEditReason('');
    setShowEditModal(true);
  };

  const handleDelete = (transaction) => {
    setDeletingTransaction(transaction);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const submitEdit = () => {
    if (!editReason.trim()) {
      alert('Please provide a reason for editing this transaction');
      return;
    }

    AppStateManager.updateTransaction(
      editingTransaction.id,
      editingTransaction,
      editReason,
      currentUser.name
    );

    setShowEditModal(false);
    setEditingTransaction(null);
    setEditReason('');
  };

  const submitDelete = () => {
    if (!deleteReason.trim()) {
      alert('Please provide a reason for deleting this transaction');
      return;
    }

    AppStateManager.deleteTransaction(
      deletingTransaction.id,
      deleteReason,
      currentUser.name
    );

    setShowDeleteModal(false);
    setDeletingTransaction(null);
    setDeleteReason('');
  };

  const handleInternalTransfer = () => {
    const { type, amount, note } = internalTransferData;

    if (!amount || !note) {
      alert('Please fill in all required fields');
      return;
    }

    if (type === 'PHP') {
      if (!internalTransferData.fromUser || !internalTransferData.fromBank || 
          !internalTransferData.toUser || !internalTransferData.toBank) {
        alert('Please select from and to bank accounts');
        return;
      }

      // Create PHP internal transfer transaction
      const transaction = {
        type: 'INTERNAL_TRANSFER',
        user_id: currentUser.id,
        user_name: currentUser.name,
        usdtAmount: 0,
        phpAmount: parseFloat(amount),
        platform: null,
        bank: `${internalTransferData.fromBank} → ${internalTransferData.toBank}`,
        rate: 0,
        fee: 0,
        note: `PHP Transfer: ${internalTransferData.fromUser} (${internalTransferData.fromBank}) → ${internalTransferData.toUser} (${internalTransferData.toBank}) - ${note}`
      };

      AppStateManager.addTransaction(transaction);

      // Update user balances
      const users = AppStateManager.getUsers();
      const fromUser = users.find(u => u.name === internalTransferData.fromUser);
      const toUser = users.find(u => u.name === internalTransferData.toUser);

      if (fromUser && toUser) {
        AppStateManager.adjustUserBalance(
          fromUser.id,
          internalTransferData.fromBank,
          (fromUser.bankBalances[internalTransferData.fromBank] || 0) - parseFloat(amount),
          `Internal transfer to ${internalTransferData.toUser}`,
          currentUser.name
        );

        AppStateManager.adjustUserBalance(
          toUser.id,
          internalTransferData.toBank,
          (toUser.bankBalances[internalTransferData.toBank] || 0) + parseFloat(amount),
          `Internal transfer from ${internalTransferData.fromUser}`,
          currentUser.name
        );
      }
    } else {
      // USDT platform transfer
      if (!internalTransferData.fromPlatform || !internalTransferData.toPlatform) {
        alert('Please select from and to platforms');
        return;
      }

      const transaction = {
        type: 'INTERNAL_TRANSFER',
        user_id: currentUser.id,
        user_name: currentUser.name,
        usdtAmount: parseFloat(amount),
        phpAmount: 0,
        platform: `${internalTransferData.fromPlatform} → ${internalTransferData.toPlatform}`,
        bank: null,
        rate: 0,
        fee: 0,
        note: `USDT Transfer: ${internalTransferData.fromPlatform} → ${internalTransferData.toPlatform} - ${note}`
      };

      AppStateManager.addTransaction(transaction);

      // Update platform balances
      const balances = AppStateManager.getBalances();
      AppStateManager.adjustCompanyUSDTBalance(
        internalTransferData.fromPlatform,
        (balances.companyUSDT[internalTransferData.fromPlatform] || 0) - parseFloat(amount),
        `Internal transfer to ${internalTransferData.toPlatform}`,
        currentUser.name
      );

      AppStateManager.adjustCompanyUSDTBalance(
        internalTransferData.toPlatform,
        (balances.companyUSDT[internalTransferData.toPlatform] || 0) + parseFloat(amount),
        `Internal transfer from ${internalTransferData.fromPlatform}`,
        currentUser.name
      );
    }

    // Reset form
    setInternalTransferData({
      type: 'PHP',
      fromUser: '',
      fromBank: '',
      toUser: '',
      toBank: '',
      fromPlatform: '',
      toPlatform: '',
      amount: '',
      note: ''
    });
    setShowInternalTransfer(false);
  };

  const exportToCSV = () => {
    const exportData = filteredTransactions.map(t => ({
      Date: format(new Date(t.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      Type: t.type,
      User: t.user_name,
      'USDT Amount': t.usdtAmount,
      'PHP Amount': t.phpAmount,
      Rate: t.rate,
      Platform: t.platform || '',
      Bank: t.bank || '',
      Fee: t.fee,
      Note: t.note,
      Status: t.status
    }));

    ExportService.exportToCSV(exportData, 'transactions.csv');
  };

  const exportToPDF = () => {
    ExportService.exportTransactionsToPDF(filteredTransactions, 'Transaction Report');
  };

  const users = AppStateManager.getUsers();
  const platforms = AppStateManager.getPlatforms();
  const banks = AppStateManager.getBanks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor all trading activities
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowLogsModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
            <span>Logs</span>
          </button>
          
          <button
            onClick={() => setShowInternalTransfer(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <SafeIcon icon={FiArrowRightCircle} className="w-4 h-4" />
            <span>Internal Transfer</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <SafeIcon 
              icon={FiSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" 
            />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-field"
          >
            <option value="ALL">All Types</option>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
            <option value="INTERNAL_TRANSFER">Internal Transfer</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="input-field"
            placeholder="Start date"
          />

          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="input-field"
            placeholder="End date"
          />
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-3 mt-4">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center space-x-2"
          >
            <SafeIcon icon={FiDownload} className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={exportToPDF}
            className="btn-secondary flex items-center space-x-2"
          >
            <SafeIcon icon={FiDownload} className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>Date/Time</th>
                <th>Type</th>
                <th>User</th>
                <th>USDT</th>
                <th>PHP</th>
                <th>Rate</th>
                <th>Platform/Bank</th>
                <th>Note</th>
                <th>Status</th>
                {canEditDelete() && <th>Actions</th>}
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredTransactions.map((transaction) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="text-sm">
                    {format(new Date(transaction.timestamp), 'MM/dd/yyyy HH:mm')}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <SafeIcon 
                        icon={transaction.type === 'BUY' ? FiTrendingUp : 
                              transaction.type === 'SELL' ? FiTrendingDown : FiArrowRightCircle} 
                        className={`w-4 h-4 ${
                          transaction.type === 'BUY' ? 'text-green-600' :
                          transaction.type === 'SELL' ? 'text-red-600' : 'text-blue-600'
                        }`} 
                      />
                      <span className={`font-medium ${
                        transaction.type === 'BUY' ? 'text-green-600' :
                        transaction.type === 'SELL' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {transaction.type === 'INTERNAL_TRANSFER' ? 'TRANSFER' : transaction.type}
                      </span>
                    </div>
                  </td>
                  <td className="font-medium">{transaction.user_name}</td>
                  <td>{transaction.usdtAmount.toFixed(2)}</td>
                  <td>₱{transaction.phpAmount.toFixed(2)}</td>
                  <td>{transaction.rate > 0 ? `₱${transaction.rate.toFixed(2)}` : '-'}</td>
                  <td>
                    <div className="text-sm">
                      {transaction.platform && <div>{transaction.platform}</div>}
                      {transaction.bank && <div className="text-gray-500">{transaction.bank}</div>}
                    </div>
                  </td>
                  <td className="max-w-xs truncate" title={transaction.note}>
                    {transaction.note}
                  </td>
                  <td>
                    <span className={`status-badge ${
                      transaction.status === 'completed' ? 'status-completed' : 'status-pending'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  {canEditDelete() && (
                    <td>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit transaction"
                        >
                          <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete transaction"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No transactions found matching your criteria
          </div>
        )}
      </div>

      {/* Internal Transfer Modal */}
      <AnimatePresence>
        {showInternalTransfer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Internal Transfer
                </h2>
                <button
                  onClick={() => setShowInternalTransfer(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Transfer Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transfer Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="transferType"
                        value="PHP"
                        checked={internalTransferData.type === 'PHP'}
                        onChange={(e) => setInternalTransferData(prev => ({ ...prev, type: e.target.value }))}
                        className="mr-2"
                      />
                      PHP (Bank to Bank)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="transferType"
                        value="USDT"
                        checked={internalTransferData.type === 'USDT'}
                        onChange={(e) => setInternalTransferData(prev => ({ ...prev, type: e.target.value }))}
                        className="mr-2"
                      />
                      USDT (Platform to Platform)
                    </label>
                  </div>
                </div>

                {internalTransferData.type === 'PHP' ? (
                  <>
                    {/* PHP Transfer Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          From User
                        </label>
                        <select
                          value={internalTransferData.fromUser}
                          onChange={(e) => setInternalTransferData(prev => ({ ...prev, fromUser: e.target.value, fromBank: '' }))}
                          className="select-field"
                        >
                          <option value="">Select user</option>
                          {users.map(user => (
                            <option key={user.id} value={user.name}>{user.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          From Bank
                        </label>
                        <select
                          value={internalTransferData.fromBank}
                          onChange={(e) => setInternalTransferData(prev => ({ ...prev, fromBank: e.target.value }))}
                          className="select-field"
                          disabled={!internalTransferData.fromUser}
                        >
                          <option value="">Select bank</option>
                          {internalTransferData.fromUser && 
                            users.find(u => u.name === internalTransferData.fromUser)?.assignedBanks?.map(bank => (
                              <option key={bank} value={bank}>{bank}</option>
                            ))
                          }
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          To User
                        </label>
                        <select
                          value={internalTransferData.toUser}
                          onChange={(e) => setInternalTransferData(prev => ({ ...prev, toUser: e.target.value, toBank: '' }))}
                          className="select-field"
                        >
                          <option value="">Select user</option>
                          {users.map(user => (
                            <option key={user.id} value={user.name}>{user.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          To Bank
                        </label>
                        <select
                          value={internalTransferData.toBank}
                          onChange={(e) => setInternalTransferData(prev => ({ ...prev, toBank: e.target.value }))}
                          className="select-field"
                          disabled={!internalTransferData.toUser}
                        >
                          <option value="">Select bank</option>
                          {internalTransferData.toUser && 
                            users.find(u => u.name === internalTransferData.toUser)?.assignedBanks?.map(bank => (
                              <option key={bank} value={bank}>{bank}</option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* USDT Transfer Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          From Platform
                        </label>
                        <select
                          value={internalTransferData.fromPlatform}
                          onChange={(e) => setInternalTransferData(prev => ({ ...prev, fromPlatform: e.target.value }))}
                          className="select-field"
                        >
                          <option value="">Select platform</option>
                          {platforms.map(platform => (
                            <option key={platform} value={platform}>{platform}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          To Platform
                        </label>
                        <select
                          value={internalTransferData.toPlatform}
                          onChange={(e) => setInternalTransferData(prev => ({ ...prev, toPlatform: e.target.value }))}
                          className="select-field"
                        >
                          <option value="">Select platform</option>
                          {platforms.map(platform => (
                            <option key={platform} value={platform}>{platform}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Amount and Note */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={internalTransferData.amount}
                      onChange={(e) => setInternalTransferData(prev => ({ ...prev, amount: e.target.value }))}
                      className="input-field"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Note
                    </label>
                    <input
                      type="text"
                      value={internalTransferData.note}
                      onChange={(e) => setInternalTransferData(prev => ({ ...prev, note: e.target.value }))}
                      className="input-field"
                      placeholder="Transfer description"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowInternalTransfer(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInternalTransfer}
                    className="btn-primary"
                  >
                    Execute Transfer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {showEditModal && editingTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit Transaction
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      USDT Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingTransaction.usdtAmount}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, usdtAmount: parseFloat(e.target.value) || 0 }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PHP Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingTransaction.phpAmount}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, phpAmount: parseFloat(e.target.value) || 0 }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingTransaction.rate}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fee
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingTransaction.fee}
                      onChange={(e) => setEditingTransaction(prev => ({ ...prev, fee: parseFloat(e.target.value) || 0 }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note
                  </label>
                  <input
                    type="text"
                    value={editingTransaction.note}
                    onChange={(e) => setEditingTransaction(prev => ({ ...prev, note: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Edit *
                  </label>
                  <textarea
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="input-field"
                    rows={3}
                    placeholder="Please provide a reason for editing this transaction"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitEdit}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <SafeIcon icon={FiSave} className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Transaction Modal */}
      <AnimatePresence>
        {showDeleteModal && deletingTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Delete Transaction
                </h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </p>

                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {deletingTransaction.type} • {deletingTransaction.user_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {deletingTransaction.usdtAmount} USDT • ₱{deletingTransaction.phpAmount.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Deletion *
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="input-field"
                    rows={3}
                    placeholder="Please provide a reason for deleting this transaction"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitDelete}
                    className="btn-danger flex items-center space-x-2"
                  >
                    <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* System Logs Modal */}
      <AnimatePresence>
        {showLogsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  System Logs
                </h2>
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-3">
                  {systemLogs.length > 0 ? (
                    systemLogs.map((log) => (
                      <div key={log.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {log.type.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(log.timestamp), 'MM/dd/yyyy HH:mm:ss')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>User:</strong> {log.user}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Reason:</strong> {log.reason}
                        </p>
                        {log.old_value && (
                          <details className="text-xs text-gray-500 dark:text-gray-400">
                            <summary className="cursor-pointer">View Details</summary>
                            <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                              <p><strong>Old Value:</strong> {JSON.stringify(log.old_value, null, 2)}</p>
                              {log.new_value && <p><strong>New Value:</strong> {JSON.stringify(log.new_value, null, 2)}</p>}
                            </div>
                          </details>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No system logs found
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transactions;