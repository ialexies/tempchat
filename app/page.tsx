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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">TempChat</h1>
        <form 
          onSubmit={(e) => {
            console.log('[LoginPage] Form onSubmit event triggered');
            handleSubmit(e);
          }}
          className="space-y-4" 
          noValidate 
          action="#" 
          method="post"
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
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
            <div className="text-red-600 text-sm text-center">{error}</div>
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
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

