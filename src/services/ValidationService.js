class ValidationServiceClass {
  /**
   * Validate required field
   * @param {*} value - Field value
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} - Error message or null if valid
   */
  required(value, fieldName = 'Field') {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  }

  /**
   * Validate email format
   * @param {string} value - Email to validate
   * @returns {string|null} - Error message or null if valid
   */
  email(value) {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  /**
   * Validate minimum length
   * @param {string} value - Value to validate
   * @param {number} length - Minimum length
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} - Error message or null if valid
   */
  minLength(value, length, fieldName = 'Field') {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    if (value.length < length) {
      return `${fieldName} must be at least ${length} characters`;
    }
    return null;
  }

  /**
   * Validate maximum length
   * @param {string} value - Value to validate
   * @param {number} length - Maximum length
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} - Error message or null if valid
   */
  maxLength(value, length, fieldName = 'Field') {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    if (value.length > length) {
      return `${fieldName} must be no more than ${length} characters`;
    }
    return null;
  }

  /**
   * Validate numeric value
   * @param {*} value - Value to validate
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} - Error message or null if valid
   */
  numeric(value, fieldName = 'Field') {
    if (!value && value !== 0) return null; // Skip if empty (use required validation separately)
    
    if (isNaN(Number(value))) {
      return `${fieldName} must be a number`;
    }
    return null;
  }

  /**
   * Validate integer value
   * @param {*} value - Value to validate
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} - Error message or null if valid
   */
  integer(value, fieldName = 'Field') {
    if (!value && value !== 0) return null; // Skip if empty (use required validation separately)
    
    if (!Number.isInteger(Number(value))) {
      return `${fieldName} must be an integer`;
    }
    return null;
  }

  /**
   * Validate minimum value
   * @param {number} value - Value to validate
   * @param {number} min - Minimum value
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} - Error message or null if valid
   */
  min(value, min, fieldName = 'Field') {
    if (!value && value !== 0) return null; // Skip if empty (use required validation separately)
    
    if (Number(value) < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  }

  /**
   * Validate maximum value
   * @param {number} value - Value to validate
   * @param {number} max - Maximum value
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} - Error message or null if valid
   */
  max(value, max, fieldName = 'Field') {
    if (!value && value !== 0) return null; // Skip if empty (use required validation separately)
    
    if (Number(value) > max) {
      return `${fieldName} must be no more than ${max}`;
    }
    return null;
  }

  /**
   * Validate URL format
   * @param {string} value - URL to validate
   * @returns {string|null} - Error message or null if valid
   */
  url(value) {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    try {
      new URL(value);
      return null;
    } catch (error) {
      return 'Please enter a valid URL';
    }
  }

  /**
   * Validate date format
   * @param {string} value - Date to validate
   * @returns {string|null} - Error message or null if valid
   */
  date(value) {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    return null;
  }

  /**
   * Validate password
   * @param {string} value - Password to validate
   * @param {Object} options - Validation options
   * @returns {string|null} - Error message or null if valid
   */
  password(value, options = {}) {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = false
    } = options;
    
    const errors = [];
    
    if (value.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (requireUppercase && !/[A-Z]/.test(value)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (requireLowercase && !/[a-z]/.test(value)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (requireNumbers && !/[0-9]/.test(value)) {
      errors.push('Password must contain at least one number');
    }
    
    if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors.length > 0 ? errors.join(', ') : null;
  }

  /**
   * Validate password confirmation
   * @param {string} value - Password confirmation
   * @param {string} password - Original password
   * @returns {string|null} - Error message or null if valid
   */
  passwordConfirmation(value, password) {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    if (value !== password) {
      return 'Passwords do not match';
    }
    return null;
  }

  /**
   * Validate alphanumeric value
   * @param {string} value - Value to validate
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} - Error message or null if valid
   */
  alphanumeric(value, fieldName = 'Field') {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      return `${fieldName} must contain only letters and numbers`;
    }
    return null;
  }

  /**
   * Validate alphabetic value
   * @param {string} value - Value to validate
   * @param {string} fieldName - Field name for error message
   * @returns {string|null} - Error message or null if valid
   */
  alphabetic(value, fieldName = 'Field') {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    if (!/^[a-zA-Z]+$/.test(value)) {
      return `${fieldName} must contain only letters`;
    }
    return null;
  }

  /**
   * Validate phone number
   * @param {string} value - Phone number to validate
   * @returns {string|null} - Error message or null if valid
   */
  phone(value) {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    // Simple phone validation (at least 10 digits)
    if (!/^\+?[\d\s\-()]{10,}$/.test(value)) {
      return 'Please enter a valid phone number';
    }
    return null;
  }

  /**
   * Validate zipcode
   * @param {string} value - Zipcode to validate
   * @returns {string|null} - Error message or null if valid
   */
  zipcode(value) {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    // Basic zipcode validation (5 digits, or 5+4 format)
    if (!/^\d{5}(-\d{4})?$/.test(value)) {
      return 'Please enter a valid zipcode';
    }
    return null;
  }

  /**
   * Validate credit card number
   * @param {string} value - Credit card number to validate
   * @returns {string|null} - Error message or null if valid
   */
  creditCard(value) {
    if (!value) return null; // Skip if empty (use required validation separately)
    
    // Remove spaces and dashes
    const cardNumber = value.replace(/[\s-]/g, '');
    
    // Check if all characters are digits
    if (!/^\d+$/.test(cardNumber)) {
      return 'Credit card number must contain only digits';
    }
    
    // Check length (13-19 digits)
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return 'Credit card number must be between 13 and 19 digits';
    }
    
    // Luhn algorithm for card number validation
    let sum = 0;
    let double = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      
      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      double = !double;
    }
    
    if (sum % 10 !== 0) {
      return 'Please enter a valid credit card number';
    }
    
    return null;
  }

  /**
   * Validate form fields
   * @param {Object} values - Form values
   * @param {Object} validations - Validation rules
   * @returns {Object} - Validation errors
   */
  validateForm(values, validations) {
    const errors = {};
    
    Object.keys(validations).forEach(field => {
      const value = values[field];
      const fieldValidations = validations[field];
      
      if (typeof fieldValidations === 'string') {
        // Single validation
        const error = this[fieldValidations](value, field);
        if (error) {
          errors[field] = error;
        }
      } else if (Array.isArray(fieldValidations)) {
        // Multiple validations
        for (const validation of fieldValidations) {
          let error;
          
          if (typeof validation === 'string') {
            error = this[validation](value, field);
          } else if (typeof validation === 'object') {
            const { rule, args = [], message } = validation;
            const validationArgs = [value, ...args, field];
            const validationError = this[rule](...validationArgs);
            
            if (validationError) {
              error = message || validationError;
            }
          }
          
          if (error) {
            errors[field] = error;
            break;
          }
        }
      } else if (typeof fieldValidations === 'object') {
        // Validation with args
        const { rule, args = [], message } = fieldValidations;
        const validationArgs = [value, ...args, field];
        const error = this[rule](...validationArgs);
        
        if (error) {
          errors[field] = message || error;
        }
      }
    });
    
    return errors;
  }
}

export const ValidationService = new ValidationServiceClass();