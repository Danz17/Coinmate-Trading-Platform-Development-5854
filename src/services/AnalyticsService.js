import { AppStateManager } from './AppStateManager';
import { SupabaseService } from './SupabaseService';

class AnalyticsServiceClass {
  constructor() {
    this.isInitialized = false;
    this.events = [];
    this.flushInterval = null;
    this.batchSize = 10;
    this.flushIntervalTime = 30000; // 30 seconds
    this.isEnabled = true;
    this.userId = null;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize analytics service
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Get feature flag for analytics
    const featureFlags = AppStateManager.getFeatureFlags();
    this.isEnabled = featureFlags.enableAnalytics !== false;
    
    // Set user ID if available
    const currentUser = AppStateManager.getCurrentUser();
    if (currentUser) {
      this.userId = currentUser.id;
    }
    
    // Start flush interval
    this.startFlushInterval();
    
    // Add event listeners
    this.addEventListeners();
    
    // Track page view for initial page
    this.trackPageView(window.location.pathname);
    
    this.isInitialized = true;
  }

  /**
   * Generate session ID
   * @returns {string} - Session ID
   */
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Start flush interval
   */
  startFlushInterval() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalTime);
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    // Track page changes
    window.addEventListener('hashchange', () => {
      this.trackPageView(window.location.hash.substring(1) || '/');
    });
    
    // Listen for user changes
    AppStateManager.addListener('user', (user) => {
      this.userId = user?.id || null;
    });
  }

  /**
   * Track event
   * @param {string} eventName - Event name
   * @param {Object} eventData - Event data
   */
  trackEvent(eventName, eventData = {}) {
    if (!this.isEnabled) return;
    
    const event = {
      event_name: eventName,
      event_data: eventData,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      page_url: window.location.pathname,
      user_agent: navigator.userAgent
    };
    
    this.events.push(event);
    
    // Flush if batch size is reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Track page view
   * @param {string} page - Page path
   */
  trackPageView(page) {
    this.trackEvent('page_view', { page });
  }

  /**
   * Track button click
   * @param {string} buttonId - Button ID
   * @param {string} buttonText - Button text
   */
  trackButtonClick(buttonId, buttonText) {
    this.trackEvent('button_click', { button_id: buttonId, button_text: buttonText });
  }

  /**
   * Track form submission
   * @param {string} formId - Form ID
   * @param {Object} formData - Form data (sensitive data should be excluded)
   */
  trackFormSubmission(formId, formData = {}) {
    // Exclude sensitive fields
    const safeData = { ...formData };
    
    // Remove sensitive fields
    ['password', 'token', 'secret', 'credit_card'].forEach(field => {
      if (safeData[field]) {
        safeData[field] = '[REDACTED]';
      }
    });
    
    this.trackEvent('form_submission', { form_id: formId, form_data: safeData });
  }

  /**
   * Track error
   * @param {string} errorType - Error type
   * @param {string} errorMessage - Error message
   * @param {Object} errorData - Additional error data
   */
  trackError(errorType, errorMessage, errorData = {}) {
    this.trackEvent('error', { error_type: errorType, error_message: errorMessage, ...errorData });
  }

  /**
   * Track feature usage
   * @param {string} featureId - Feature ID
   * @param {Object} featureData - Feature data
   */
  trackFeatureUsage(featureId, featureData = {}) {
    this.trackEvent('feature_usage', { feature_id: featureId, ...featureData });
  }

  /**
   * Track user interaction
   * @param {string} interactionType - Interaction type
   * @param {Object} interactionData - Interaction data
   */
  trackInteraction(interactionType, interactionData = {}) {
    this.trackEvent('interaction', { interaction_type: interactionType, ...interactionData });
  }

  /**
   * Flush events to server
   * @returns {Promise<boolean>} - Whether flush was successful
   */
  async flush() {
    if (!this.isEnabled || this.events.length === 0) return true;
    
    try {
      const eventsToSend = [...this.events];
      this.events = [];
      
      // Send events to server
      const result = await this.sendEvents(eventsToSend);
      
      return result;
    } catch (error) {
      console.error('Error flushing analytics events:', error);
      
      // Put events back in queue
      this.events = [...this.events, ...this.events];
      
      return false;
    }
  }

  /**
   * Send events to server
   * @param {Array} events - Events to send
   * @returns {Promise<boolean>} - Whether send was successful
   */
  async sendEvents(events) {
    try {
      // Get current organization
      const organization = AppStateManager.getCurrentOrganization();
      
      // Add organization ID to events
      const eventsWithOrg = events.map(event => ({
        ...event,
        organization_id: organization?.id || null
      }));
      
      // Send to Supabase
      const { error } = await supabase.from('analytics_events').insert(eventsWithOrg);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error sending analytics events:', error);
      return false;
    }
  }

  /**
   * Disable analytics
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Enable analytics
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Clean up analytics service
   */
  cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush remaining events
    this.flush();
    
    this.isInitialized = false;
  }

  /**
   * Get analytics data for dashboard
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Data filters
   * @returns {Promise<Object>} - Analytics data
   */
  async getAnalyticsData(organizationId, filters = {}) {
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date(now);
      startDate.setDate(now.getDate() - (filters.days || 7));
      
      // Get analytics events
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      
      // Process data
      const result = {
        pageViews: data.filter(e => e.event_name === 'page_view').length,
        buttonClicks: data.filter(e => e.event_name === 'button_click').length,
        formSubmissions: data.filter(e => e.event_name === 'form_submission').length,
        errors: data.filter(e => e.event_name === 'error').length,
        uniqueUsers: new Set(data.map(e => e.user_id).filter(Boolean)).size,
        uniqueSessions: new Set(data.map(e => e.session_id)).size,
        topPages: this.getTopPages(data),
        eventsByDay: this.getEventsByDay(data),
        eventsByType: this.getEventsByType(data)
      };
      
      return result;
    } catch (error) {
      console.error('Error getting analytics data:', error);
      return null;
    }
  }

  /**
   * Get top pages from analytics events
   * @param {Array} events - Analytics events
   * @returns {Array} - Top pages
   */
  getTopPages(events) {
    const pageViews = events.filter(e => e.event_name === 'page_view');
    
    const pageMap = new Map();
    
    pageViews.forEach(event => {
      const page = event.event_data?.page || event.page_url || '/';
      
      if (pageMap.has(page)) {
        pageMap.set(page, pageMap.get(page) + 1);
      } else {
        pageMap.set(page, 1);
      }
    });
    
    // Convert to array and sort
    return Array.from(pageMap.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get events by day
   * @param {Array} events - Analytics events
   * @returns {Object} - Events by day
   */
  getEventsByDay(events) {
    const result = {};
    
    events.forEach(event => {
      const day = event.timestamp.split('T')[0];
      
      if (!result[day]) {
        result[day] = {
          total: 0,
          page_view: 0,
          button_click: 0,
          form_submission: 0,
          error: 0,
          other: 0
        };
      }
      
      result[day].total += 1;
      
      if (event.event_name === 'page_view') {
        result[day].page_view += 1;
      } else if (event.event_name === 'button_click') {
        result[day].button_click += 1;
      } else if (event.event_name === 'form_submission') {
        result[day].form_submission += 1;
      } else if (event.event_name === 'error') {
        result[day].error += 1;
      } else {
        result[day].other += 1;
      }
    });
    
    return result;
  }

  /**
   * Get events by type
   * @param {Array} events - Analytics events
   * @returns {Object} - Events by type
   */
  getEventsByType(events) {
    const result = {};
    
    events.forEach(event => {
      if (!result[event.event_name]) {
        result[event.event_name] = 0;
      }
      
      result[event.event_name] += 1;
    });
    
    return result;
  }
}

export const AnalyticsService = new AnalyticsServiceClass();