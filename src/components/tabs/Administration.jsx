import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { AppStateManager } from '../../services/AppStateManager';
import { RoleManager } from '../../services/RoleManager';
import { toastManager } from '../common/Toast';
import WhiteLabelingSettings from './WhiteLabelingSettings';

const { FiUsers, FiDatabase, FiPlus, FiTrash2, FiEdit3, FiX, FiSave, FiCheck, FiDollarSign, FiGlobe } = FiIcons;

const Administration = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'analyst', assignedBanks: [] });
  const [newPlatform, setNewPlatform] = useState('');
  const [newBank, setNewBank] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
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
  const [showDeletePlatformModal, setShowDeletePlatformModal] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState(null);
  const [showDeleteBankModal, setShowDeleteBankModal] = useState(false);
  const [bankToDelete, setBankToDelete] = useState(null);

  useEffect(() => {
    loadData();
    const unsubscribe = AppStateManager.subscribe(loadData);

    // Listen for custom events to set the active tab
    const handleSetAdminTab = (event) => {
      if (event.detail && typeof event.detail === 'string') {
        setActiveTab(event.detail);
      }
    };
    document.addEventListener('set-admin-tab', handleSetAdminTab);

    // Check if the URL hash contains a tab reference
    const hash = window.location.hash;
    if (hash.includes('#admin:')) {
      const tab = hash.split(':')[1];
      if (tab) {
        setActiveTab(tab);
      }
    }

    return () => {
      unsubscribe();
      document.removeEventListener('set-admin-tab', handleSetAdminTab);
    };
  }, []);

  const loadData = () => {
    const allUsers = AppStateManager.getUsers();
    const allPlatforms = AppStateManager.getPlatforms();
    const allBanks = AppStateManager.getBanks();
    const balances = AppStateManager.getBalances();

    setUsers(allUsers);

    // Add balances to platforms data
    const platformsWithBalance = allPlatforms.map(platform => ({
      name: platform,
      balance: balances.companyUSDT[platform] || 0
    }));

    setPlatforms(platformsWithBalance);
    setBanks(allBanks);
  };

  const featureFlags = RoleManager.getFeatureFlags(currentUser.role);
  const manageableRoles = RoleManager.getManageableRoles(currentUser.role);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      toastManager.error('Please fill in all required fields');
      return;
    }

    // Validate role assignment
    const validation = RoleManager.validateRoleAssignment(currentUser.role, newUser.role);
    if (!validation.valid) {
      toastManager.error(validation.error);
      return;
    }

    try {
      await AppStateManager.addUser(newUser);
      setNewUser({ name: '', email: '', role: 'analyst', assignedBanks: [] });
      setShowAddUserModal(false);
      toastManager.success('User added successfully');
    } catch (error) {
      toastManager.error('Failed to add user');
    }
  };

  const handleAddPlatform = async () => {
    if (!newPlatform.trim()) return;

    // Check for duplicate platform
    if (platforms.some(p => p.name.toLowerCase() === newPlatform.toLowerCase())) {
      toastManager.error(`Platform "${newPlatform}" already exists`);
      return;
    }

    try {
      await AppStateManager.addPlatform(newPlatform);
      setNewPlatform('');
      setHasChanges(true);
      toastManager.success('Platform added successfully');
    } catch (error) {
      toastManager.error('Failed to add platform');
    }
  };

  const handleAddBank = async () => {
    if (!newBank.trim()) return;

    // Check for duplicate bank
    if (banks.some(b => b.toLowerCase() === newBank.toLowerCase())) {
      toastManager.error(`Bank "${newBank}" already exists`);
      return;
    }

    try {
      await AppStateManager.addBank(newBank);
      setNewBank('');
      setHasChanges(true);
      toastManager.success('Bank added successfully');
    } catch (error) {
      toastManager.error('Failed to add bank');
    }
  };

  const handleDeletePlatform = (platform) => {
    setPlatformToDelete(platform);
    setShowDeletePlatformModal(true);
  };

  const confirmDeletePlatform = async () => {
    if (!platformToDelete) return;

    try {
      await AppStateManager.deletePlatform(platformToDelete.name);
      toastManager.success(`Platform "${platformToDelete.name}" deleted successfully`);
      setShowDeletePlatformModal(false);
      setPlatformToDelete(null);
    } catch (error) {
      toastManager.error(`Failed to delete platform: ${error.message}`);
    }
  };

  const handleDeleteBank = (bank) => {
    setBankToDelete(bank);
    setShowDeleteBankModal(true);
  };

  const confirmDeleteBank = async () => {
    if (!bankToDelete) return;

    try {
      await AppStateManager.deleteBank(bankToDelete);
      toastManager.success(`Bank "${bankToDelete}" deleted successfully`);
      setShowDeleteBankModal(false);
      setBankToDelete(null);
    } catch (error) {
      toastManager.error(`Failed to delete bank: ${error.message}`);
    }
  };

  const handleEditUser = (userId) => {
    setEditingUserId(userId);
  };

  const handleSaveUser = async (user) => {
    // Validate role change if role was modified
    const originalUser = users.find(u => u.id === user.id);
    if (originalUser.role !== user.role) {
      const validation = RoleManager.validateRoleAssignment(currentUser.role, user.role);
      if (!validation.valid) {
        toastManager.error(validation.error);
        return;
      }
    }

    try {
      await AppStateManager.updateUser(user.id, user);
      setEditingUserId(null);
      setHasChanges(true);
      toastManager.success('User updated successfully');
    } catch (error) {
      toastManager.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!RoleManager.canManageRole(currentUser.role, user.role)) {
      toastManager.error('You cannot delete this user due to insufficient permissions');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await AppStateManager.deleteUser(userId);
        setHasChanges(true);
        toastManager.success('User deleted successfully');
      } catch (error) {
        toastManager.error('Failed to delete user');
      }
    }
  };

  const openAdjustBalanceModal = (user, bank) => {
    const currentBalance = user.bank_balances[bank] || 0;
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

  const handleAdjustBalance = async () => {
    const { userId, bank, newBalance, reason } = balanceAdjustment;

    if (!reason.trim()) {
      toastManager.error('Please provide a reason for the adjustment');
      return;
    }

    try {
      await AppStateManager.adjustUserBalance(
        userId,
        bank,
        parseFloat(newBalance),
        reason,
        currentUser.name
      );
      setShowAdjustBalanceModal(false);
      setHasChanges(true);
      toastManager.success('Balance adjusted successfully');
    } catch (error) {
      toastManager.error('Failed to adjust balance');
    }
  };

  const openUsdtAdjustModal = (platform) => {
    const balances = AppStateManager.getBalances();
    const currentBalance = balances.companyUSDT[platform.name] || 0;
    setUsdtAdjustment({
      platform: platform.name,
      currentBalance,
      newBalance: currentBalance,
      reason: ''
    });
    setShowUsdtAdjustModal(true);
  };

  const handleAdjustUSDT = async () => {
    const { platform, newBalance, reason } = usdtAdjustment;

    if (!reason.trim()) {
      toastManager.error('Please provide a reason for the adjustment');
      return;
    }

    try {
      await AppStateManager.adjustCompanyUSDTBalance(
        platform,
        parseFloat(newBalance),
        reason,
        currentUser.name
      );
      setShowUsdtAdjustModal(false);
      setHasChanges(true);
      toastManager.success('USDT balance adjusted successfully');
    } catch (error) {
      toastManager.error('Failed to adjust USDT balance');
    }
  };

  const handleAssignBank = async (userId, bank) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentlyAssigned = user.assigned_banks?.includes(bank) || false;

    // Check if user can unassign this bank (only if balance is 0)
    if (currentlyAssigned) {
      const balance = user.bank_balances?.[bank] || 0;
      if (balance !== 0) {
        toastManager.error('Bank balance is not 0. Please adjust balance first.');
        return;
      }
    }

    let updatedBanks = [...(user.assigned_banks || [])];
    if (currentlyAssigned) {
      // Remove bank
      updatedBanks = updatedBanks.filter(b => b !== bank);
    } else {
      // Add bank
      updatedBanks.push(bank);
    }

    try {
      await AppStateManager.updateUser(userId, { assignedBanks: updatedBanks });
      setHasChanges(true);
      toastManager.success(`Bank ${currentlyAssigned ? 'unassigned' : 'assigned'} successfully`);
    } catch (error) {
      toastManager.error('Failed to update bank assignment');
    }
  };

  // User Management Tab
  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          User Management
        </h3>
        {featureFlags.canEditUsers && (
          <button
            onClick={() => setShowAddUserModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4" />
            <span>Add User</span>
          </button>
        )}
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
                      onChange={(e) =>
                        setUsers(
                          users.map(u =>
                            u.id === user.id ? { ...u, name: e.target.value } : u
                          )
                        )
                      }
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
                      onChange={(e) =>
                        setUsers(
                          users.map(u =>
                            u.id === user.id ? { ...u, email: e.target.value } : u
                          )
                        )
                      }
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
                    onChange={(e) =>
                      setUsers(
                        users.map(u =>
                          u.id === user.id ? { ...u, role: e.target.value } : u
                        )
                      )
                    }
                    className="select-field"
                  >
                    <option value={user.role}>Keep Current: {RoleManager.getRole(user.role)?.name}</option>
                    {Object.entries(manageableRoles).map(([roleKey, role]) => (
                      <option key={roleKey} value={roleKey}>
                        {role.name}
                      </option>
                    ))}
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
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${RoleManager.getRoleBadge(user.role).color}`}>
                        {RoleManager.getRoleBadge(user.role).label}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {featureFlags.canEditUsers && RoleManager.canManageRole(currentUser.role, user.role) && (
                      <button
                        onClick={() => handleEditUser(user.id)}
                        className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit user"
                      >
                        <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                      </button>
                    )}
                    {featureFlags.canDeleteUsers && RoleManager.canManageRole(currentUser.role, user.role) && user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete user"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assigned Banks
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {banks.map((bank) => {
                      const isAssigned = user.assigned_banks?.includes(bank) || false;
                      const balance = user.bank_balances?.[bank] || 0;
                      const canUnassign = balance === 0;

                      return (
                        <button
                          key={bank}
                          onClick={() => handleAssignBank(user.id, bank)}
                          className={`py-1 px-3 rounded-full text-xs transition-colors ${
                            isAssigned
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          } ${isAssigned && !canUnassign ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!featureFlags.canEditUsers || (isAssigned && !canUnassign)}
                          title={isAssigned && !canUnassign ? 'Bank balance is not 0. Please adjust balance first.' : ''}
                        >
                          {bank}
                          {isAssigned && (
                            <SafeIcon icon={FiCheck} className="inline w-3 h-3 ml-1" />
                          )}
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
                    {user.assigned_banks?.map((bank) => (
                      <div key={bank} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span>{bank}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            ₱{(user.bank_balances?.[bank] || 0).toFixed(2)}
                          </span>
                          {featureFlags.canAdjustBalances && (
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

        {featureFlags.canManagePlatforms && (
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
              />
              <button
                onClick={handleAddPlatform}
                className="btn-primary flex items-center space-x-2"
                disabled={!newPlatform.trim()}
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )}

        <div className="card p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Existing Platforms
          </h4>
          <div className="space-y-2">
            {platforms.map((platform) => (
              <div key={platform.name} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <span className="font-medium">{platform.name}</span>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Balance: {platform.balance.toFixed(2)} USDT
                  </div>
                </div>
                <div className="flex space-x-2">
                  {featureFlags.canAdjustBalances && (
                    <button
                      onClick={() => openUsdtAdjustModal(platform)}
                      className="btn-secondary text-sm"
                    >
                      Adjust Balance
                    </button>
                  )}
                  {featureFlags.canManagePlatforms && platform.balance === 0 && (
                    <button
                      onClick={() => handleDeletePlatform(platform)}
                      className="btn-danger text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
            {platforms.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">No platforms found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Bank Management
        </h3>

        {featureFlags.canManageBanks && (
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
              />
              <button
                onClick={handleAddBank}
                className="btn-primary flex items-center space-x-2"
                disabled={!newBank.trim()}
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )}

        <div className="card p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Existing Banks
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {banks.map((bank) => {
              // Check if any user has a non-zero balance for this bank
              const isInUse = users.some(user => (user.bank_balances?.[bank] || 0) > 0);

              return (
                <div key={bank} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center">
                  <span>{bank}</span>
                  {featureFlags.canManageBanks && !isInUse && (
                    <button
                      onClick={() => handleDeleteBank(bank)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                      title="Delete bank"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
            {banks.length === 0 && (
              <div className="col-span-3 text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">No banks found</p>
              </div>
            )}
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

          {(featureFlags.canManagePlatforms || featureFlags.canManageBanks) && (
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
          )}

          <button
            onClick={() => setActiveTab('organization')}
            className={`py-3 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'organization'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <SafeIcon icon={FiGlobe} className="w-4 h-4 mr-2" />
              <span>Organization Settings</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'platforms' && renderPlatformsTab()}
        {activeTab === 'organization' && <WhiteLabelingSettings currentUser={currentUser} />}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={() => setShowAddUserModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
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
                    {Object.entries(manageableRoles).map(([roleKey, role]) => (
                      <option key={roleKey} value={roleKey}>
                        {role.name}
                      </option>
                    ))}
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
                          className={`py-1 px-3 rounded-full text-xs transition-colors ${
                            isAssigned
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {bank}
                          {isAssigned && (
                            <SafeIcon icon={FiCheck} className="inline w-3 h-3 ml-1" />
                          )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={() => setShowAdjustBalanceModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
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
                      onChange={(e) => setBalanceAdjustment({ ...balanceAdjustment, newBalance: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setBalanceAdjustment({ ...balanceAdjustment, reason: e.target.value })}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={() => setShowUsdtAdjustModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
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
                      onChange={(e) => setUsdtAdjustment({ ...usdtAdjustment, newBalance: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setUsdtAdjustment({ ...usdtAdjustment, reason: e.target.value })}
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

      {/* Delete Platform Modal */}
      <AnimatePresence>
        {showDeletePlatformModal && platformToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={() => setShowDeletePlatformModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Delete Platform
                </h2>
                <button
                  onClick={() => setShowDeletePlatformModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Platform:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{platformToDelete.name}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-700 dark:text-gray-300">Current USDT Balance:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{platformToDelete.balance.toFixed(2)} USDT</span>
                  </div>
                </div>
                {platformToDelete.balance > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      <strong>Cannot delete:</strong> Platform has non-zero USDT balance. Please adjust balance to zero first.
                    </p>
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowDeletePlatformModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeletePlatform}
                    className="btn-danger"
                    disabled={platformToDelete.balance > 0}
                  >
                    Delete Platform
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Bank Modal */}
      <AnimatePresence>
        {showDeleteBankModal && bankToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={() => setShowDeleteBankModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Delete Bank
                </h2>
                <button
                  onClick={() => setShowDeleteBankModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Bank:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{bankToDelete}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-700 dark:text-gray-300">Status:</span>
                    <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                      Safe to delete (no active balances)
                    </span>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowDeleteBankModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteBank}
                    className="btn-danger"
                  >
                    Delete Bank
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