import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerPlayer {
  name: string;
  price: string;
  change: string;
  up: boolean;
}

const StockTicker = () => {
  const [tickerData, setTickerData] = useState<TickerPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickerData = async () => {
      setLoading(true);
      // Fetch top 7 players by current_price
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .order('current_price', { ascending: false })
        .limit(7);
      if (error || !players) {
        setTickerData([]);
        setLoading(false);
        return;
      }
      // Map to TickerPlayer shape (no real change data, so use placeholders)
      const mapped = players.map((p) => ({
        name: p.name,
        price: p.current_price ? `€${p.current_price.toFixed(2)}M` : 'N/A',
        change: '+0%', // Placeholder, update if you have price change data
        up: true, // Placeholder
      }));
      setTickerData(mapped);
      setLoading(false);
    };
    fetchTickerData();
  }, []);

  return (
    <div className="bg-trading-dark border-y border-border overflow-hidden">
      <div className="animate-stock-ticker whitespace-nowrap py-3">
        {loading ? (
          <div className="inline-flex items-center px-4">Loading ticker...</div>
        ) : (
          <div className="inline-flex space-x-8">
            {[...tickerData, ...tickerData].map((player, index) => (
              <div key={index} className="inline-flex items-center space-x-2 px-4">
                <span className="font-semibold text-sm">{player.name}</span>
                <span className="font-mono text-sm text-muted-foreground">{player.price}</span>
                <div className={`flex items-center space-x-1 text-xs ${player.up ? 'text-green-400' : 'text-red-400'}`}>
                  {player.up ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{player.change}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTicker;

