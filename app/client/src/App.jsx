import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, updateData, updateColumns, createBackup } from './api';
import { InventoryGrid } from './components/InventoryGrid';
import { Login } from './components/Login';
import { Loader2 } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
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
          <button
            onClick={async () => {
              try {
                const res = await createBackup(user.username);
                if (res.success) {
                  alert(`Backup created successfully!\nFile: ${res.file}`);
                }
              } catch (e) {
                alert('Error creating backup: ' + (e.response?.data?.error || e.message));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
            title="Create backup of CSV files"
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
        />
      </main>
    </div>
  );
}

export default App;

