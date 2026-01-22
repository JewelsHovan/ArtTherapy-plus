import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import Welcome from './pages/Welcome';
import Registration from './pages/Registration';
import About from './pages/About';
import ModeSelection from './pages/ModeSelection';
import PainDescription from './pages/PainDescription';
import Visualize from './pages/Visualize';
import Edit from './pages/Edit';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ComponentShowcase from './pages/ComponentShowcase';
import Inspire from './pages/Inspire';
import Reflect from './pages/Reflect';
import Journal from './pages/Journal';
import NotFound from './pages/NotFound';

// Layout
import AppLayout from './components/layout/AppLayout';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                borderRadius: '8px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#3B82F6',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Welcome />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/about" element={<About />} />

            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/mode" element={<ModeSelection />} />
                <Route path="/describe" element={<PainDescription />} />
                <Route path="/visualize" element={<Visualize />} />
                <Route path="/edit" element={<Edit />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/componentshowcase" element={<ComponentShowcase />} />
                <Route path="/inspire" element={<Inspire />} />
                <Route path="/reflect" element={<Reflect />} />
                <Route path="/journal" element={<Journal />} />
              </Route>
            </Route>

            {/* 404 catch-all route - must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;