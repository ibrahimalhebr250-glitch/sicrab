import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { RewardsProvider } from './contexts/RewardsContext';
import Router from './Router';

function AppContent() {
  return <Router />;
}

function App() {
  return (
    <AuthProvider>
      <RewardsProvider>
        <AdminProvider>
          <AdminAuthProvider>
            <AppContent />
          </AdminAuthProvider>
        </AdminProvider>
      </RewardsProvider>
    </AuthProvider>
  );
}

export default App;
