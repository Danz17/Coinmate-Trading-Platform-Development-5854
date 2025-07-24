import { AppStateManager } from './AppStateManager';

class NotificationServiceClass {
  constructor() {
    this.isEnabled = false;
    this.botToken = '';
    this.chatId = '';
  }

  initialize() {
    const config = AppStateManager.getConfig();
    this.isEnabled = config.notificationsEnabled && config.telegramBotToken && config.telegramChatId;
    this.botToken = config.telegramBotToken;
    this.chatId = config.telegramChatId;
  }

  async sendNotification(message) {
    if (!this.isEnabled || !this.botToken || !this.chatId) {
      console.log('Notification (disabled):', message);
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (response.ok) {
        console.log('Notification sent successfully');
        return true;
      } else {
        console.error('Failed to send notification:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async notifyTransaction(transaction) {
    const { type, user_name, usdtAmount, phpAmount, platform, bank, rate } = transaction;
    
    const message = `
🔔 <b>New ${type} Transaction</b>

👤 <b>User:</b> ${user_name}
💰 <b>Amount:</b> ${usdtAmount} USDT ↔ ₱${phpAmount.toFixed(2)}
📊 <b>Rate:</b> ₱${rate.toFixed(2)} per USDT
🏦 <b>Platform:</b> ${platform}
🏧 <b>Bank:</b> ${bank}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    return this.sendNotification(message);
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

    return this.sendNotification(message);
  }

  async notifyBalanceAdjustment(adjustment) {
    const { user, type, amount, reason } = adjustment;
    
    const message = `
⚖️ <b>Balance Adjustment</b>

👤 <b>User:</b> ${user}
💰 <b>Type:</b> ${type}
💵 <b>Amount:</b> ${amount}
📝 <b>Reason:</b> ${reason}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    return this.sendNotification(message);
  }

  updateConfig(config) {
    this.isEnabled = config.notificationsEnabled && config.telegramBotToken && config.telegramChatId;
    this.botToken = config.telegramBotToken;
    this.chatId = config.telegramChatId;
  }
}

export const NotificationService = new NotificationServiceClass();