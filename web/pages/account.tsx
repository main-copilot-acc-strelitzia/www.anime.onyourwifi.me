export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';
import PasswordChangeModal from '@/components/PasswordChangeModal';
import PasswordStrength from '@/components/PasswordStrength';

export default function Account() {
  const { currentTheme } = useTheme();
  const { addToast } = useToast();
  const [profile, setProfile] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  React.useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        setProfile(j.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load profile');
        setLoading(false);
      });
  }, []);

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      addToast('Passwords do not match', 'error');
      return;
    }

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      });

      if (response.ok) {
        addToast('Password changed successfully', 'success');
        setShowPasswordModal(false);
        setPasswordForm({ current: '', new: '', confirm: '' });
      } else {
        addToast('Failed to change password', 'error');
      }
    } catch (err) {
      addToast('Error changing password', 'error');
    }
  };

  return (
    <div style={{ backgroundColor: currentTheme.colors.background, minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8 fade-in">
          <h1 className="text-4xl font-bold mb-2" style={{ color: currentTheme.colors.text }}>
            Account Settings
          </h1>
          <p style={{ color: currentTheme.colors.text }} className="opacity-75">
            Manage your account and security preferences
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {loading ? (
          <LoadingSpinner />
        ) : profile ? (
          <div className="space-y-6 fade-in">
            {/* Profile Information */}
            <Card title="👤 Profile Information">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{
                      backgroundColor: currentTheme.colors.sidebar,
                      color: currentTheme.colors.text,
                      borderColor: currentTheme.colors.border,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
                      Account Role
                    </label>
                    <div
                      className="px-4 py-3 rounded-lg inline-block font-semibold"
                      style={{
                        backgroundColor: currentTheme.colors.primary,
                        color: currentTheme.colors.sidebar,
                      }}
                    >
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
                      Account Status
                    </label>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: profile.isActive ? currentTheme.colors.secondary : '#ef4444' }}
                      ></div>
                      <span style={{ color: currentTheme.colors.text }} className="font-semibold">
                        {profile.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Security Section */}
            <Card title="🔒 Security">
              <div className="space-y-4">
                <p style={{ color: currentTheme.colors.text }} className="text-sm">
                  Keep your account secure by regularly updating your password.
                </p>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-6 py-3 rounded-lg font-semibold transition btn-hover-lift"
                  style={{
                    backgroundColor: currentTheme.colors.primary,
                    color: currentTheme.colors.sidebar,
                  }}
                >
                  Change Password
                </button>
              </div>
            </Card>

            {/* Account Activity */}
            <Card title="📊 Account Activity">
              <div className="space-y-3">
                <div
                  className="p-3 rounded-lg flex justify-between items-center"
                  style={{ backgroundColor: currentTheme.colors.sidebar }}
                >
                  <span style={{ color: currentTheme.colors.text }} className="text-sm">
                    Last login: <span className="font-semibold">2 hours ago</span>
                  </span>
                  <span style={{ color: currentTheme.colors.secondary }}>✓</span>
                </div>
                <div
                  className="p-3 rounded-lg flex justify-between items-center"
                  style={{ backgroundColor: currentTheme.colors.sidebar }}
                >
                  <span style={{ color: currentTheme.colors.text }} className="text-sm">
                    Active sessions: <span className="font-semibold">1</span>
                  </span>
                  <span style={{ color: currentTheme.colors.secondary }}>✓</span>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Alert type="error" message="No profile data available" />
        )}
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        passwordForm={passwordForm}
        onPasswordFormChange={setPasswordForm}
        onConfirm={handlePasswordChange}
        onCancel={() => setShowPasswordModal(false)}
      />
    </div>
  );
}