'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  isAdmin: boolean;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    isAdmin: false,
  });

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    try {
      // Check if user is admin
      const checkResponse = await fetch('/api/admin/check');
      const checkData = await checkResponse.json();

      if (!checkResponse.ok || !checkData.isAdmin) {
        router.push('/chat');
        return;
      }

      setIsAdmin(true);
      await loadUsers();
    } catch (err) {
      console.error('Error checking admin status:', err);
      router.push('/chat');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowAddForm(false);
        setFormData({ username: '', password: '', isAdmin: false });
        await loadUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Failed to create user');
    }
  };

  const handleUpdateUser = async (username: string, updates: { password?: string; isAdmin?: boolean }) => {
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          ...updates,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEditingUser(null);
        await loadUsers();
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    setError('');

    try {
      const response = await fetch(`/api/admin/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await loadUsers();
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/chat')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Back to Chat
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {showAddForm ? 'Cancel' : 'Add User'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Add New User</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                    minLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={formData.isAdmin}
                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">
                    Admin User
                  </label>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create User
                </button>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Username</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.username} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {user.username}
                      {user.isAdmin && (
                        <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {user.isAdmin ? 'Admin' : 'User'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {editingUser === user.username ? (
                        <EditUserForm
                          user={user}
                          onSave={(updates) => handleUpdateUser(user.username, updates)}
                          onCancel={() => setEditingUser(null)}
                        />
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingUser(user.username)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.username)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditUserForm({
  user,
  onSave,
  onCancel,
}: {
  user: User;
  onSave: (updates: { password?: string; isAdmin?: boolean }) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: { password?: string; isAdmin?: boolean } = {};
    if (password) {
      updates.password = password;
    }
    if (isAdmin !== user.isAdmin) {
      updates.isAdmin = isAdmin;
    }
    if (Object.keys(updates).length > 0) {
      onSave(updates);
    } else {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <input
          type="password"
          placeholder="New password (leave empty to keep current)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          minLength={6}
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={`admin-${user.username}`}
          checked={isAdmin}
          onChange={(e) => setIsAdmin(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor={`admin-${user.username}`} className="text-sm">
          Admin
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

