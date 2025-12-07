import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, updateData, updateColumns, createBackup } from './api';
import { InventoryGrid } from './components/InventoryGrid';
import { Login } from './components/Login';
import { UserManager } from './components/UserManager';
import ChangePassword from './components/ChangePassword';
import { Loader2, Key } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showUserManager, setShowUserManager] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoadingAuth(false);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchData,
    enabled: !!user, // Only fetch if user is logged in
  });

  const mutation = useMutation({
    mutationFn: ({ type, row, column }) => {
      if (type === 'COLUMN_ADD') {
        return updateColumns('ADD', column);
      }
      return updateData(type, row);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loadingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-red-500">
        Error loading data. Please check if the server is running.
        <button onClick={() => window.location.reload()} className="ml-4 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-zinc-400 mt-1">Logged in as: <span className="text-white font-medium">{user.username} ({user.role})</span></p>
        </div>
        <div className="flex gap-3 items-center">
          {user.role === 'ADMIN' && (
            <button
              onClick={() => setShowUserManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
              title="Manage users"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Manage Users
            </button>
          )}
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
            title="Change password"
          >
            <Key size={18} />
            Cambiar Contraseña
          </button>
          <button
            onClick={async () => {
              try {
                const response = await createBackup(user.username);
                // Create download link
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;

                // Get filename from header or default
                const contentDisposition = response.headers['content-disposition'];
                let filename = `backup_${new Date().toISOString()}.csv`;
                if (contentDisposition) {
                  // Match filename="value" or filename=value
                  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                  if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                  }
                }

                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              } catch (e) {
                console.error(e);
                alert('Error downloading backup');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
            title="Download backup CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Backup
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Logout
          </button>
        </div>
      </header>

      {showUserManager && (
        <UserManager onClose={() => setShowUserManager(false)} />
      )}

      {showChangePassword && (
        <ChangePassword
          onClose={() => setShowChangePassword(false)}
          username={user.username}
        />
      )}

      <main>
        <InventoryGrid
          data={data?.inventory || []}
          columns={data?.columns || []}
          onUpdate={(type, data) => {
            if (type === 'COLUMN_ADD') {
              mutation.mutate({ type, column: data });
            } else {
              mutation.mutate({ type, row: data });
            }
          }}
          role={user.role}
          username={user.username}
        />
      </main>
    </div>
  );
}

export default App;

