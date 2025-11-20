import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import ServerSelection from './pages/ServerSelection';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Settings from './pages/Settings';
import SeedData from './pages/SeedData';
import Inventory from './pages/Inventory';
import Tables from './pages/Tables';
import ActivityLogs from './pages/ActivityLogs';
import ClosingReport from './pages/ClosingReport';
import UserGuide from './pages/UserGuide';
import StorageTest from './pages/StorageTest';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import { useNotification } from './components/NotificationProvider';

function App() {
  const { initialize, isInitialized, currentUser } = useStore();
  const { notify } = useNotification();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Starting app initialization...');
        await initialize();
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize:', error);
        // Show error to user instead of stuck on loading
        notify({
          type: 'error',
          title: 'Inisialisasi Gagal',
          message: `Silakan refresh halaman atau restart aplikasi.\nDetail: ${
            error instanceof Error ? error.message : String(error)
          }`,
          duration: 6000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [initialize, notify]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isInitialized) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/server-selection" element={<ServerSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to="/pos" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            currentUser ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/pos"
          element={
            currentUser ? (
              <Layout>
                <POS />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/products"
          element={
            currentUser ? (
              <Layout>
                <Products />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/orders"
          element={
            currentUser ? (
              <Layout>
                <Orders />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/users"
          element={
            currentUser && currentUser.role === 'admin' ? (
              <Layout>
                <Users />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            currentUser ? (
              <Layout>
                <Settings />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/seed"
          element={
            currentUser && currentUser.role === 'admin' ? (
              <Layout>
                <SeedData />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/inventory"
          element={
            currentUser ? (
              <Layout>
                <Inventory />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/tables"
          element={
            currentUser ? (
              <Layout>
                <Tables />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/activity-logs"
          element={
            currentUser ? (
              <Layout>
                <ActivityLogs />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/closing-report"
          element={
            currentUser ? (
              <Layout>
                <ClosingReport />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/user-guide"
          element={
            currentUser ? (
              <Layout>
                <UserGuide />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/storage-test"
          element={
            <Layout>
              <StorageTest />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

