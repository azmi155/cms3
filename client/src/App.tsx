import * as React from 'react';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NetworkDashboard } from './components/network/NetworkDashboard';

function App() {
  React.useEffect(() => {
    console.log('App component mounted');
    
    // Test API connection
    fetch('/api/health')
      .then(res => res.json())
      .then(data => console.log('API Health Check:', data))
      .catch(err => console.error('API Health Check Failed:', err));
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <ProtectedRoute>
          <NetworkDashboard />
        </ProtectedRoute>
      </div>
    </AuthProvider>
  );
}

export default App;
