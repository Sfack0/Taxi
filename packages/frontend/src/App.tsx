import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BookRide from './pages/BookRide';
import RideSuccess from './pages/RideSuccess';
import TrackRide from './pages/TrackRide';
import RideHistory from './pages/RideHistory';
import AdminDashboard from './pages/AdminDashboard';
import AdminCalendar from './pages/AdminCalendar';
import TransfersIndex from './pages/TransfersIndex';
import TransferRoute from './pages/TransferRoute';
import Destinations from './pages/Destinations';
import ToursPage from './pages/ToursPage';
import Spinner from './components/common/Spinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import { GoogleMapsProvider } from './components/common/GoogleMapsProvider';

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin-only route wrapper
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AdminRedirect({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminRedirect><Home /></AdminRedirect>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Transfer SEO landing pages */}
      <Route path="/transfers" element={<TransfersIndex />} />
      <Route path="/transfers/:slug" element={<TransferRoute />} />
      <Route path="/destinations" element={<Destinations />} />
      <Route path="/tours" element={<ToursPage />} />

      {/* Booking routes - no auth required */}
      <Route path="/book" element={<BookRide />} />
      <Route path="/ride-success/:rideId" element={<RideSuccess />} />
      <Route path="/track" element={<TrackRide />} />

      {/* Protected routes */}
      <Route
        path="/rides"
        element={
          <ProtectedRoute>
            <RideHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/calendar"
        element={
          <AdminRoute>
            <AdminCalendar />
          </AdminRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <GoogleMapsProvider>
        <BrowserRouter>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </BrowserRouter>
      </GoogleMapsProvider>
    </ErrorBoundary>
  );
}

export default App;
