
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { User, LogOut, Loader2, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

const Header = () => {
  const { currentUser, setCurrentUser, refreshUser, loading } = useUser();
  const { toast } = useToast();

  const handleLogout = () => {
    setCurrentUser(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out",
    });
  };

  const handleSwitchUser = async () => {
    try {
      // Get all users and switch to the next one
      const users = await api.getUsers();
      if (users.length > 1) {
        const currentIndex = users.findIndex(u => u.id === currentUser?.id);
        const nextIndex = (currentIndex + 1) % users.length;
        setCurrentUser(users[nextIndex]);
        
        toast({
          title: "User Switched",
          description: `Now logged in as ${users[nextIndex].username}`,
        });
      }
    } catch (error) {
      console.error('Error switching user:', error);
      toast({
        title: "Error",
        description: "Failed to switch user",
        variant: "destructive"
      });
    }
  };

  // Add this test function
  const testSupabaseConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      const users = await api.getUsers();
      console.log('Test result - Users found:', users.length);
      
      toast({
        title: "Connection Test",
        description: `Found ${users.length} users in database`,
      });
      
      if (users.length > 0) {
        setCurrentUser(users[0]);
      }
    } catch (error) {
      console.error('Supabase test failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="bg-background border-b border-border px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-foreground">Footy Finance</h1>
          <nav className="hidden md:flex space-x-6">
            <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
            <a href="/players" className="text-muted-foreground hover:text-foreground transition-colors">Players</a>
            <a href="/portfolio" className="text-muted-foreground hover:text-foreground transition-colors">Portfolio</a>
          </nav>
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : currentUser ? (
            <div className="flex items-center space-x-3">
              {/* User Info */}
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">
                  {currentUser.username}
                </div>
                <div className="text-xs text-muted-foreground">
                  €{currentUser.balance.toFixed(2)}
                </div>
              </div>
              
              {/* User Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchUser}
                  className="text-xs"
                >
                  Switch User
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">No user loaded</span>
              
              {/* Test Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={testSupabaseConnection}
                className="text-xs bg-yellow-100 hover:bg-yellow-200"
              >
                <TestTube className="w-3 h-3 mr-1" />
                Test Connection
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
