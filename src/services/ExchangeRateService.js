import { AppStateManager } from './AppStateManager';

class ExchangeRateServiceClass {
  constructor() {
    this.currentRate = 56.25; // Default mock rate
    this.lastUpdate = new Date();
    this.isUpdating = false;
    this.updateInterval = null;
    this.source = 'Mock'; // 'CoinGecko' or 'Mock'
  }

  initialize() {
    const config = AppStateManager.getConfig();
    this.startAutoUpdate(config.exchangeRateUpdateInterval || 300000);
  }

  async fetchRate() {
    if (this.isUpdating) return this.currentRate;
    
    this.isUpdating = true;
    
    try {
      const config = AppStateManager.getConfig();
      
      if (config.coinGeckoApiKey) {
        // Try to fetch from CoinGecko API
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=php&x_cg_demo_api_key=${config.coinGeckoApiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.tether && data.tether.php) {
            this.currentRate = data.tether.php;
            this.source = 'CoinGecko';
            this.lastUpdate = new Date();
            return this.currentRate;
          }
        }
      }
      
      // Fallback to mock rate with slight variation
      const variation = (Math.random() - 0.5) * 0.1; // ±0.05 variation
      this.currentRate = 56.25 + variation;
      this.source = 'Mock';
      this.lastUpdate = new Date();
      
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Keep current rate on error
    } finally {
      this.isUpdating = false;
    }
    
    return this.currentRate;
  }

  getCurrentRate() {
    return {
      rate: this.currentRate,
      lastUpdate: this.lastUpdate,
      source: this.source
    };
  }

  startAutoUpdate(interval = 300000) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      this.fetchRate();
    }, interval);
    
    // Initial fetch
    this.fetchRate();
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  setUpdateInterval(interval) {
    this.startAutoUpdate(interval);
  }
}

export const ExchangeRateService = new ExchangeRateServiceClass();