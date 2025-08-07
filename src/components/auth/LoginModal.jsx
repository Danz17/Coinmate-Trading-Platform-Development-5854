import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '@/components/common/SafeIcon';
import supabase from '../../lib/supabase';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // login or signup
  const [name, setName] = useState('');

  useEffect(() => {
    // Reset form when modal opens/closes
    if (isOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setError('');
      setMode('login');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        // Login with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        // Get user profile data
        const { data: userData, error: userError } = await supabase
          .from('users_ft2024')
          .select('*')
          .eq('email', email)
          .single();

        if (userError) throw userError;

        onLogin({
          id: data.user.id,
          email: data.user.email,
          name: userData.name,
          role: userData.role || 'user'
        });
      } else {
        // Signup with Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) throw error;

        // Create user profile
        const { data: userData, error: userError } = await supabase
          .from('users_ft2024')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              name: name,
              role: 'user',
              bank_balances: {}
            }
          ])
          .select();

        if (userError) throw userError;

        // Auto-login after signup
        onLogin({
          id: data.user.id,
          email: data.user.email,
          name: name,
          role: 'user'
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  // For development/testing only - quick login options
  const quickLoginOptions = [
    { name: 'Admin User', email: 'admin@example.com', password: 'password123', role: 'admin' },
    { name: 'Regular User', email: 'user@example.com', password: 'password123', role: 'user' },
    { name: 'Super Admin', email: 'super@example.com', password: 'password123', role: 'super_admin' }
  ];

  const handleQuickLogin = async (option) => {
    setEmail(option.email);
    setPassword(option.password);
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users_ft2024')
      .select('*')
      .eq('email', option.email)
      .single();
    
    if (!existingUser) {
      // Create user if doesn't exist
      try {
        // Create auth user
        const { data, error } = await supabase.auth.signUp({
          email: option.email,
          password: option.password
        });
        
        if (error) throw error;
        
        // Create profile
        await supabase
          .from('users_ft2024')
          .insert([
            {
              id: data.user.id,
              email: option.email,
              name: option.name,
              role: option.role,
              bank_balances: {}
            }
          ]);
      } catch (error) {
        console.error('Error creating test user:', error);
        setError('Failed to create test user');
        return;
      }
    }
    
    // Now login
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: option.email,
        password: option.password
      });
      
      if (error) throw error;
      
      // Get user data
      const { data: userData } = await supabase
        .from('users_ft2024')
        .select('*')
        .eq('email', option.email)
        .single();
      
      onLogin({
        id: data.user.id,
        email: data.user.email,
        name: userData.name,
        role: userData.role
      });
    } catch (error) {
      console.error('Quick login error:', error);
      setError('Quick login failed');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">BaryaBazaar</h1>
              <p className="text-sm text-gray-500 mt-1">SaaS P2P Trading Platform</p>
            </div>
            
            <h2 className="text-xl font-semibold mb-6 text-center">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-start">
                <SafeIcon icon={FiIcons.FiAlertCircle} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">
                      <SafeIcon icon={FiIcons.FiUser} />
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required={mode === 'signup'}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <SafeIcon icon={FiIcons.FiMail} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <SafeIcon icon={FiIcons.FiLock} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'login' ? 'Your password' : 'Create a password'}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <SafeIcon icon={FiIcons.FiLoader} className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : mode === 'login' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            </div>
            
            {/* Quick Login Options (for development only) */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2 text-center">Quick Login Options (Development Only)</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickLoginOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickLogin(option)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    {option.role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LoginModal;