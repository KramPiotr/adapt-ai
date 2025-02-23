
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PrivateRoute from './components/PrivateRoute';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import History from './pages/History';
import Feedback from './pages/Feedback';
import Settings from './pages/Settings';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from './components/ui/button';

const queryClient = new QueryClient();

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
          <Router>
            <div className="min-h-screen flex w-full relative bg-background">
              <div className={`transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-64'}`}>
                <Sidebar />
              </div>
              <div className="absolute top-4 transition-all duration-300" style={{ left: sidebarOpen ? '256px' : '16px' }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-primary hover:text-accent hover:bg-accent/10"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
              <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <main className="p-8">
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route 
                      path="/" 
                      element={
                        <PrivateRoute>
                          <Index />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <PrivateRoute>
                          <Profile />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/history" 
                      element={
                        <PrivateRoute>
                          <History />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/feedback" 
                      element={
                        <PrivateRoute>
                          <Feedback />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <PrivateRoute>
                          <Settings />
                        </PrivateRoute>
                      } 
                    />
                  </Routes>
                </main>
              </div>
              <Toaster />
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
