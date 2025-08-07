import { SupabaseService } from './SupabaseService';
import { OrganizationManager } from './OrganizationManager';
import { SecurityService } from './SecurityService';

class AppStateManagerClass {
  constructor() {
    this.currentUser = null;
    this.currentOrganization = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.listeners = {
      user: [],
      organization: [],
      state: []
    };
    this.state = {
      isLoading: true,
      isAuthenticated: false,
      selectedTab: 'dashboard',
      featureFlags: {
        enableAnalytics: true,
        enableNotifications: true,
        enableAdvancedTrade: false,
        enableWhiteLabeling: false
      }
    };
  }

  /**
   * Initialize application state
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized || this.isInitializing) return this.isInitialized;
    
    this.isInitializing = true;
    this.setState({ isLoading: true });
    
    try {
      // Load current user
      const user = await SupabaseService.getCurrentUser();
      
      if (user) {
        this.setCurrentUser(user);
        
        // Initialize organization manager
        await OrganizationManager.initialize();
        
        // Set current organization if user has one
        if (user.organization_id) {
          const org = await OrganizationManager.getOrganization(user.organization_id);
          if (org) {
            this.setCurrentOrganization(org);
            
            // Load security settings for organization
            await SecurityService.loadSecuritySettings(org.id);
            
            // Apply white label settings if available
            const whiteLabel = await OrganizationManager.getWhiteLabelSettings(org.id);
            if (whiteLabel) {
              OrganizationManager.applyWhiteLabelSettings(whiteLabel);
            }
          }
        }
        
        // Set feature flags based on user role
        if (user.role === 'super_admin' || user.role === 'admin') {
          this.setFeatureFlags({
            enableAnalytics: true,
            enableNotifications: true,
            enableAdvancedTrade: true,
            enableWhiteLabeling: user.role === 'super_admin'
          });
        } else if (user.role === 'analyst') {
          this.setFeatureFlags({
            enableAnalytics: true,
            enableNotifications: true,
            enableAdvancedTrade: false,
            enableWhiteLabeling: false
          });
        }
        
        this.setState({ isAuthenticated: true });
      } else {
        this.setState({ isAuthenticated: false });
      }
      
      this.isInitialized = true;
      this.isInitializing = false;
      this.setState({ isLoading: false });
      
      return true;
    } catch (error) {
      console.error('Error initializing app state:', error);
      this.isInitializing = false;
      this.setState({ isLoading: false, isAuthenticated: false });
      return false;
    }
  }

  /**
   * Set current user
   * @param {Object} user - User data
   */
  setCurrentUser(user) {
    this.currentUser = user;
    this.notifyListeners('user', user);
  }

  /**
   * Get current user
   * @returns {Object} - Current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Set current organization
   * @param {Object} organization - Organization data
   */
  setCurrentOrganization(organization) {
    this.currentOrganization = organization;
    this.notifyListeners('organization', organization);
  }

  /**
   * Get current organization
   * @returns {Object} - Current organization
   */
  getCurrentOrganization() {
    return this.currentOrganization;
  }

  /**
   * Set feature flags
   * @param {Object} flags - Feature flags
   */
  setFeatureFlags(flags) {
    this.state.featureFlags = {
      ...this.state.featureFlags,
      ...flags
    };
    this.notifyListeners('state', this.state);
  }

  /**
   * Get feature flags
   * @returns {Object} - Feature flags
   */
  getFeatureFlags() {
    return { ...this.state.featureFlags };
  }

  /**
   * Set application state
   * @param {Object} newState - New state
   */
  setState(newState) {
    this.state = {
      ...this.state,
      ...newState
    };
    this.notifyListeners('state', this.state);
  }

  /**
   * Get application state
   * @returns {Object} - Application state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Login result
   */
  async loginUser(email, password) {
    try {
      this.setState({ isLoading: true });
      
      const { session, user, profile } = await SupabaseService.signIn(email, password);
      
      if (user) {
        // Combine auth user with profile data
        const userData = { ...user, ...profile };
        this.setCurrentUser(userData);
        
        // Set current organization if user has one
        if (userData.organization_id) {
          const org = await OrganizationManager.getOrganization(userData.organization_id);
          if (org) {
            this.setCurrentOrganization(org);
            
            // Load security settings for organization
            await SecurityService.loadSecuritySettings(org.id);
            
            // Apply white label settings if available
            const whiteLabel = await OrganizationManager.getWhiteLabelSettings(org.id);
            if (whiteLabel) {
              OrganizationManager.applyWhiteLabelSettings(whiteLabel);
            }
          }
        }
        
        // Set feature flags based on user role
        if (userData.role === 'super_admin' || userData.role === 'admin') {
          this.setFeatureFlags({
            enableAnalytics: true,
            enableNotifications: true,
            enableAdvancedTrade: true,
            enableWhiteLabeling: userData.role === 'super_admin'
          });
        } else if (userData.role === 'analyst') {
          this.setFeatureFlags({
            enableAnalytics: true,
            enableNotifications: true,
            enableAdvancedTrade: false,
            enableWhiteLabeling: false
          });
        }
        
        this.setState({ isAuthenticated: true, isLoading: false });
        
        // Log login event
        await SupabaseService.createSystemLog({
          type: 'auth',
          subtype: 'login',
          user: userData.name || userData.email,
          reason: 'User logged in',
          organization_id: userData.organization_id
        });
        
        return { success: true, user: userData };
      } else {
        this.setState({ isAuthenticated: false, isLoading: false });
        return { success: false, error: 'Invalid login credentials' };
      }
    } catch (error) {
      console.error('Error logging in:', error);
      this.setState({ isAuthenticated: false, isLoading: false });
      return { success: false, error: error.message || 'Login failed' };
    }
  }

  /**
   * Logout user
   * @returns {Promise<boolean>} - Whether logout was successful
   */
  async logoutUser() {
    try {
      this.setState({ isLoading: true });
      
      // Log logout event if user is logged in
      if (this.currentUser) {
        await SupabaseService.createSystemLog({
          type: 'auth',
          subtype: 'logout',
          user: this.currentUser.name || this.currentUser.email,
          reason: 'User logged out',
          organization_id: this.currentUser.organization_id
        });
      }
      
      await SupabaseService.signOut();
      
      // Clear state
      this.setCurrentUser(null);
      this.setCurrentOrganization(null);
      
      // Reset feature flags
      this.setFeatureFlags({
        enableAnalytics: true,
        enableNotifications: true,
        enableAdvancedTrade: false,
        enableWhiteLabeling: false
      });
      
      this.setState({ isAuthenticated: false, isLoading: false });
      
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      this.setState({ isLoading: false });
      return false;
    }
  }

  /**
   * Register new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} userData - Additional user data
   * @returns {Promise<Object>} - Registration result
   */
  async registerUser(email, password, userData = {}) {
    try {
      this.setState({ isLoading: true });
      
      const { user, profile } = await SupabaseService.signUp(email, password, userData);
      
      if (user) {
        // Combine auth user with profile data
        const newUser = { ...user, ...profile };
        this.setCurrentUser(newUser);
        
        // Set current organization if user has one
        if (newUser.organization_id) {
          const org = await OrganizationManager.getOrganization(newUser.organization_id);
          if (org) {
            this.setCurrentOrganization(org);
          }
        }
        
        this.setState({ isAuthenticated: true, isLoading: false });
        
        // Log registration event
        await SupabaseService.createSystemLog({
          type: 'auth',
          subtype: 'register',
          user: newUser.name || newUser.email,
          reason: 'User registered',
          organization_id: newUser.organization_id
        });
        
        return { success: true, user: newUser };
      } else {
        this.setState({ isAuthenticated: false, isLoading: false });
        return { success: false, error: 'Registration failed' };
      }
    } catch (error) {
      console.error('Error registering user:', error);
      this.setState({ isAuthenticated: false, isLoading: false });
      return { success: false, error: error.message || 'Registration failed' };
    }
  }

  /**
   * Switch organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<boolean>} - Whether switch was successful
   */
  async switchOrganization(organizationId) {
    try {
      // Ensure user is authenticated
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Get organization data
      const org = await OrganizationManager.getOrganization(organizationId);
      if (!org) {
        throw new Error('Organization not found');
      }
      
      // Set current organization
      this.setCurrentOrganization(org);
      
      // Load security settings for organization
      await SecurityService.loadSecuritySettings(org.id);
      
      // Apply white label settings if available
      const whiteLabel = await OrganizationManager.getWhiteLabelSettings(org.id);
      if (whiteLabel) {
        OrganizationManager.applyWhiteLabelSettings(whiteLabel);
      }
      
      // Log organization switch event
      await SupabaseService.createSystemLog({
        type: 'organization',
        subtype: 'switch',
        user: this.currentUser.name || this.currentUser.email,
        reason: `Switched to organization: ${org.name}`,
        organization_id: org.id
      });
      
      return true;
    } catch (error) {
      console.error('Error switching organization:', error);
      return false;
    }
  }

  /**
   * Add state change listener
   * @param {string} type - Listener type ('user', 'organization', 'state')
   * @param {Function} callback - Callback function
   * @returns {Function} - Function to remove listener
   */
  addListener(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    
    this.listeners[type].push(callback);
    
    return () => {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    };
  }

  /**
   * Notify listeners of state change
   * @param {string} type - Listener type ('user', 'organization', 'state')
   * @param {*} data - Data to pass to listeners
   */
  notifyListeners(type, data) {
    if (!this.listeners[type]) return;
    
    this.listeners[type].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${type} listener:`, error);
      }
    });
  }

  /**
   * Set selected tab
   * @param {string} tab - Tab name
   */
  setSelectedTab(tab) {
    this.setState({ selectedTab: tab });
  }

  /**
   * Get selected tab
   * @returns {string} - Selected tab
   */
  getSelectedTab() {
    return this.state.selectedTab;
  }
}

export const AppStateManager = new AppStateManagerClass();