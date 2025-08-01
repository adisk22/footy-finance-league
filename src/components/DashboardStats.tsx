import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Award } from 'lucide-react';
import type { ElementType } from 'react';

interface Stat {
  title: string;
  value: string;
  change: string;
  changeValue: string;
  isUp: boolean;
  icon: ElementType;
}

const DashboardStats = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      // Fetch all players
      const { data: players, error } = await supabase
        .from('players')
        .select('*');
      if (error || !players) {
        setStats([]);
        setLoading(false);
        return;
      }
      // Portfolio Value: sum of all current_price
      const totalValue = players.reduce((sum, p) => sum + (p.current_price || 0), 0);
      // Total Players
      const totalPlayers = players.length;
      // Best Performer: player with highest current_price
      const bestPerformer = players.reduce((prev, curr) => (curr.current_price || 0) > (prev.current_price || 0) ? curr : prev, players[0]);
      // Weekly Rank: placeholder
      const weeklyRank = '#127';
      // Build stats array
      setStats([
        {
          title: 'Portfolio Value',
          value: `€${totalValue.toFixed(2)}M`,
          change: '+0%', // Placeholder
          changeValue: '+€0', // Placeholder
          isUp: true,
          icon: DollarSign,
        },
        {
          title: 'Total Players',
          value: totalPlayers.toString(),
          change: '+0', // Placeholder
          changeValue: 'This week',
          isUp: true,
          icon: Users,
        },
        {
          title: 'Best Performer',
          value: bestPerformer ? bestPerformer.name : 'N/A',
          change: '+0%', // Placeholder
          changeValue: '+€0', // Placeholder
          isUp: true,
          icon: Award,
        },
        {
          title: 'Weekly Rank',
          value: weeklyRank,
          change: '+0', // Placeholder
          changeValue: 'Positions',
          isUp: true,
          icon: Target,
        },
      ]);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"><div className="col-span-4 text-center py-8">Loading stats...</div></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="footy-card animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${
              stat.isUp ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <stat.icon className={`w-5 h-5 ${
                stat.isUp ? 'text-green-400' : 'text-red-400'
              }`} />
            </div>
            <div className={`flex items-center space-x-1 text-sm ${
              stat.isUp ? 'text-green-400' : 'text-red-400'
            }`}>
              {stat.isUp ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-mono">{stat.change}</span>
            </div>
          </div>
          <h3 className="text-sm text-muted-foreground mb-1">{stat.title}</h3>
          <div className="font-mono text-2xl font-bold mb-1">{stat.value}</div>
          <div className={`text-xs ${stat.isUp ? 'text-green-400' : 'text-red-400'}`}>{stat.changeValue}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;