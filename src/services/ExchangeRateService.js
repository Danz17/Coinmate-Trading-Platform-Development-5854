import { SupabaseService } from './SupabaseService';

class ExchangeRateServiceClass {
  constructor() {
    this.rates = null;
    this.baseCurrency = 'USD';
    this.lastUpdated = null;
    this.isInitialized = false;
  }

  /**
   * Initialize exchange rate service
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      await this.loadRates();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing exchange rate service:', error);
      return false;
    }
  }

  /**
   * Load exchange rates from database
   */
  async loadRates() {
    try {
      const rates = await SupabaseService.getExchangeRates();
      
      if (rates) {
        this.rates = rates.rates;
        this.baseCurrency = rates.base || 'USD';
        this.lastUpdated = rates.timestamp || new Date().toISOString();
      } else {
        // Use fallback rates if none available
        this.rates = this.getFallbackRates();
        this.baseCurrency = 'USD';
        this.lastUpdated = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error loading exchange rates:', error);
      
      // Use fallback rates if error
      this.rates = this.getFallbackRates();
      this.baseCurrency = 'USD';
      this.lastUpdated = new Date().toISOString();
    }
  }

  /**
   * Get fallback exchange rates
   * @returns {Object} - Fallback rates
   */
  getFallbackRates() {
    return {
      USD: 1,
      EUR: 0.85,
      GBP: 0.75,
      JPY: 110.0,
      CAD: 1.25,
      AUD: 1.35,
      CHF: 0.92,
      CNY: 6.45,
      INR: 74.5,
      PHP: 50.5,
      SGD: 1.35,
      MYR: 4.2,
      THB: 33.0,
      KRW: 1150.0,
      IDR: 14500.0
    };
  }

  /**
   * Get all exchange rates
   * @returns {Object} - Exchange rates
   */
  getAllRates() {
    return {
      rates: this.rates || this.getFallbackRates(),
      base: this.baseCurrency,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Get exchange rate for currency
   * @param {string} currency - Currency code
   * @returns {number} - Exchange rate
   */
  getRate(currency) {
    if (!this.rates) {
      this.rates = this.getFallbackRates();
    }
    
    return this.rates[currency] || 1;
  }

  /**
   * Convert amount from one currency to another
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} - Converted amount
   */
  convert(amount, fromCurrency, toCurrency) {
    if (!this.rates) {
      this.rates = this.getFallbackRates();
    }
    
    // If currencies are the same, return original amount
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    const fromRate = this.getRate(fromCurrency);
    const toRate = this.getRate(toCurrency);
    
    // Convert to base currency, then to target currency
    const amountInBase = amount / fromRate;
    const amountInTarget = amountInBase * toRate;
    
    return amountInTarget;
  }

  /**
   * Format amount with currency symbol
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} - Formatted amount
   */
  formatCurrency(amount, currency = 'USD') {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Get supported currencies
   * @returns {Array} - Array of supported currency objects
   */
  getSupportedCurrencies() {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
      { code: 'THB', name: 'Thai Baht', symbol: '฿' },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
      { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' }
    ];
  }

  /**
   * Get currency symbol
   * @param {string} currencyCode - Currency code
   * @returns {string} - Currency symbol
   */
  getCurrencySymbol(currencyCode) {
    const currency = this.getSupportedCurrencies().find(c => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
  }

  /**
   * Get currency name
   * @param {string} currencyCode - Currency code
   * @returns {string} - Currency name
   */
  getCurrencyName(currencyCode) {
    const currency = this.getSupportedCurrencies().find(c => c.code === currencyCode);
    return currency ? currency.name : currencyCode;
  }

  /**
   * Get last updated timestamp
   * @returns {string} - Last updated timestamp
   */
  getLastUpdated() {
    return this.lastUpdated;
  }

  /**
   * Format last updated date
   * @returns {string} - Formatted date
   */
  formatLastUpdated() {
    try {
      const date = new Date(this.lastUpdated);
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting last updated date:', error);
      return this.lastUpdated || 'Unknown';
    }
  }

  /**
   * Check if rates are stale (older than 24 hours)
   * @returns {boolean} - Whether rates are stale
   */
  areRatesStale() {
    if (!this.lastUpdated) return true;
    
    try {
      const lastUpdated = new Date(this.lastUpdated);
      const now = new Date();
      
      // Calculate difference in hours
      const diffHours = (now - lastUpdated) / (1000 * 60 * 60);
      
      return diffHours > 24;
    } catch (error) {
      console.error('Error checking if rates are stale:', error);
      return true;
    }
  }
}

export const ExchangeRateService = new ExchangeRateServiceClass();