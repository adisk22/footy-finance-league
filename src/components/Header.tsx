
import { TrendingUp, User, LogOut, Wallet, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [balance, setBalance] = useState<number>(0);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching balance for user:', user.id);
      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      console.log('Balance data:', data);
      setBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const formatBalance = (amount: number) => {
    if (amount >= 1000000) {
      return `€${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `€${(amount / 1000).toFixed(1)}K`;
    } else {
      return `€${amount.toFixed(0)}`;
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight">FootyStock</span>
              <span className="text-xs text-muted-foreground -mt-1">Football Trading</span>
            </div>
          </Link>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              <Link to="/">
                <Button 
                  variant={isActive('/') ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              <Link to="/players">
                <Button 
                  variant={isActive('/players') ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Players</span>
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button 
                  variant={isActive('/portfolio') ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Portfolio</span>
                </Button>
              </Link>
            </nav>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center space-x-2 text-sm">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono font-semibold">{formatBalance(balance)}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
