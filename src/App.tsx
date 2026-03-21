import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import Router from './Router';

function AppContent() {
  return <Router />;
}

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <AdminAuthProvider>
          <AppContent />
        </AdminAuthProvider>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;
