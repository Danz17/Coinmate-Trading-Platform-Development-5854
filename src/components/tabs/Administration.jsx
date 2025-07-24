import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { NotificationService } from '../../services/NotificationService';
import { ExchangeRateService } from '../../services/ExchangeRateService';

const { 
  FiUsers, 
  FiDatabase, 
  FiSettings, 
  FiPlus, 
  FiTrash2, 
  FiEdit3, 
  FiX, 
  FiSave, 
  FiCheck,
  FiDollarSign
} = FiIcons;

const Administration = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [balances, setBalances] = useState({});
  const [config, setConfig] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'analyst',
    assignedBanks: []
  });
  const [newPlatform, setNewPlatform] = useState('');
  const [newBank, setNewBank] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false);
  const [balanceAdjustment, setBalanceAdjustment] = useState({
    userId: null,
    userName: '',
    bank: '',
    currentBalance: 0,
    newBalance: 0,
    reason: ''
  });
  const [usdtAdjustment, setUsdtAdjustment] = useState({
    platform: '',
    currentBalance: 0,
    newBalance: 0,
    reason: ''
  });
  const [showUsdtAdjustModal, setShowUsdtAdjustModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  useEffect(() => {
    loadData();
    const unsubscribe = AppStateManager.subscribe(loadData);
    return unsubscribe;
  }, []);

  const loadData = () => {
    const allUsers = AppStateManager.getUsers();
    const allPlatforms = AppStateManager.getPlatforms();
    const allBanks = AppStateManager.getBanks();
    const allBalances = AppStateManager.getBalances();
    const appConfig = AppStateManager.getConfig();
    
    setUsers(allUsers);
    setPlatforms(allPlatforms);
    setBanks(allBanks);
    setBalances(allBalances);
    setConfig(appConfig);
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      alert('Please fill in all required fields');
      return;
    }
    
    AppStateManager.addUser(newUser);
    setNewUser({
      name: '',
      email: '',
      role: 'analyst',
      assignedBanks: []
    });
    setShowAddUserModal(false);
  };

  const handleAddPlatform = () => {
    if (!newPlatform.trim()) return;
    
    AppStateManager.addPlatform(newPlatform);
    setNewPlatform('');
    setHasChanges(true);
  };

  const handleAddBank = () => {
    if (!newBank.trim()) return;
    
    AppStateManager.addBank(newBank);
    setNewBank('');
    setHasChanges(true);
  };

  const handleEditUser = (userId) => {
    setEditingUserId(userId);
  };

  const handleSaveUser = (user) => {
    AppStateManager.updateUser(user.id, user);
    setEditingUserId(null);
    setHasChanges(true);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      AppStateManager.deleteUser(userId);
      setHasChanges(true);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig({
      ...config,
      [key]: value
    });
    setHasChanges(true);
  };

  const handleSaveConfig = () => {
    AppStateManager.updateConfig(config);
    NotificationService.updateConfig(config);
    ExchangeRateService.setUpdateInterval(config.exchangeRateUpdateInterval);
    setHasChanges(false);
    alert('Configuration saved successfully!');
  };

  const openAdjustBalanceModal = (user, bank) => {
    const currentBalance = user.bankBalances[bank] || 0;
    
    setBalanceAdjustment({
      userId: user.id,
      userName: user.name,
      bank,
      currentBalance,
      newBalance: currentBalance,
      reason: ''
    });
    
    setShowAdjustBalanceModal(true);
  };

  const handleAdjustBalance = () => {
    const { userId, bank, newBalance, reason } = balanceAdjustment;
    
    if (!reason.trim()) {
      alert('Please provide a reason for the adjustment');
      return;
    }
    
    AppStateManager.adjustUserBalance(
      userId,
      bank,
      parseFloat(newBalance),
      reason,
      currentUser.name
    );
    
    setShowAdjustBalanceModal(false);
    setHasChanges(true);
  };

  const openUsdtAdjustModal = (platform) => {
    const currentBalance = balances.companyUSDT[platform] || 0;
    
    setUsdtAdjustment({
      platform,
      currentBalance,
      newBalance: currentBalance,
      reason: ''
    });
    
    setShowUsdtAdjustModal(true);
  };

  const handleAdjustUSDT = () => {
    const { platform, newBalance, reason } = usdtAdjustment;
    
    if (!reason.trim()) {
      alert('Please provide a reason for the adjustment');
      return;
    }
    
    AppStateManager.adjustCompanyUSDTBalance(
      platform,
      parseFloat(newBalance),
      reason,
      currentUser.name
    );
    
    setShowUsdtAdjustModal(false);
    setHasChanges(true);
  };

  const handleAssignBank = (userId, bank, isAssigned) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    let updatedBanks = [...(user.assignedBanks || [])];
    
    if (isAssigned) {
      // Add bank if not already assigned
      if (!updatedBanks.includes(bank)) {
        updatedBanks.push(bank);
      }
    } else {
      // Remove bank
      updatedBanks = updatedBanks.filter(b => b !== bank);
    }
    
    AppStateManager.updateUser(userId, { assignedBanks: updatedBanks });
    setHasChanges(true);
  };

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  // User Management Tab
  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          User Management
        </h3>
        <button 
          onClick={() => setShowAddUserModal(true)} 
          className="btn-primary flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {users.map((user) => (
          <div 
            key={user.id} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            {editingUserId === user.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => setUsers(users.map(u => 
                        u.id === user.id ? { ...u, name: e.target.value } : u
                      ))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      onChange={(e) => setUsers(users.map(u => 
                        u.id === user.id ? { ...u, email: e.target.value } : u
                      ))}
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={user.role}
                    onChange={(e) => setUsers(users.map(u => 
                      u.id === user.id ? { ...u, role: e.target.value } : u
                    ))}
                    className="select-field"
                    disabled={!isSuperAdmin && user.role === 'super_admin'}
                  >
                    <option value="analyst">Analyst</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setEditingUserId(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveUser(user)}
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 py-1 px-2 rounded-full text-xs capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditUser(user.id)}
                      className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      disabled={!isAdmin || (user.role === 'super_admin' && !isSuperAdmin)}
                      title="Edit user"
                    >
                      <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      disabled={!isAdmin || (user.role === 'super_admin' && !isSuperAdmin) || user.id === currentUser.id}
                      title="Delete user"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assigned Banks
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {banks.map((bank) => {
                      const isAssigned = user.assignedBanks?.includes(bank);
                      return (
                        <button
                          key={bank}
                          onClick={() => handleAssignBank(user.id, bank, !isAssigned)}
                          className={`py-1 px-3 rounded-full text-xs ${
                            isAssigned 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                          disabled={!isAdmin}
                        >
                          {bank} {isAssigned && <SafeIcon icon={FiCheck} className="inline w-3 h-3 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bank Balances
                  </h5>
                  <div className="space-y-2">
                    {user.assignedBanks?.map((bank) => (
                      <div key={bank} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span>{bank}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">₱{(user.bankBalances?.[bank] || 0).toFixed(2)}</span>
                          {isAdmin && (
                            <button
                              onClick={() => openAdjustBalanceModal(user, bank)}
                              className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Adjust balance"
                            >
                              <SafeIcon icon={FiEdit3} className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Platform Management Tab
  const renderPlatformsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Platform Management
        </h3>
        
        {/* Add Platform */}
        <div className="card p-4 mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Add New Platform
          </h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              className="input-field"
              placeholder="Platform name"
              disabled={!isAdmin}
            />
            <button
              onClick={handleAddPlatform}
              className="btn-primary flex items-center space-x-2"
              disabled={!isAdmin || !newPlatform.trim()}
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
        
        {/* Platform List */}
        <div className="card p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Existing Platforms
          </h4>
          <div className="space-y-2">
            {platforms.map((platform) => (
              <div 
                key={platform} 
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="font-medium">{platform}</span>
                {isAdmin && (
                  <button
                    onClick={() => openUsdtAdjustModal(platform)}
                    className="btn-secondary text-sm"
                  >
                    Adjust Balance
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Bank Management
        </h3>
        
        {/* Add Bank */}
        <div className="card p-4 mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Add New Bank
          </h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newBank}
              onChange={(e) => setNewBank(e.target.value)}
              className="input-field"
              placeholder="Bank name"
              disabled={!isAdmin}
            />
            <button
              onClick={handleAddBank}
              className="btn-primary flex items-center space-x-2"
              disabled={!isAdmin || !newBank.trim()}
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
        
        {/* Bank List */}
        <div className="card p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Existing Banks
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {banks.map((bank) => (
              <div 
                key={bank} 
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
              >
                {bank}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Balance Management Tab
  const renderBalancesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Company USDT Holdings
        </h3>
        
        <div className="card p-4">
          <div className="space-y-3">
            {platforms.map((platform) => {
              const balance = balances.companyUSDT[platform] || 0;
              return (
                <div 
                  key={platform} 
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{platform}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      Platform
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold">
                      {balance.toFixed(2)} USDT
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => openUsdtAdjustModal(platform)}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Adjust balance"
                      >
                        <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="font-medium">Total USDT Holdings</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {Object.values(balances.companyUSDT || {}).reduce((sum, amount) => sum + amount, 0).toFixed(2)} USDT
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User PHP Balances
        </h3>
        
        <div className="space-y-4">
          {users.map((user) => {
            const hasBalances = user.bankBalances && Object.keys(user.bankBalances).length > 0;
            if (!hasBalances) return null;
            
            return (
              <div key={user.id} className="card p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  {user.name}
                </h4>
                <div className="space-y-2">
                  {user.assignedBanks?.map((bank) => {
                    const balance = user.bankBalances[bank] || 0;
                    return (
                      <div 
                        key={bank} 
                        className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <span>{bank}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">₱{balance.toFixed(2)}</span>
                          {isAdmin && (
                            <button
                              onClick={() => openAdjustBalanceModal(user, bank)}
                              className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Adjust balance"
                            >
                              <SafeIcon icon={FiEdit3} className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      ₱{Object.values(user.bankBalances || {}).reduce((sum, amount) => sum + amount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // System Settings Tab
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex justify-between items-center">
          <span>System Settings</span>
          <button
            onClick={handleSaveConfig}
            className={`btn-primary flex items-center space-x-2 ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!hasChanges}
          >
            <SafeIcon icon={FiSave} className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </h3>
        
        <div className="card p-6">
          <div className="space-y-6">
            {/* Database Configuration */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Database Configuration
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supabase URL
                  </label>
                  <input
                    type="text"
                    value={config.supabaseUrl || ''}
                    onChange={(e) => handleConfigChange('supabaseUrl', e.target.value)}
                    className="input-field"
                    placeholder="https://your-project.supabase.co"
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supabase API Key
                  </label>
                  <input
                    type="text"
                    value={config.supabaseKey || ''}
                    onChange={(e) => handleConfigChange('supabaseKey', e.target.value)}
                    className="input-field"
                    placeholder="your-supabase-anon-key"
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </div>
            
            {/* External APIs */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                External APIs
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CoinGecko API Key
                  </label>
                  <input
                    type="text"
                    value={config.coinGeckoApiKey || ''}
                    onChange={(e) => handleConfigChange('coinGeckoApiKey', e.target.value)}
                    className="input-field"
                    placeholder="Optional"
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telegram Bot Token
                  </label>
                  <input
                    type="text"
                    value={config.telegramBotToken || ''}
                    onChange={(e) => handleConfigChange('telegramBotToken', e.target.value)}
                    className="input-field"
                    placeholder="Bot token from BotFather"
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telegram Chat ID
                  </label>
                  <input
                    type="text"
                    value={config.telegramChatId || ''}
                    onChange={(e) => handleConfigChange('telegramChatId', e.target.value)}
                    className="input-field"
                    placeholder="Chat ID for notifications"
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </div>
            
            {/* System Intervals */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                System Intervals
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exchange Rate Update Interval (ms)
                  </label>
                  <input
                    type="number"
                    min="60000"
                    max="3600000"
                    step="60000"
                    value={config.exchangeRateUpdateInterval || 300000}
                    onChange={(e) => handleConfigChange('exchangeRateUpdateInterval', parseInt(e.target.value))}
                    className="input-field"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1 minute = 60,000 ms, 5 minutes = 300,000 ms
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dashboard Refresh Interval (ms)
                  </label>
                  <input
                    type="number"
                    min="5000"
                    max="300000"
                    step="1000"
                    value={config.dashboardRefreshInterval || 10000}
                    onChange={(e) => handleConfigChange('dashboardRefreshInterval', parseInt(e.target.value))}
                    className="input-field"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    5 seconds = 5,000 ms, 1 minute = 60,000 ms
                  </p>
                </div>
              </div>
            </div>
            
            {/* Security Settings */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Security Settings
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notificationsEnabled"
                    checked={config.notificationsEnabled || false}
                    onChange={(e) => handleConfigChange('notificationsEnabled', e.target.checked)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    disabled={!isAdmin}
                  />
                  <label htmlFor="notificationsEnabled" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                    Enable Telegram Notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requireMFAForAdmin"
                    checked={config.requireMFAForAdmin || false}
                    onChange={(e) => handleConfigChange('requireMFAForAdmin', e.target.checked)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    disabled={!isAdmin}
                  />
                  <label htmlFor="requireMFAForAdmin" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                    Require MFA for Admin Actions
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="logAllActions"
                    checked={config.logAllActions || false}
                    onChange={(e) => handleConfigChange('logAllActions', e.target.checked)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    disabled={!isAdmin}
                  />
                  <label htmlFor="logAllActions" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                    Log All User Actions
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Administration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          System configuration and management
        </p>
      </div>

      {/* Admin Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <SafeIcon icon={FiUsers} className="w-4 h-4 mr-2" />
              <span>User Management</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('platforms')}
            className={`py-3 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'platforms'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <SafeIcon icon={FiDatabase} className="w-4 h-4 mr-2" />
              <span>Platform & Bank Management</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('balances')}
            className={`py-3 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'balances'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <SafeIcon icon={FiDollarSign} className="w-4 h-4 mr-2" />
              <span>Balance Management</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <SafeIcon icon={FiSettings} className="w-4 h-4 mr-2" />
              <span>System Settings</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'platforms' && renderPlatformsTab()}
        {activeTab === 'balances' && renderBalancesTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add New User
                </h2>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="input-field"
                    placeholder="Full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="input-field"
                    placeholder="Email address"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="select-field"
                  >
                    <option value="analyst">Analyst</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign Banks
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {banks.map((bank) => {
                      const isAssigned = newUser.assignedBanks?.includes(bank);
                      return (
                        <button
                          key={bank}
                          onClick={() => {
                            const updatedBanks = isAssigned
                              ? newUser.assignedBanks.filter(b => b !== bank)
                              : [...(newUser.assignedBanks || []), bank];
                            setNewUser({ ...newUser, assignedBanks: updatedBanks });
                          }}
                          className={`py-1 px-3 rounded-full text-xs ${
                            isAssigned 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {bank} {isAssigned && <SafeIcon icon={FiCheck} className="inline w-3 h-3 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="btn-primary"
                    disabled={!newUser.name || !newUser.email}
                  >
                    Add User
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Balance Adjustment Modal */}
      <AnimatePresence>
        {showAdjustBalanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Adjust Balance
                </h2>
                <button
                  onClick={() => setShowAdjustBalanceModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User
                  </label>
                  <input
                    type="text"
                    value={balanceAdjustment.userName}
                    className="input-field"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bank
                  </label>
                  <input
                    type="text"
                    value={balanceAdjustment.bank}
                    className="input-field"
                    disabled
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Balance
                    </label>
                    <input
                      type="text"
                      value={`₱${balanceAdjustment.currentBalance.toFixed(2)}`}
                      className="input-field"
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Balance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={balanceAdjustment.newBalance}
                      onChange={(e) => setBalanceAdjustment({
                        ...balanceAdjustment,
                        newBalance: parseFloat(e.target.value) || 0
                      })}
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason *
                  </label>
                  <textarea
                    value={balanceAdjustment.reason}
                    onChange={(e) => setBalanceAdjustment({
                      ...balanceAdjustment,
                      reason: e.target.value
                    })}
                    className="input-field"
                    rows={3}
                    placeholder="Provide a reason for this balance adjustment"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAdjustBalanceModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdjustBalance}
                    className="btn-primary"
                    disabled={!balanceAdjustment.reason}
                  >
                    Adjust Balance
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* USDT Adjustment Modal */}
      <AnimatePresence>
        {showUsdtAdjustModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Adjust USDT Balance
                </h2>
                <button
                  onClick={() => setShowUsdtAdjustModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Platform
                  </label>
                  <input
                    type="text"
                    value={usdtAdjustment.platform}
                    className="input-field"
                    disabled
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Balance
                    </label>
                    <input
                      type="text"
                      value={`${usdtAdjustment.currentBalance.toFixed(2)} USDT`}
                      className="input-field"
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Balance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={usdtAdjustment.newBalance}
                      onChange={(e) => setUsdtAdjustment({
                        ...usdtAdjustment,
                        newBalance: parseFloat(e.target.value) || 0
                      })}
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason *
                  </label>
                  <textarea
                    value={usdtAdjustment.reason}
                    onChange={(e) => setUsdtAdjustment({
                      ...usdtAdjustment,
                      reason: e.target.value
                    })}
                    className="input-field"
                    rows={3}
                    placeholder="Provide a reason for this balance adjustment"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowUsdtAdjustModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdjustUSDT}
                    className="btn-primary"
                    disabled={!usdtAdjustment.reason}
                  >
                    Adjust USDT Balance
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

export default Administration;