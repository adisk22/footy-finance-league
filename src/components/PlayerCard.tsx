
import { TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayerCardProps {
  name: string;
  club: string;
  league: string;
  price: string;
  change: string;
  changePercent: string;
  isUp: boolean;
  position: string;
  image?: string;
  stats: {
    goals: number;
    assists: number;
    matches: number;
  };
}

const PlayerCard = ({ 
  name, 
  club, 
  league, 
  price, 
  change, 
  changePercent, 
  isUp, 
  position, 
  stats 
}: PlayerCardProps) => {
  return (
    <div className="player-card group relative overflow-hidden">
      {/* Background gradient based on performance */}
      <div className={`absolute inset-0 opacity-10 ${
        isUp ? 'bg-gradient-to-br from-green-500 to-transparent' : 'bg-gradient-to-br from-red-500 to-transparent'
      }`} />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-bold text-lg">{name}</h3>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
              {position}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{club}</p>
          <p className="text-xs text-muted-foreground">{league}</p>
        </div>
        
        {/* Player Avatar Placeholder */}
        <div className="w-16 h-16 bg-gradient-to-br from-footy-blue to-footy-green rounded-full flex items-center justify-center text-white font-bold text-lg">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
      </div>

      {/* Price and Change */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-2xl font-bold">{price}</span>
          <div className={`flex items-center space-x-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-mono font-semibold">{changePercent}</span>
          </div>
        </div>
        <div className={`text-sm font-mono ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? '+' : ''}{change}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="metric-card text-center">
          <div className="font-bold text-lg">{stats.goals}</div>
          <div className="text-xs text-muted-foreground">Goals</div>
        </div>
        <div className="metric-card text-center">
          <div className="font-bold text-lg">{stats.assists}</div>
          <div className="text-xs text-muted-foreground">Assists</div>
        </div>
        <div className="metric-card text-center">
          <div className="font-bold text-lg">{stats.matches}</div>
          <div className="text-xs text-muted-foreground">Matches</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Buy
        </Button>
        <Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
          Sell
        </Button>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/50 rounded-xl transition-all duration-300 pointer-events-none" />
    </div>
  );
};

export default PlayerCard;

