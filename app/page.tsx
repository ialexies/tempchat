'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('[LoginPage] Component mounted, checking auth status...');
    // Check if already logged in
    fetch('/api/auth/check', {
      credentials: 'include', // Ensure cookies are sent
    })
      .then(res => {
        console.log('[LoginPage] Auth check response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('[LoginPage] Auth check response data:', data);
        // Check if user is authenticated
        if (data?.authenticated && data?.username) {
          console.log('[LoginPage] User already authenticated, redirecting to chat...');
          router.push('/chat');
        } else {
          console.log('[LoginPage] User not authenticated, showing login form');
        }
      })
      .catch((err) => {
        console.error('[LoginPage] Auth check error:', err);
        // Network error or other issue, silently ignore
        // User is not logged in, stay on login page
      });
  }, [router]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('[LoginPage] State updated - username:', username, 'password length:', password.length, 'loading:', loading, 'error:', error);
  }, [username, password, loading, error]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log('[LoginPage] handleSubmit called');
    console.log('[LoginPage] Event type:', e.type);
    console.log('[LoginPage] Event target:', e.target);
    console.log('[LoginPage] Current username:', username);
    console.log('[LoginPage] Current password length:', password.length);
    
    // Prevent default form submission
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[LoginPage] After preventDefault, proceeding with login logic');
    
    console.log('[LoginPage] Setting error to empty and loading to true');
    setError('');
    setLoading(true);

    // Validate inputs
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    console.log('[LoginPage] Validating inputs - username length:', trimmedUsername.length, 'password length:', trimmedPassword.length);
    
    if (!trimmedUsername || !trimmedPassword) {
      const errorMsg = 'Please enter both username and password';
      console.log('[LoginPage] Validation failed:', errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    console.log('[LoginPage] Validation passed, making API call...');
    console.log('[LoginPage] Request body:', { username: trimmedUsername, password: '***' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password }),
        credentials: 'include', // Ensure cookies are sent
      });

      console.log('[LoginPage] API response status:', response.status);
      console.log('[LoginPage] API response ok:', response.ok);
      console.log('[LoginPage] API response headers:', Object.fromEntries(response.headers.entries()));

      let data;
      try {
        data = await response.json();
        console.log('[LoginPage] API response data:', data);
      } catch (jsonError) {
        console.error('[LoginPage] Failed to parse JSON response:', jsonError);
        const errorMsg = 'Invalid response from server. Please try again.';
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (response.ok) {
        console.log('[LoginPage] Login successful! Redirecting to chat...');
        // Success - redirect to chat
        router.push('/chat');
        console.log('[LoginPage] Router.push called');
        // Don't set loading to false here as we're navigating away
      } else {
        const errorMsg = data.error || data.message || 'Login failed';
        console.error('[LoginPage] Login failed:', errorMsg);
        setError(errorMsg);
        setLoading(false);
      }
    } catch (err) {
      console.error('[LoginPage] Network/request error:', err);
      console.error('[LoginPage] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-indigo-50 px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-large w-full max-w-md animate-fade-in">
        {/* Logo/Title Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 mb-4 shadow-medium">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">TempChat</h1>
          <p className="text-sm sm:text-base text-gray-500">Sign in to continue</p>
        </div>

        <form 
          onSubmit={(e) => {
            console.log('[LoginPage] Form onSubmit event triggered');
            handleSubmit(e);
          }}
          className="space-y-5 sm:space-y-6" 
          noValidate 
          action="#" 
          method="post"
        >
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                console.log('[LoginPage] Username changed:', e.target.value);
                setUsername(e.target.value);
              }}
              className="w-full px-4 py-3 border border-chat-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm sm:text-base transition-all shadow-soft focus:shadow-medium"
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  console.log('[LoginPage] Password changed, length:', e.target.value.length);
                  setPassword(e.target.value);
                }}
                className="w-full px-4 py-3 pr-12 border border-chat-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm sm:text-base transition-all shadow-soft focus:shadow-medium"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-1 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L12 12m-5.71-5.71L12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2 animate-fade-in">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            onClick={(e) => {
              console.log('[LoginPage] Login button clicked');
              console.log('[LoginPage] Button disabled state:', loading);
              console.log('[LoginPage] Current username:', username);
              console.log('[LoginPage] Current password length:', password.length);
            }}
            className="w-full bg-primary-600 text-white py-3 sm:py-3.5 px-4 rounded-xl hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-medium hover:shadow-large font-semibold text-sm sm:text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

