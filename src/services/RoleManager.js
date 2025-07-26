class RoleManagerClass {
  constructor() {
    this.roles = {
      super_admin: {
        name: 'Super Admin',
        level: 1,
        permissions: [
          'all_access',
          'manage_users',
          'manage_roles',
          'manage_system',
          'view_all_data',
          'edit_all_data',
          'delete_all_data',
          'manage_platforms',
          'manage_banks',
          'adjust_balances',
          'execute_eod',
          'view_hr_logs',
          'export_data',
          'manage_config'
        ],
        description: 'Full system access with all privileges',
        color: 'text-red-600 bg-red-50 border-red-200'
      },
      admin: {
        name: 'Admin',
        level: 2,
        permissions: [
          'manage_users',
          'view_all_data',
          'edit_transactions',
          'delete_transactions',
          'manage_platforms',
          'manage_banks',
          'adjust_balances',
          'execute_eod',
          'view_hr_logs',
          'export_data',
          'trade_all_users',
          'internal_transfers'
        ],
        description: 'Administrative access with user and transaction management',
        color: 'text-purple-600 bg-purple-50 border-purple-200'
      },
      supervisor: {
        name: 'Supervisor',
        level: 3,
        permissions: [
          'view_all_data',
          'edit_own_transactions',
          'execute_eod',
          'view_hr_logs',
          'export_data',
          'trade_assigned_users',
          'internal_transfers',
          'view_analytics'
        ],
        description: 'Supervisory access with limited administrative functions',
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      },
      analyst: {
        name: 'Analyst',
        level: 4,
        permissions: [
          'view_own_data',
          'trade_own_account',
          'view_analytics',
          'export_own_data'
        ],
        description: 'Basic trading access with limited data visibility',
        color: 'text-green-600 bg-green-50 border-green-200'
      }
    };

    this.permissionGroups = {
      user_management: [
        'manage_users',
        'manage_roles',
        'view_all_users'
      ],
      data_access: [
        'view_all_data',
        'view_own_data',
        'edit_all_data',
        'edit_own_transactions',
        'delete_all_data'
      ],
      trading: [
        'trade_all_users',
        'trade_assigned_users',
        'trade_own_account'
      ],
      system: [
        'manage_system',
        'manage_config',
        'manage_platforms',
        'manage_banks',
        'adjust_balances'
      ],
      operations: [
        'execute_eod',
        'internal_transfers',
        'view_hr_logs'
      ],
      analytics: [
        'view_analytics',
        'export_data',
        'export_own_data'
      ]
    };
  }

  // Get all available roles
  getAllRoles() {
    return this.roles;
  }

  // Get role information
  getRole(roleKey) {
    return this.roles[roleKey] || null;
  }

  // Check if a role exists
  roleExists(roleKey) {
    return roleKey in this.roles;
  }

  // Get roles that can be managed by a specific role
  getManageableRoles(currentRole) {
    const currentLevel = this.roles[currentRole]?.level || 999;
    return Object.entries(this.roles)
      .filter(([, role]) => role.level > currentLevel)
      .reduce((acc, [key, role]) => {
        acc[key] = role;
        return acc;
      }, {});
  }

  // Check if user can manage another user's role
  canManageRole(currentRole, targetRole) {
    const currentLevel = this.roles[currentRole]?.level || 999;
    const targetLevel = this.roles[targetRole]?.level || 999;
    return currentLevel < targetLevel;
  }

  // Check if user has specific permission
  hasPermission(userRole, permission) {
    const role = this.roles[userRole];
    if (!role) return false;
    
    // Super admin has all permissions
    if (role.permissions.includes('all_access')) return true;
    
    return role.permissions.includes(permission);
  }

  // Check multiple permissions (user needs ALL of them)
  hasAllPermissions(userRole, permissions) {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  // Check multiple permissions (user needs ANY of them)
  hasAnyPermission(userRole, permissions) {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  // Get all permissions for a role
  getRolePermissions(roleKey) {
    const role = this.roles[roleKey];
    return role ? role.permissions : [];
  }

  // Get permission groups for display
  getPermissionGroups() {
    return this.permissionGroups;
  }

  // Get all unique permissions
  getAllPermissions() {
    const allPermissions = new Set();
    Object.values(this.roles).forEach(role => {
      role.permissions.forEach(permission => allPermissions.add(permission));
    });
    return Array.from(allPermissions).sort();
  }

  // Get role hierarchy for display
  getRoleHierarchy() {
    return Object.entries(this.roles)
      .sort(([, a], [, b]) => a.level - b.level)
      .map(([key, role]) => ({ key, ...role }));
  }

  // Validate role assignment
  validateRoleAssignment(assignerRole, targetRole) {
    if (!this.roleExists(targetRole)) {
      return { valid: false, error: 'Invalid target role' };
    }

    if (!this.canManageRole(assignerRole, targetRole)) {
      return { valid: false, error: 'Insufficient permissions to assign this role' };
    }

    return { valid: true };
  }

  // Get role-based menu items
  getMenuItems(userRole) {
    const items = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'FiHome',
        permission: 'view_own_data'
      },
      {
        id: 'trade',
        label: 'Trade',
        icon: 'FiTrendingUp',
        permission: 'trade_own_account'
      },
      {
        id: 'transactions',
        label: 'Transactions',
        icon: 'FiList',
        permission: 'view_own_data'
      },
      {
        id: 'tracker',
        label: 'Tracker',
        icon: 'FiBarChart3',
        permission: 'view_analytics'
      },
      {
        id: 'eod',
        label: 'End of Day',
        icon: 'FiSun',
        permission: 'execute_eod'
      },
      {
        id: 'hr',
        label: 'HR Tracking',
        icon: 'FiClock',
        permission: 'view_hr_logs'
      },
      {
        id: 'getstarted',
        label: 'Get Started',
        icon: 'FiPlay',
        permission: 'view_own_data'
      },
      {
        id: 'admin',
        label: 'Administration',
        icon: 'FiSettings',
        permission: 'manage_users'
      }
    ];

    return items.filter(item => this.hasPermission(userRole, item.permission));
  }

  // Check data access level
  getDataAccessLevel(userRole, targetUserId, currentUserId) {
    if (this.hasPermission(userRole, 'view_all_data')) {
      return 'full';
    }
    
    if (targetUserId === currentUserId && this.hasPermission(userRole, 'view_own_data')) {
      return 'own';
    }
    
    return 'none';
  }

  // Get role badge styling
  getRoleBadge(roleKey) {
    const role = this.roles[roleKey];
    if (!role) return { label: 'Unknown', color: 'text-gray-600 bg-gray-50 border-gray-200' };
    
    return {
      label: role.name,
      color: role.color,
      description: role.description
    };
  }

  // Role-based feature flags
  getFeatureFlags(userRole) {
    return {
      canViewAllUsers: this.hasPermission(userRole, 'view_all_data'),
      canEditUsers: this.hasPermission(userRole, 'manage_users'),
      canDeleteUsers: this.hasPermission(userRole, 'manage_users'),
      canManageRoles: this.hasPermission(userRole, 'manage_roles'),
      canAdjustBalances: this.hasPermission(userRole, 'adjust_balances'),
      canExecuteEOD: this.hasPermission(userRole, 'execute_eod'),
      canViewHRLogs: this.hasPermission(userRole, 'view_hr_logs'),
      canManagePlatforms: this.hasPermission(userRole, 'manage_platforms'),
      canManageBanks: this.hasPermission(userRole, 'manage_banks'),
      canInternalTransfer: this.hasPermission(userRole, 'internal_transfers'),
      canExportData: this.hasPermission(userRole, 'export_data'),
      canManageConfig: this.hasPermission(userRole, 'manage_config'),
      canTradeForOthers: this.hasAnyPermission(userRole, ['trade_all_users', 'trade_assigned_users'])
    };
  }
}

export const RoleManager = new RoleManagerClass();