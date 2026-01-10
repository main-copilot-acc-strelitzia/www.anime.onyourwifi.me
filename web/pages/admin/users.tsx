import AdminLayout from '@/components/admin/AdminLayout';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';

export default function UsersPage() {
  const { currentTheme } = useTheme();
  const [users, setUsers] = React.useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/users', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        const data = j.data || [];
        setUsers(data);
        setFilteredUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load users');
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    const filtered = users.filter(
      (u) =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  return (
    <AdminLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4" style={{ color: currentTheme.colors.text }}>
            Users Management
          </h1>
          <input
            type="text"
            placeholder="Search users by email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded border"
            style={{
              backgroundColor: currentTheme.colors.background,
              color: currentTheme.colors.text,
              borderColor: currentTheme.colors.border,
            }}
          />
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table
              className="min-w-full border-collapse"
              style={{ backgroundColor: currentTheme.colors.background }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: currentTheme.colors.sidebar,
                    borderBottom: `2px solid ${currentTheme.colors.border}`,
                  }}
                >
                  <th
                    className="px-6 py-3 text-left font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Email
                  </th>
                  <th
                    className="px-6 py-3 text-left font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Role
                  </th>
                  <th
                    className="px-6 py-3 text-left font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u, idx) => (
                    <tr
                      key={u.id}
                      style={{
                        backgroundColor:
                          idx % 2 === 0
                            ? currentTheme.colors.background
                            : currentTheme.colors.sidebar,
                        borderBottom: `1px solid ${currentTheme.colors.border}`,
                      }}
                    >
                      <td
                        className="px-6 py-4"
                        style={{ color: currentTheme.colors.text }}
                      >
                        {u.email}
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ color: currentTheme.colors.primary }}
                      >
                        <span
                          className="px-3 py-1 rounded-full text-sm font-semibold"
                          style={{
                            backgroundColor: currentTheme.colors.primary,
                            color: currentTheme.colors.sidebar,
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: u.isActive
                                ? currentTheme.colors.secondary
                                : '#ef4444',
                            }}
                          ></div>
                          <span style={{ color: currentTheme.colors.text }}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center"
                      style={{ color: currentTheme.colors.text }}
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6" style={{ color: currentTheme.colors.text }}>
          <p className="text-sm">
            Total users: <span className="font-semibold">{filteredUsers.length}</span>
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}