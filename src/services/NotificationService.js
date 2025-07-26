import { AppStateManager } from './AppStateManager';

class NotificationServiceClass {
  constructor() {
    this.isEnabled = false;
    this.botToken = '';
    this.chatId = '';
    this.slackWebhook = '';
    this.teamsWebhook = '';
    this.emailConfig = null;
  }

  initialize() {
    const config = AppStateManager.getSystemSettings();
    this.isEnabled = config && config.notifications_enabled;
    this.botToken = config?.telegram_bot_token || '';
    this.chatId = config?.telegram_chat_id || '';
    this.slackWebhook = config?.slack_webhook_url || '';
    this.teamsWebhook = config?.teams_webhook_url || '';
    this.emailConfig = config?.email_config || null;
  }

  async sendNotification(message, channels = ['telegram']) {
    if (!this.isEnabled) {
      console.log('Notifications disabled:', message);
      return false;
    }

    const results = [];

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'telegram':
            results.push(await this.sendTelegram(message));
            break;
          case 'slack':
            results.push(await this.sendSlack(message));
            break;
          case 'teams':
            results.push(await this.sendTeams(message));
            break;
          case 'email':
            results.push(await this.sendEmail(message));
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        results.push(false);
      }
    }

    return results.some(result => result === true);
  }

  async sendTelegram(message) {
    if (!this.botToken || !this.chatId) return false;

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Telegram notification error:', error);
      return false;
    }
  }

  async sendSlack(message) {
    if (!this.slackWebhook) return false;

    try {
      const response = await fetch(this.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          username: 'Coinmate Bot',
          icon_emoji: ':money_with_wings:'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Slack notification error:', error);
      return false;
    }
  }

  async sendTeams(message) {
    if (!this.teamsWebhook) return false;

    try {
      const response = await fetch(this.teamsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": "0076D7",
          "summary": "Coinmate Notification",
          "sections": [{
            "activityTitle": "Coinmate Alert",
            "activitySubtitle": new Date().toLocaleString(),
            "text": message,
            "markdown": true
          }]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Teams notification error:', error);
      return false;
    }
  }

  async sendEmail(message) {
    // This would require a backend email service
    // For now, just log the attempt
    console.log('Email notification (not implemented):', message);
    return false;
  }

  // Enhanced notification methods
  async notifyTransaction(transaction) {
    const { type, user_name, usdt_amount, php_amount, platform, bank, rate } = transaction;
    
    const message = `
🔔 <b>New ${type} Transaction</b>
👤 <b>User:</b> ${user_name}
💰 <b>Amount:</b> ${usdt_amount} USDT ↔ ₱${php_amount.toFixed(2)}
📊 <b>Rate:</b> ₱${rate.toFixed(2)} per USDT
🏦 <b>Platform:</b> ${platform}
🏧 <b>Bank:</b> ${bank}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    return this.sendNotification(message, ['telegram', 'slack']);
  }

  async notifyLargeTransaction(transaction, threshold = 50000) {
    if (transaction.php_amount < threshold) return;

    const message = `
🚨 <b>LARGE TRANSACTION ALERT</b>
💰 <b>Amount:</b> ₱${transaction.php_amount.toLocaleString()}
👤 <b>User:</b> ${transaction.user_name}
📊 <b>Type:</b> ${transaction.type}
⚠️ <b>Requires Review</b>
    `.trim();

    return this.sendNotification(message, ['telegram', 'slack', 'teams']);
  }

  async notifyBalanceAlert(user, bank, currentBalance, threshold = 1000) {
    if (currentBalance > threshold) return;

    const message = `
⚠️ <b>LOW BALANCE ALERT</b>
👤 <b>User:</b> ${user}
🏧 <b>Bank:</b> ${bank}
💰 <b>Balance:</b> ₱${currentBalance.toFixed(2)}
📉 <b>Below Threshold:</b> ₱${threshold.toFixed(2)}
    `.trim();

    return this.sendNotification(message, ['telegram', 'slack']);
  }

  async notifySystemError(error, context = '') {
    const message = `
🔴 <b>SYSTEM ERROR</b>
📍 <b>Context:</b> ${context}
❌ <b>Error:</b> ${error.message}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
🔧 <b>Action Required</b>
    `.trim();

    return this.sendNotification(message, ['telegram', 'slack', 'teams']);
  }

  async notifyEOD(report) {
    const { totalPHP, totalUSDT, profit, transactionCount } = report;
    
    const message = `
📊 <b>End of Day Report</b>
💵 <b>Total PHP:</b> ₱${totalPHP.toFixed(2)}
💰 <b>Total USDT:</b> ${totalUSDT.toFixed(2)}
📈 <b>Net Profit:</b> ₱${profit.toFixed(2)}
📝 <b>Transactions:</b> ${transactionCount}
📅 <b>Date:</b> ${new Date().toLocaleDateString()}
    `.trim();

    return this.sendNotification(message, ['telegram', 'slack']);
  }

  async notifyArbitrageOpportunity(opportunity) {
    const { platform1, platform2, rate1, rate2, difference, volume } = opportunity;
    
    const message = `
💎 <b>ARBITRAGE OPPORTUNITY</b>
🏦 <b>Platforms:</b> ${platform1} vs ${platform2}
📊 <b>Rates:</b> ₱${rate1.toFixed(4)} vs ₱${rate2.toFixed(4)}
📈 <b>Difference:</b> ${difference.toFixed(2)}%
💰 <b>Potential Volume:</b> ${volume.toFixed(2)} USDT
⚡ <b>Act Fast!</b>
    `.trim();

    return this.sendNotification(message, ['telegram', 'slack', 'teams']);
  }

  async notifySecurityAlert(alert) {
    const { type, user, ip, timestamp, details } = alert;
    
    const message = `
🛡️ <b>SECURITY ALERT</b>
⚠️ <b>Type:</b> ${type}
👤 <b>User:</b> ${user}
🌐 <b>IP:</b> ${ip}
⏰ <b>Time:</b> ${timestamp}
📝 <b>Details:</b> ${details}
    `.trim();

    return this.sendNotification(message, ['telegram', 'slack', 'teams']);
  }

  updateConfig(config) {
    this.isEnabled = config.notifications_enabled;
    this.botToken = config.telegram_bot_token;
    this.chatId = config.telegram_chat_id;
    this.slackWebhook = config.slack_webhook_url;
    this.teamsWebhook = config.teams_webhook_url;
    this.emailConfig = config.email_config;
  }
}

export const NotificationService = new NotificationServiceClass();