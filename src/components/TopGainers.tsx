import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface GainerPlayer {
  name: string;
  club: string;
  change: string;
  value: string;
  isUp: boolean;
}

const TopGainers = () => {
  const [topGainers, setTopGainers] = useState<GainerPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopGainers = async () => {
      setLoading(true);
      // Fetch top 5 players by current_price (as a proxy for gainers)
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .order('current_price', { ascending: false })
        .limit(5);
      if (error || !players) {
        setTopGainers([]);
        setLoading(false);
        return;
      }
      // Map to GainerPlayer shape (no real change data, so use placeholders)
      const mapped = players.map((p) => ({
        name: p.name,
        club: p.team,
        change: '+0%', // Placeholder, update if you have price change data
        value: p.current_price ? `€${(p.current_price / 1000000).toFixed(2)}M` : 'N/A',
        isUp: true, // Placeholder
      }));
      setTopGainers(mapped);
      setLoading(false);
    };
    fetchTopGainers();
  }, []);

  return (
    <div className="footy-card">
      <h2 className="text-xl font-bold mb-6">Top Movers</h2>
      {loading ? (
        <div className="text-center py-8">Loading top gainers...</div>
      ) : (
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
                <div className={`flex items-center space-x-1 text-sm ${player.isUp ? 'text-green-400' : 'text-red-400'}`}>
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
      )}
      <button className="w-full mt-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors">
        View All Players →
      </button>
    </div>
  );
};

export default TopGainers;

