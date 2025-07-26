import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import RoleBadge from '../common/RoleBadge';
import { RoleManager } from '../../services/RoleManager';
import { AppStateManager } from '../../services/AppStateManager';

const { FiUsers, FiShield, FiCheck, FiX, FiInfo, FiEdit3 } = FiIcons;

const RoleManagement = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleChangeReason, setRoleChangeReason] = useState('');

  useEffect(() => {
    loadUsers();
    const unsubscribe = AppStateManager.subscribe(loadUsers);
    return unsubscribe;
  }, []);

  const loadUsers = () => {
    const allUsers = AppStateManager.getUsers();
    setUsers(allUsers);
  };

  const roles = RoleManager.getAllRoles();
  const manageableRoles = RoleManager.getManageableRoles(currentUser.role);
  const permissionGroups = RoleManager.getPermissionGroups();
  const roleHierarchy = RoleManager.getRoleHierarchy();

  const handleRoleChange = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleChangeReason('');
    setShowRoleModal(true);
  };

  const submitRoleChange = () => {
    if (!roleChangeReason.trim()) {
      alert('Please provide a reason for the role change');
      return;
    }

    const validation = RoleManager.validateRoleAssignment(currentUser.role, newRole);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const oldRole = selectedUser.role;
    AppStateManager.updateUser(selectedUser.id, { role: newRole });
    
    // Log the role change
    AppStateManager.addSystemLog({
      type: 'ROLE_CHANGE',
      user: currentUser.name,
      target_id: `user_${selectedUser.id}`,
      reason: roleChangeReason,
      old_value: oldRole,
      new_value: newRole
    });

    setShowRoleModal(false);
    setSelectedUser(null);
    alert('Role changed successfully');
  };

  const canManageUser = (user) => {
    return RoleManager.canManageRole(currentUser.role, user.role) && user.id !== currentUser.id;
  };

  return (
    <div className="space-y-6">
      {/* Role Hierarchy Overview */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Role Hierarchy
          </h3>
          <SafeIcon icon={FiShield} className="w-6 h-6 text-blue-600" />
        </div>
        
        <div className="space-y-4">
          {roleHierarchy.map((role, index) => (
            <div key={role.key} className="relative">
              {index > 0 && (
                <div className="absolute left-6 -top-2 w-0.5 h-4 bg-gray-300 dark:bg-gray-600"></div>
              )}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {role.level}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <RoleBadge role={role.key} size="md" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Level {role.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {role.description}
                  </p>
                  <div className="mt-2">
                    <details className="text-xs text-gray-500 dark:text-gray-400">
                      <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                        View Permissions ({role.permissions.length})
                      </summary>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-1">
                        {role.permissions.map(permission => (
                          <span key={permission} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            {permission.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Permission Matrix
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                  Permission Group
                </th>
                {Object.keys(roles).map(roleKey => (
                  <th key={roleKey} className="text-center py-3 px-2 min-w-24">
                    <RoleBadge role={roleKey} size="xs" showTooltip={false} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                <React.Fragment key={groupName}>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={Object.keys(roles).length + 1} className="py-2 px-4 font-medium text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {groupName.replace('_', ' ')}
                    </td>
                  </tr>
                  {permissions.map(permission => (
                    <tr key={permission} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {permission.replace('_', ' ')}
                      </td>
                      {Object.keys(roles).map(roleKey => (
                        <td key={roleKey} className="text-center py-2 px-2">
                          {RoleManager.hasPermission(roleKey, permission) ? (
                            <SafeIcon icon={FiCheck} className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            <SafeIcon icon={FiX} className="w-4 h-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Role Management */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Role Management
          </h3>
          <SafeIcon icon={FiUsers} className="w-6 h-6 text-indigo-600" />
        </div>

        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiUsers} className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <RoleBadge role={user.role} />
                
                {canManageUser(user) && (
                  <button
                    onClick={() => handleRoleChange(user)}
                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Change role"
                  >
                    <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                  </button>
                )}
                
                {user.id === currentUser.id && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    You
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Change User Role
              </h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiInfo} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    User Information
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Name:</strong> {selectedUser.name}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Current Role:</strong>
                  </span>
                  <RoleBadge role={selectedUser.role} size="sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="select-field"
                >
                  <option value={selectedUser.role}>Keep Current Role</option>
                  {Object.entries(manageableRoles).map(([roleKey, role]) => (
                    <option key={roleKey} value={roleKey}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Change *
                </label>
                <textarea
                  value={roleChangeReason}
                  onChange={(e) => setRoleChangeReason(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Please provide a reason for changing this user's role"
                  required
                />
              </div>

              {newRole !== selectedUser.role && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiInfo} className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Role Change Impact
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Changing this user's role will immediately affect their access permissions. 
                    They may need to log out and back in for all changes to take effect.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRoleChange}
                  disabled={!roleChangeReason.trim() || newRole === selectedUser.role}
                  className="btn-primary"
                >
                  Change Role
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;