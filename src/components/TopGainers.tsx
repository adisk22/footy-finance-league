
import { TrendingUp, TrendingDown } from 'lucide-react';

const topGainers = [
  { name: 'Kylian Mbappe', club: 'PSG', change: '+24.8%', value: '€1,467', isUp: true },
  { name: 'Jude Bellingham', club: 'Real Madrid', change: '+18.2%', value: '€1,234', isUp: true },
  { name: 'Vinicius Jr', club: 'Real Madrid', change: '+15.7%', value: '€1,189', isUp: true },
  { name: 'Phil Foden', club: 'Man City', change: '+12.3%', value: '€987', isUp: true },
  { name: 'Victor Osimhen', club: 'Napoli', change: '-8.4%', value: '€856', isUp: false },
];

const TopGainers = () => {
  return (
    <div className="footy-card">
      <h2 className="text-xl font-bold mb-6">Top Movers</h2>
      
      <div className="space-y-4">
        {topGainers.map((player, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-footy-blue to-footy-green rounded-full flex items-center justify-center text-white font-bold text-sm">
                {player.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="font-semibold">{player.name}</div>
                <div className="text-sm text-muted-foreground">{player.club}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-mono font-semibold">{player.value}</div>
              <div className={`flex items-center space-x-1 text-sm ${
                player.isUp ? 'text-green-400' : 'text-red-400'
              }`}>
                {player.isUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="font-mono">{player.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors">
        View All Players →
      </button>
    </div>
  );
};

export default TopGainers;

