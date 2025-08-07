import { NotificationService } from './NotificationService.js';

class SecurityServiceClass {
  constructor() {
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.maxFailedAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.securityLogs = [];
  }

  // Track login attempts
  trackLoginAttempt(email, success, ip, userAgent) {
    const attempt = {
      email,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };

    this.securityLogs.push(attempt);
    
    // Keep only last 1000 logs
    if (this.securityLogs.length > 1000) {
      this.securityLogs = this.securityLogs.slice(-1000);
    }

    // Check for suspicious activity
    if (!success) {
      this.checkFailedAttempts(email, ip);
    }

    return attempt;
  }

  // Check for multiple failed attempts
  checkFailedAttempts(email, ip) {
    const recentAttempts = this.securityLogs.filter(log => 
      (log.email === email || log.ip === ip) &&
      !log.success &&
      new Date(log.timestamp) > new Date(Date.now() - this.lockoutDuration)
    );

    if (recentAttempts.length >= this.maxFailedAttempts) {
      this.triggerSecurityAlert({
        type: 'Multiple Failed Login Attempts',
        email,
        ip,
        attempts: recentAttempts.length,
        timeframe: '15 minutes'
      });
      return true; // Account should be locked
    }

    return false;
  }

  // Validate session
  validateSession(user) {
    if (!user || !user.login_time) return false;

    const loginTime = new Date(user.login_time);
    const now = new Date();
    const sessionAge = now - loginTime;

    if (sessionAge > this.sessionTimeout) {
      this.triggerSecurityAlert({
        type: 'Session Timeout',
        user: user.name,
        sessionAge: Math.floor(sessionAge / 60000) + ' minutes'
      });
      return false;
    }

    return true;
  }

  // Check for suspicious IP changes
  checkIPChange(user, currentIP) {
    const userLogs = this.securityLogs.filter(log => 
      log.email === user.email && 
      log.success &&
      new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    const recentIPs = [...new Set(userLogs.map(log => log.ip))];
    
    if (recentIPs.length > 1 && !recentIPs.includes(currentIP)) {
      this.triggerSecurityAlert({
        type: 'Suspicious IP Change',
        user: user.name,
        email: user.email,
        previousIPs: recentIPs,
        currentIP
      });
    }
  }

  // Validate transaction security
  validateTransaction(transaction, user, ip) {
    const risks = [];

    // Large transaction check
    if (transaction.php_amount > 100000) {
      risks.push({
        level: 'HIGH',
        type: 'Large Transaction',
        details: `Transaction amount: ₱${transaction.php_amount.toLocaleString()}`
      });
    }

    // Off-hours transaction
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      risks.push({
        level: 'MEDIUM',
        type: 'Off-hours Transaction',
        details: `Transaction at ${hour}:00`
      });
    }

    // Rate deviation check
    const marketRate = 56.25; // This should come from ExchangeRateService
    const deviation = Math.abs((transaction.rate - marketRate) / marketRate) * 100;
    if (deviation > 10) {
      risks.push({
        level: 'HIGH',
        type: 'Rate Deviation',
        details: `Rate deviates ${deviation.toFixed(1)}% from market`
      });
    }

    // Rapid transactions check
    const recentTransactions = this.getRecentTransactions(user.id, 10 * 60 * 1000); // Last 10 minutes
    if (recentTransactions.length > 5) {
      risks.push({
        level: 'MEDIUM',
        type: 'Rapid Transactions',
        details: `${recentTransactions.length} transactions in 10 minutes`
      });
    }

    if (risks.length > 0) {
      this.triggerSecurityAlert({
        type: 'Transaction Risk Assessment',
        user: user.name,
        transaction: {
          type: transaction.type,
          amount: transaction.php_amount,
          rate: transaction.rate
        },
        risks,
        ip
      });
    }

    return risks;
  }

  // Get recent transactions (mock - should integrate with AppStateManager)
  getRecentTransactions(userId, timeframe) {
    // This should be implemented to get actual recent transactions
    return [];
  }

  // Trigger security alert
  triggerSecurityAlert(alert) {
    const securityAlert = {
      ...alert,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };

    console.warn('SECURITY ALERT:', securityAlert);

    // Send to notification service
    if (typeof NotificationService !== 'undefined') {
      NotificationService.notifySecurityAlert(securityAlert);
    }

    // Store in security logs
    this.securityLogs.push({
      type: 'SECURITY_ALERT',
      alert: securityAlert,
      timestamp: securityAlert.timestamp
    });
  }

  // Get security logs for admin view
  getSecurityLogs(limit = 100) {
    return this.securityLogs
      .filter(log => log.type === 'SECURITY_ALERT' || !log.success)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // Validate password strength
  validatePasswordStrength(password) {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    
    return {
      score,
      requirements,
      strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong',
      isValid: score >= 4
    };
  }

  // Generate 2FA token (mock implementation)
  generate2FAToken(user) {
    // In a real implementation, this would integrate with an authenticator app
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Validate 2FA token
  validate2FAToken(user, token) {
    // Mock validation - in production this would verify against the user's 2FA device
    return token && token.length === 6 && /^\d+$/.test(token);
  }

  // Check for account takeover indicators
  checkAccountTakeover(user, currentSession) {
    const indicators = [];

    // Multiple concurrent sessions
    const activeSessions = this.getActiveSessions(user.id);
    if (activeSessions.length > 2) {
      indicators.push('Multiple concurrent sessions');
    }

    // Unusual activity patterns
    const recentActivity = this.getRecentActivity(user.id);
    if (this.detectUnusualActivity(recentActivity, user.normalActivity)) {
      indicators.push('Unusual activity pattern');
    }

    // Password change without email verification
    if (user.passwordChangedRecently && !user.emailVerified) {
      indicators.push('Recent password change without verification');
    }

    if (indicators.length > 0) {
      this.triggerSecurityAlert({
        type: 'Potential Account Takeover',
        user: user.name,
        indicators
      });
    }

    return indicators;
  }

  // Mock methods for session and activity tracking
  getActiveSessions(userId) {
    return []; // Should return actual active sessions
  }

  getRecentActivity(userId) {
    return []; // Should return user's recent activity
  }

  detectUnusualActivity(recentActivity, normalActivity) {
    return false; // Should implement ML-based anomaly detection
  }

  // Generate security report
  generateSecurityReport(timeframe = '24h') {
    const hours = timeframe === '24h' ? 24 : parseInt(timeframe);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const recentLogs = this.securityLogs.filter(log => 
      new Date(log.timestamp) > since
    );

    const report = {
      timeframe,
      totalEvents: recentLogs.length,
      loginAttempts: recentLogs.filter(log => log.email).length,
      failedLogins: recentLogs.filter(log => log.email && !log.success).length,
      securityAlerts: recentLogs.filter(log => log.type === 'SECURITY_ALERT').length,
      uniqueIPs: [...new Set(recentLogs.map(log => log.ip).filter(Boolean))].length,
      topRisks: this.getTopRisks(recentLogs),
      recommendations: this.generateRecommendations(recentLogs)
    };

    return report;
  }

  getTopRisks(logs) {
    const risks = {};
    logs.forEach(log => {
      if (log.alert && log.alert.type) {
        risks[log.alert.type] = (risks[log.alert.type] || 0) + 1;
      }
    });

    return Object.entries(risks)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  generateRecommendations(logs) {
    const recommendations = [];

    const failedLogins = logs.filter(log => !log.success).length;
    if (failedLogins > 10) {
      recommendations.push('Consider implementing CAPTCHA after failed login attempts');
    }

    const uniqueIPs = [...new Set(logs.map(log => log.ip).filter(Boolean))].length;
    if (uniqueIPs > 50) {
      recommendations.push('High number of unique IPs detected - consider IP-based rate limiting');
    }

    return recommendations;
  }
}

export const SecurityService = new SecurityServiceClass();