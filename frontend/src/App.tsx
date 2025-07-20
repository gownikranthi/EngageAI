import React from 'react';
import { Provider } from 'react-redux';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { store } from './redux/store';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { SessionPage } from './pages/SessionPage';
import { AdminPage } from './pages/AdminPage';
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ui/sidebar";
import { EventRewindPage } from './pages/EventRewindPage';

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/event/:eventId" 
                  element={
                    <ProtectedRoute>
                      <EventDetailsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/session/:eventId" 
                  element={
                    <ProtectedRoute>
                      <SessionPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/event-rewind/:eventId" 
                  element={
                    <ProtectedRoute>
                      <EventRewindPage />
                    </ProtectedRoute>
                  } 
                />
                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </ErrorBoundary>
);

export default App;
