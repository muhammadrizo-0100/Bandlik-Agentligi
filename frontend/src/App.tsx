import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CitizensPage } from './pages/CitizensPage';
import { NewSurveyPage } from './pages/NewSurveyPage';
import { SurveysPage } from './pages/SurveysPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { MahallasManagementPage } from './pages/MahallasManagementPage';
import { UsersManagementPage } from './pages/UsersManagementPage';

// Himoyalangan marshrut (Protected Route)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xs">
        Yuklanmoqda...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
          {/* Ochiq marshrut */}
          <Route path="/login" element={<LoginPage />} />

          {/* Himoyalangan marshrutlar */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizens"
            element={
              <ProtectedRoute>
                <CitizensPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-survey"
            element={
              <ProtectedRoute>
                <NewSurveyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys"
            element={
              <ProtectedRoute>
                <SurveysPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review-queue"
            element={
              <ProtectedRoute>
                <ReviewQueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mahallas"
            element={
              <ProtectedRoute>
                <MahallasManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UsersManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
