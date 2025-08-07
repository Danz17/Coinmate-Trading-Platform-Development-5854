import { createClient } from '@supabase/supabase-js';

// Supabase connection details
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Validate the environment variables
const isValidConfig = () => {
  if (!SUPABASE_URL || SUPABASE_URL === 'https://your-project-id.supabase.co') {
    console.error('Missing Supabase URL. Set VITE_SUPABASE_URL in your environment variables.');
    return false;
  }
  
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your-anon-key') {
    console.error('Missing Supabase Anon Key. Set VITE_SUPABASE_ANON_KEY in your environment variables.');
    return false;
  }
  
  return true;
};

// Create Supabase client with options
const createSupabaseClient = () => {
  if (!isValidConfig()) {
    // Return a mock client in development to prevent crashes
    if (import.meta.env.DEV) {
      console.warn('Using mock Supabase client for development. API calls will fail.');
      return createMockClient();
    }
    
    throw new Error('Invalid Supabase configuration. Check your environment variables.');
  }
  
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-application-name': 'BaryaBazaar',
        'x-application-version': '1.5.0'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
};

// Create a mock client for development when config is missing
const createMockClient = () => {
  const mockError = new Error('Supabase mock client - real API unavailable');
  
  const mockResponse = (data = null) => ({
    data,
    error: mockError,
    status: 400,
    statusText: 'Bad Request',
    count: null
  });
  
  return {
    from: () => ({
      select: () => Promise.resolve(mockResponse()),
      insert: () => Promise.resolve(mockResponse()),
      update: () => Promise.resolve(mockResponse()),
      delete: () => Promise.resolve(mockResponse()),
      eq: () => ({
        single: () => Promise.resolve(mockResponse()),
        select: () => Promise.resolve(mockResponse())
      })
    }),
    auth: {
      signUp: () => Promise.resolve(mockResponse()),
      signIn: () => Promise.resolve(mockResponse()),
      signOut: () => Promise.resolve(mockResponse()),
      getUser: () => Promise.resolve(mockResponse()),
      onAuthStateChange: () => ({ data: null, error: mockError })
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve(mockResponse()),
        download: () => Promise.resolve(mockResponse()),
        getPublicUrl: () => ({ data: { publicUrl: '' }, error: mockError })
      })
    },
    rpc: () => Promise.resolve(mockResponse())
  };
};

// Create and export the Supabase client
const supabase = createSupabaseClient();

// Log connection status
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error.message);
  } else {
    console.log('Supabase: Connected');
  }
});

export default supabase;