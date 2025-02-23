
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, User, BookOpen, MessageSquare, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Sidebar = () => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error('Error signing out');
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white shadow-lg p-6 border-r-2 border-primary/20">
      <div className="flex flex-col h-full">
        <h1 className="text-2xl font-bold text-primary mb-8">AI Coach</h1>
        <div className="flex-grow">
          <nav className="flex-1">
            <ul className="space-y-4">
              <li>
                <Link to="/" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted border border-transparent hover:border-primary/20">
                  <Home size={20} />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/profile" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted border border-transparent hover:border-primary/20">
                  <User size={20} />
                  <span>My Profile</span>
                </Link>
              </li>
              <li>
                <Link to="/history" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted border border-transparent hover:border-primary/20">
                  <BookOpen size={20} />
                  <span>Session History</span>
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted border border-transparent hover:border-primary/20">
                  <MessageSquare size={20} />
                  <span>Feedback</span>
                </Link>
              </li>
              <li>
                <Link to="/settings" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted border border-transparent hover:border-primary/20">
                  <Settings size={20} />
                  <span>Settings</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start border border-transparent hover:border-primary/20" 
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
