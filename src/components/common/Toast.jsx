import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Toast container component for displaying notifications
 * Uses react-toastify for toast notifications
 */
const Toast = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      className="z-50"
    />
  );
};

// Singleton toast manager used across the app
export const toastManager = {
  success(message, options = {}) {
    return toast.success(message, options);
  },
  error(message, options = {}) {
    return toast.error(message, options);
  },
  info(message, options = {}) {
    return toast.info(message, options);
  },
  warn(message, options = {}) {
    return toast.warn(message, options);
  }
};

export default Toast;