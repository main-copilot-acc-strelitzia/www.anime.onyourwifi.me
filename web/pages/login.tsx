import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import Card from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!email.trim()) {
      newErrors.push('Email is required');
    } else if (!email.includes('@')) {
      newErrors.push('Invalid email format');
    }

    if (!password) {
      newErrors.push('Password is required');
    } else if (password.length < 6) {
      newErrors.push('Password must be at least 6 characters');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        addToast(error.message || 'Login failed', 'error');
        return;
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      addToast('Login successful!', 'success');
      router.push('/account');
    } catch (error) {
      addToast('An error occurred during login', 'error');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#141414',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(229, 9, 20, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(244, 117, 33, 0.1) 0%, transparent 50%)',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <Card title="Sign In">
          <div style={{ padding: '30px' }}>
            {/* Header */}
            <h1
              style={{
                textAlign: 'center',
                color: '#e50914',
                marginBottom: '10px',
                fontSize: '28px',
                fontWeight: 'bold',
              }}
            >
              🎬 AnimeStream
            </h1>
            <p
              style={{
                textAlign: 'center',
                color: '#b3b3b3',
                marginBottom: '30px',
                opacity: 0.9,
              }}
            >
              Sign in to your account
            </p>

            {/* Form */}
            <form onSubmit={handleLogin}>
              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#fff',
                    fontWeight: '500',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #404040',
                    borderRadius: '6px',
                    backgroundColor: '#221f1f',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#fff',
                    fontWeight: '500',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #404040',
                    borderRadius: '6px',
                    backgroundColor: '#221f1f',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div
                  style={{
                    marginBottom: '20px',
                    padding: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                  }}
                >
                  {errors.map((error, idx) => (
                    <p
                      key={idx}
                      style={{
                        margin: '0',
                        color: '#fca5a5',
                        fontSize: '14px',
                      }}
                    >
                      • {error}
                    </p>
                  ))}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#e50914',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  marginBottom: '15px',
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? <LoadingSpinner /> : 'Sign In'}
              </button>
            </form>

            {/* Register Link */}
            <p
              style={{
                textAlign: 'center',
                color: '#b3b3b3',
                fontSize: '14px',
              }}
            >
              Don't have an account?{' '}
              <Link href="/register">
                <span
                  style={{
                    color: '#e50914',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Sign up
                </span>
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
