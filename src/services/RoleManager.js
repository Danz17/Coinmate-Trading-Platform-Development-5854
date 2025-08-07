import { SupabaseService } from './SupabaseService';

class RoleManagerClass {
  constructor() {
    this.roles = [
      {
        id: 'super_admin',
        name: 'Super Admin',
        description: 'Full system access including white labeling and organization management',
        permissions: ['*'],
        color: 'red'
      },
      {
        id: 'admin',
        name: 'Admin',
        description: 'Administrative access to manage users and system settings',
        permissions: [
          'user.read',
          'user.create',
          'user.update',
          'user.delete',
          'transaction.read',
          'transaction.create',
          'transaction.update',
          'transaction.approve',
          'transaction.reject',
          'settings.read',
          'settings.update',
          'logs.read',
          'analytics.read',
          'analytics.export'
        ],
        color: 'purple'
      },
      {
        id: 'manager',
        name: 'Manager',
        description: 'Access to manage transactions and view reports',
        permissions: [
          'user.read',
          'transaction.read',
          'transaction.create',
          'transaction.update',
          'transaction.approve',
          'transaction.reject',
          'analytics.read'
        ],
        color: 'blue'
      },
      {
        id: 'analyst',
        name: 'Analyst',
        description: 'Access to view and analyze data',
        permissions: [
          'transaction.read',
          'analytics.read',
          'analytics.export'
        ],
        color: 'green'
      },
      {
        id: 'trader',
        name: 'Trader',
        description: 'Access to create and view transactions',
        permissions: [
          'transaction.read',
          'transaction.create'
        ],
        color: 'orange'
      },
      {
        id: 'user',
        name: 'User',
        description: 'Basic user access',
        permissions: [
          'transaction.read',
          'transaction.create'
        ],
        color: 'gray'
      }
    ];
    
    this.customRoles = [];
    this.isInitialized = false;
  }

  /**
   * Initialize role manager
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Load custom roles
      await this.loadCustomRoles();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing role manager:', error);
      return false;
    }
  }

  /**
   * Load custom roles from database
   */
  async loadCustomRoles() {
    try {
      const { data, error } = await SupabaseService.getCustomRoles();
      
      if (error) throw error;
      
      this.customRoles = data || [];
    } catch (error) {
      console.error('Error loading custom roles:', error);
      this.customRoles = [];
    }
  }

  /**
   * Get all roles
   * @returns {Array} - Array of roles
   */
  getAllRoles() {
    return [...this.roles, ...this.customRoles];
  }

  /**
   * Get role by ID
   * @param {string} roleId - Role ID
   * @returns {Object|null} - Role data
   */
  getRole(roleId) {
    const systemRole = this.roles.find(role => role.id === roleId);
    if (systemRole) return systemRole;
    
    const customRole = this.customRoles.find(role => role.id === roleId);
    return customRole || null;
  }

  /**
   * Get role name
   * @param {string} roleId - Role ID
   * @returns {string} - Role name
   */
  getRoleName(roleId) {
    const role = this.getRole(roleId);
    return role ? role.name : roleId;
  }

  /**
   * Get role color
   * @param {string} roleId - Role ID
   * @returns {string} - Role color
   */
  getRoleColor(roleId) {
    const role = this.getRole(roleId);
    return role ? role.color : 'gray';
  }

  /**
   * Create custom role
   * @param {Object} roleData - Role data
   * @returns {Promise<Object>} - New role data
   */
  async createCustomRole(roleData) {
    try {
      const { data, error } = await SupabaseService.createCustomRole(roleData);
      
      if (error) throw error;
      
      if (data) {
        this.customRoles.push(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating custom role:', error);
      throw error;
    }
  }

  /**
   * Update custom role
   * @param {string} roleId - Role ID
   * @param {Object} updates - Role updates
   * @returns {Promise<Object>} - Updated role
   */
  async updateCustomRole(roleId, updates) {
    try {
      const { data, error } = await SupabaseService.updateCustomRole(roleId, updates);
      
      if (error) throw error;
      
      if (data) {
        // Update in local cache
        const index = this.customRoles.findIndex(role => role.id === roleId);
        if (index !== -1) {
          this.customRoles[index] = data;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error updating custom role:', error);
      throw error;
    }
  }

  /**
   * Delete custom role
   * @param {string} roleId - Role ID
   * @returns {Promise<boolean>} - Whether deletion was successful
   */
  async deleteCustomRole(roleId) {
    try {
      const { error } = await SupabaseService.deleteCustomRole(roleId);
      
      if (error) throw error;
      
      // Remove from local cache
      this.customRoles = this.customRoles.filter(role => role.id !== roleId);
      
      return true;
    } catch (error) {
      console.error('Error deleting custom role:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission
   * @param {string} userId - User ID
   * @param {string} permission - Permission to check
   * @returns {Promise<boolean>} - Whether user has permission
   */
  async hasPermission(userId, permission) {
    try {
      // Get user data
      const userData = await SupabaseService.getUserData(userId);
      if (!userData) return false;
      
      // Get user role
      const role = this.getRole(userData.role);
      if (!role) return false;
      
      // Check if role has wildcard permission
      if (role.permissions.includes('*')) return true;
      
      // Check if role has specific permission
      return role.permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get available permissions
   * @returns {Array} - Array of available permissions
   */
  getAvailablePermissions() {
    return [
      {
        id: 'user.read',
        name: 'Read Users',
        description: 'View user information'
      },
      {
        id: 'user.create',
        name: 'Create Users',
        description: 'Create new users'
      },
      {
        id: 'user.update',
        name: 'Update Users',
        description: 'Update user information'
      },
      {
        id: 'user.delete',
        name: 'Delete Users',
        description: 'Delete users'
      },
      {
        id: 'transaction.read',
        name: 'Read Transactions',
        description: 'View transaction information'
      },
      {
        id: 'transaction.create',
        name: 'Create Transactions',
        description: 'Create new transactions'
      },
      {
        id: 'transaction.update',
        name: 'Update Transactions',
        description: 'Update transaction information'
      },
      {
        id: 'transaction.approve',
        name: 'Approve Transactions',
        description: 'Approve transactions'
      },
      {
        id: 'transaction.reject',
        name: 'Reject Transactions',
        description: 'Reject transactions'
      },
      {
        id: 'settings.read',
        name: 'Read Settings',
        description: 'View system settings'
      },
      {
        id: 'settings.update',
        name: 'Update Settings',
        description: 'Update system settings'
      },
      {
        id: 'logs.read',
        name: 'Read Logs',
        description: 'View system logs'
      },
      {
        id: 'analytics.read',
        name: 'Read Analytics',
        description: 'View analytics data'
      },
      {
        id: 'analytics.export',
        name: 'Export Analytics',
        description: 'Export analytics data'
      },
      {
        id: 'organization.read',
        name: 'Read Organizations',
        description: 'View organization information'
      },
      {
        id: 'organization.create',
        name: 'Create Organizations',
        description: 'Create new organizations'
      },
      {
        id: 'organization.update',
        name: 'Update Organizations',
        description: 'Update organization information'
      },
      {
        id: 'organization.delete',
        name: 'Delete Organizations',
        description: 'Delete organizations'
      },
      {
        id: '*',
        name: 'All Permissions',
        description: 'Full system access'
      }
    ];
  }

  /**
   * Get permission by ID
   * @param {string} permissionId - Permission ID
   * @returns {Object|null} - Permission data
   */
  getPermission(permissionId) {
    return this.getAvailablePermissions().find(p => p.id === permissionId) || null;
  }

  /**
   * Get permission name
   * @param {string} permissionId - Permission ID
   * @returns {string} - Permission name
   */
  getPermissionName(permissionId) {
    const permission = this.getPermission(permissionId);
    return permission ? permission.name : permissionId;
  }

  /**
   * Group permissions by category
   * @returns {Object} - Permissions grouped by category
   */
  getPermissionsByCategory() {
    const permissions = this.getAvailablePermissions();
    const categories = {};
    
    permissions.forEach(permission => {
      const category = permission.id.split('.')[0];
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(permission);
    });
    
    return categories;
  }
}

export const RoleManager = new RoleManagerClass();