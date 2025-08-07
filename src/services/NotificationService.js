import { AppStateManager } from './AppStateManager';
import { SupabaseService } from './SupabaseService';
import { toast } from 'react-toastify';

class NotificationServiceClass {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.isInitialized = false;
    this.pollingInterval = null;
    this.lastCheckedTimestamp = null;
    this.isEnabled = true;
    this.listeners = [];
  }

  /**
   * Initialize notification service
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Get feature flag for notifications
    const featureFlags = AppStateManager.getFeatureFlags();
    this.isEnabled = featureFlags.enableNotifications !== false;
    
    if (!this.isEnabled) return;
    
    // Load notifications for current user
    this.loadNotifications();
    
    // Start polling for new notifications
    this.startPolling();
    
    // Add user change listener
    AppStateManager.addListener('user', (user) => {
      if (user) {
        this.loadNotifications();
        this.startPolling();
      } else {
        this.notifications = [];
        this.unreadCount = 0;
        this.stopPolling();
        this.notifyListeners();
      }
    });
    
    this.isInitialized = true;
  }

  /**
   * Load notifications for current user
   */
  async loadNotifications() {
    try {
      const user = AppStateManager.getCurrentUser();
      if (!user) return;
      
      const notifications = await SupabaseService.getUserNotifications(user.id);
      
      this.notifications = notifications || [];
      this.unreadCount = this.notifications.filter(n => !n.read).length;
      this.lastCheckedTimestamp = new Date().toISOString();
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  /**
   * Start polling for new notifications
   */
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.pollingInterval = setInterval(() => {
      this.checkForNewNotifications();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop polling for new notifications
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Check for new notifications
   */
  async checkForNewNotifications() {
    try {
      const user = AppStateManager.getCurrentUser();
      if (!user || !this.lastCheckedTimestamp) return;
      
      const newNotifications = await SupabaseService.getNewNotifications(user.id, this.lastCheckedTimestamp);
      
      if (newNotifications && newNotifications.length > 0) {
        // Add new notifications to the list
        this.notifications = [...newNotifications, ...this.notifications];
        this.unreadCount += newNotifications.length;
        
        // Show toast for new notifications
        this.showToastForNewNotifications(newNotifications);
        
        this.notifyListeners();
      }
      
      this.lastCheckedTimestamp = new Date().toISOString();
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  }

  /**
   * Show toast for new notifications
   * @param {Array} notifications - New notifications
   */
  showToastForNewNotifications(notifications) {
    if (!notifications || notifications.length === 0) return;
    
    if (notifications.length === 1) {
      // Show single notification toast
      const notification = notifications[0];
      toast.info(notification.message, {
        onClick: () => this.markAsRead(notification.id)
      });
    } else {
      // Show summary toast for multiple notifications
      toast.info(`You have ${notifications.length} new notifications`, {
        onClick: () => this.markAllAsRead()
      });
    }
  }

  /**
   * Get all notifications
   * @returns {Array} - Array of notifications
   */
  getNotifications() {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   * @returns {Array} - Array of unread notifications
   */
  getUnreadNotifications() {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Get unread count
   * @returns {number} - Number of unread notifications
   */
  getUnreadCount() {
    return this.unreadCount;
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  async markAsRead(notificationId) {
    try {
      // Find notification in local cache
      const notification = this.notifications.find(n => n.id === notificationId);
      if (!notification || notification.read) return;
      
      // Mark as read in database
      await SupabaseService.markNotificationAsRead(notificationId);
      
      // Update local cache
      notification.read = true;
      notification.read_at = new Date().toISOString();
      
      // Update unread count
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const user = AppStateManager.getCurrentUser();
      if (!user) return;
      
      // Mark all as read in database
      await SupabaseService.markAllNotificationsAsRead(user.id);
      
      // Update local cache
      this.notifications.forEach(notification => {
        notification.read = true;
        notification.read_at = new Date().toISOString();
      });
      
      // Update unread count
      this.unreadCount = 0;
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   */
  async deleteNotification(notificationId) {
    try {
      // Delete from database
      await SupabaseService.deleteNotification(notificationId);
      
      // Find notification in local cache
      const notification = this.notifications.find(n => n.id === notificationId);
      
      // Update unread count if needed
      if (notification && !notification.read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      
      // Remove from local cache
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Create notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} - Created notification
   */
  async createNotification(notificationData) {
    try {
      const notification = await SupabaseService.createNotification(notificationData);
      
      if (notification) {
        // Add to local cache
        this.notifications.unshift(notification);
        
        // Update unread count
        this.unreadCount += 1;
        
        // Show toast for new notification
        this.showToastForNewNotifications([notification]);
        
        this.notifyListeners();
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Add notification listener
   * @param {Function} callback - Callback function
   * @returns {Function} - Function to remove listener
   */
  addListener(callback) {
    this.listeners.push(callback);
    
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify listeners of state change
   */
  notifyListeners() {
    const data = {
      notifications: this.notifications,
      unreadCount: this.unreadCount
    };
    
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Clean up notification service
   */
  cleanup() {
    this.stopPolling();
    this.listeners = [];
    this.isInitialized = false;
  }
}

export const NotificationService = new NotificationServiceClass();