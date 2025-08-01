import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Trophy, Star, Target } from 'lucide-react';

interface PositionDistribution {
  name: string;
  value: number;
  color: string;
}

const POSITION_COLORS: Record<string, string> = {
  Forwards: '#22c55e',
  Midfielders: '#3b82f6',
  Defenders: '#f59e0b',
  Goalkeepers: '#ef4444',
};

const Portfolio = () => {
  const [distribution, setDistribution] = useState<PositionDistribution[]>([]);
  const [totalValue, setTotalValue] = useState<string>('€0');
  const [bestInvestment, setBestInvestment] = useState<string>('N/A');
  const [worstInvestment, setWorstInvestment] = useState<string>('N/A');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true);
      // Fetch all portfolio rows (for a single user, or all for now)
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolio')
        .select('*');
      if (portfolioError || !portfolio || portfolio.length === 0) {
        setDistribution([]);
        setTotalValue('€0');
        setBestInvestment('N/A');
        setWorstInvestment('N/A');
        setLoading(false);
        return;
      }
      // Fetch all players referenced in the portfolio
      const playerIds = portfolio.map((p) => p.player_id).filter(Boolean);
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .in('id', playerIds);
      if (playersError || !players) {
        setDistribution([]);
        setTotalValue('€0');
        setBestInvestment('N/A');
        setWorstInvestment('N/A');
        setLoading(false);
        return;
      }
      // Map playerId to player info
      const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
      // Calculate position distribution
      const positionCounts: Record<string, number> = {};
      let valueSum = 0;
      let best = { name: 'N/A', value: -Infinity };
      let worst = { name: 'N/A', value: Infinity };
      portfolio.forEach((entry) => {
        const player = playerMap[entry.player_id];
        if (!player) return;
        const pos =
          player.position === 'FW'
            ? 'Forwards'
            : player.position === 'MF'
            ? 'Midfielders'
            : player.position === 'DF'
            ? 'Defenders'
            : player.position === 'GK'
            ? 'Goalkeepers'
            : player.position;
        positionCounts[pos] = (positionCounts[pos] || 0) + (entry.quantity || 0);
        const playerValue = (player.current_price || 0) * (entry.quantity || 0);
        valueSum += playerValue;
        if (playerValue > best.value) best = { name: player.name, value: playerValue };
        if (playerValue < worst.value) worst = { name: player.name, value: playerValue };
      });
      const dist: PositionDistribution[] = Object.entries(positionCounts).map(
        ([name, value]) => ({
          name,
          value,
          color: POSITION_COLORS[name] || '#8884d8',
        })
      );
      setDistribution(dist);
      setTotalValue(`€${(valueSum / 1000000).toFixed(2)}M`);
      setBestInvestment(best.name);
      setWorstInvestment(worst.name);
      setLoading(false);
    };
    fetchPortfolio();
  }, []);

  return (
    <div className="footy-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">My Portfolio</h2>
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-footy-gold" />
          <span className="font-semibold text-footy-gold">#127</span>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8">Loading portfolio...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Distribution */}
          <div>
            <h3 className="font-semibold mb-4">Position Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Portfolio Stats */}
          <div className="space-y-4">
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Total Value</div>
                  <div className="font-mono font-bold text-xl">{totalValue}</div>
                </div>
                <Star className="w-8 h-8 text-footy-gold" />
              </div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Today's P&L</div>
                  <div className="font-mono font-bold text-lg text-green-400">+€0</div>
                </div>
                <Target className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="metric-card">
              <div className="text-xs text-muted-foreground">Best Investment</div>
              <div className="font-semibold">{bestInvestment}</div>
              <div className="text-sm text-green-400 font-mono">+€0 (+0%)</div>
            </div>
            <div className="metric-card">
              <div className="text-xs text-muted-foreground">Worst Investment</div>
              <div className="font-semibold">{worstInvestment}</div>
              <div className="text-sm text-red-400 font-mono">-€0 (-0%)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;

