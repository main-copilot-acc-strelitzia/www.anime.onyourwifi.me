import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';

interface AdminIP {
  id: string;
  ipAddress: string;
  userId: string;
  userName: string;
  addedAt: string;
  isMainAdmin: boolean;
  lastAccessed?: string;
}

export default function AdminSecurityPage() {
  const { currentTheme } = useTheme();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminIP[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminIP, setNewAdminIP] = useState('');
  const [currentUserIP, setCurrentUserIP] = useState<string>('');

  useEffect(() => {
    fetchAdminIPs();
    getCurrentUserIP();
  }, []);

  const getCurrentUserIP = async () => {
    try {
      const response = await fetch('/api/admin/my-ip', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUserIP(data.ip);
      }
    } catch (error) {
      console.error('Failed to get current IP:', error);
    }
  };

  const fetchAdminIPs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ips', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.data || []);
      } else {
        addToast('Failed to fetch admin IPs', 'error');
      }
    } catch (error) {
      addToast('Error fetching admin IPs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdminIP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAdminEmail || !newAdminIP) {
      addToast('Email and IP address are required', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: newAdminEmail,
          ipAddress: newAdminIP,
        }),
      });

      if (response.ok) {
        addToast('Admin IP added successfully', 'success');
        setNewAdminEmail('');
        setNewAdminIP('');
        fetchAdminIPs();
      } else {
        const error = await response.json();
        addToast(error.message || 'Failed to add admin IP', 'error');
      }
    } catch (error) {
      addToast('Error adding admin IP', 'error');
    }
  };

  const handleRemoveAdminIP = async (ipId: string) => {
    if (!window.confirm('Remove this admin IP? They will no longer have access to the admin panel.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ips/${ipId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        addToast('Admin IP removed', 'success');
        fetchAdminIPs();
      } else {
        addToast('Failed to remove admin IP', 'error');
      }
    } catch (error) {
      addToast('Error removing admin IP', 'error');
    }
  };

  const bgColor = currentTheme === 'leblanc' ? 'bg-slate-800' : currentTheme === 'luffy' ? 'bg-red-900' : 'bg-white';
  const textColor =
    currentTheme === 'leblanc' ? 'text-slate-100' : currentTheme === 'luffy' ? 'text-red-50' : 'text-gray-900';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin IP Whitelist</h1>
          <p className="opacity-75">Manage which IP addresses have access to the admin panel</p>
        </div>

        {/* Current User IP */}
        <div className={`p-4 rounded-lg ${bgColor} border`}>
          <p className="text-sm opacity-75">Your Current IP Address:</p>
          <p className="text-xl font-mono font-bold">{currentUserIP || 'Loading...'}</p>
        </div>

        {/* Add New Admin */}
        <div className={`p-6 rounded-lg ${bgColor}`}>
          <h2 className="text-2xl font-bold mb-4">Add New Admin</h2>
          <form onSubmit={handleAddAdminIP} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">User Email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    currentTheme === 'leblanc'
                      ? 'bg-slate-700 border-slate-600'
                      : currentTheme === 'luffy'
                        ? 'bg-red-800 border-red-700'
                        : 'bg-gray-100 border-gray-300'
                  } ${textColor}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">IP Address</label>
                <input
                  type="text"
                  value={newAdminIP}
                  onChange={(e) => setNewAdminIP(e.target.value)}
                  placeholder="192.168.1.100"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    currentTheme === 'leblanc'
                      ? 'bg-slate-700 border-slate-600'
                      : currentTheme === 'luffy'
                        ? 'bg-red-800 border-red-700'
                        : 'bg-gray-100 border-gray-300'
                  } ${textColor}`}
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
                currentTheme === 'leblanc'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : currentTheme === 'luffy'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              Add Admin IP
            </button>
          </form>
        </div>

        {/* Admin IPs List */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className={`p-6 rounded-lg ${bgColor}`}>
            <h2 className="text-2xl font-bold mb-4">Current Admins ({admins.length})</h2>

            {admins.length > 0 ? (
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className={`p-4 rounded-lg border ${
                      currentTheme === 'leblanc'
                        ? 'border-slate-600 bg-slate-700'
                        : currentTheme === 'luffy'
                          ? 'border-red-700 bg-red-800'
                          : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{admin.userName}</span>
                          {admin.isMainAdmin && <span className="text-yellow-400 text-xs">👑 Main Admin</span>}
                        </div>
                        <p className="text-sm opacity-75">{admin.id}</p>
                      </div>

                      {!admin.isMainAdmin && (
                        <button
                          onClick={() => handleRemoveAdminIP(admin.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="opacity-75">IP Address</p>
                        <p className="font-mono font-semibold">{admin.ipAddress}</p>
                      </div>
                      <div>
                        <p className="opacity-75">Added</p>
                        <p className="text-sm">{new Date(admin.addedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {admin.lastAccessed && (
                      <p className="text-xs opacity-50 mt-2">Last accessed: {new Date(admin.lastAccessed).toLocaleString()}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Alert type="info" message="No admin IPs configured yet" />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
