import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, updateData } from './api';
import { RoleSelector } from './components/RoleSelector';
import { InventoryGrid } from './components/InventoryGrid';
import { TestGrid } from './components/TestGrid';
import { Loader2 } from 'lucide-react';

function App() {
  const [role, setRole] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchData,
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

  if (!role) {
    return <RoleSelector onSelect={setRole} />;
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
          <p className="text-zinc-400 mt-1">Logged in as: <span className="text-white font-medium">{role}</span></p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={async () => {
              try {
                const axios = (await import('axios')).default;
                const res = await axios.post('http://localhost:3001/api/backup', { username: role });
                if (res.data.success) {
                  alert(`Backup created successfully!\nFiles: ${res.data.files.join('\n')}`);
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
            onClick={() => setRole(null)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Change Role
          </button>
        </div>
      </header>

      <main>
        {/* Debug: Log data before passing to InventoryGrid */}
        {console.log('App.jsx - data object:', data)}
        {console.log('App.jsx - data?.inventory:', data?.inventory)}
        {console.log('App.jsx - data?.columns:', data?.columns)}

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
          role={role}
        />
      </main>
    </div>
  );
}

export default App;
