
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, User, Wallet, BarChart3 } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-footy-blue to-footy-green rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight">FootyStock</span>
              <span className="text-xs text-muted-foreground -mt-1">Football Trading</span>
            </div>
          </Link>

          {/* Navigation */}
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
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono font-semibold">€20.0M</span>
            </div>
            <Button size="sm" className="bg-footy-green hover:bg-footy-green/90">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
