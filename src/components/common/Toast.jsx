import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCheck, FiX, FiAlertCircle, FiInfo, FiRefreshCw } = FiIcons;

class ToastManager {
  constructor() {
    this.toasts = [];
    this.subscribers = new Set();
    this.idCounter = 0;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(callback => callback([...this.toasts]));
  }

  show(message, type = 'info', options = {}) {
    const toast = {
      id: ++this.idCounter,
      message,
      type,
      duration: options.duration || 5000,
      action: options.action,
      timestamp: Date.now(),
      ...options
    };

    this.toasts.push(toast);
    this.notify();

    if (toast.duration > 0) {
      setTimeout(() => this.remove(toast.id), toast.duration);
    }

    return toast.id;
  }

  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', { duration: 7000, ...options });
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  remove(id) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

const Toast = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return FiCheck;
      case 'error': return FiX;
      case 'warning': return FiAlertCircle;
      default: return FiInfo;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      className={`max-w-md w-full border rounded-lg shadow-lg p-4 ${getColors()}`}
    >
      <div className="flex items-start space-x-3">
        <SafeIcon icon={getIcon()} className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.message}</p>
          {toast.action && (
            <div className="mt-2 flex space-x-2">
              {toast.action.label && (
                <button
                  onClick={toast.action.onClick}
                  className="text-xs font-medium underline hover:no-underline"
                >
                  {toast.action.label}
                </button>
              )}
              {toast.action.retry && (
                <button
                  onClick={toast.action.retry}
                  className="text-xs font-medium underline hover:no-underline flex items-center space-x-1"
                >
                  <SafeIcon icon={FiRefreshCw} className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <SafeIcon icon={FiX} className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={toastManager.remove.bind(toastManager)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;