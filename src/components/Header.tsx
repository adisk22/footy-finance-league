
import { TrendingUp, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-footy-green to-footy-blue rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-footy-gold rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-footy-green to-footy-blue bg-clip-text text-transparent">
                FootyStock
              </h1>
              <p className="text-xs text-muted-foreground">Football Trading Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">
              Dashboard
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Players
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Portfolio
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Leaderboard
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <div className="bg-card rounded-lg px-4 py-2 border border-border">
                <div className="text-xs text-muted-foreground">Portfolio Value</div>
                <div className="font-mono font-bold text-footy-green">€125,847</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

