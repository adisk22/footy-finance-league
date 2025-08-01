import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import StockTicker from '@/components/StockTicker';
import DashboardStats from '@/components/DashboardStats';
import TradingChart from '@/components/TradingChart';
import PlayerCard from '@/components/PlayerCard';
import TopGainers from '@/components/TopGainers';
import Portfolio from '@/components/Portfolio';

interface FeaturedPlayer {
  name: string;
  club: string;
  league: string;
  price: string;
  change: string;
  changePercent: string;
  isUp: boolean;
  position: string;
  stats: {
    goals: number;
    assists: number;
    matches: number;
  };
}

const Index = () => {
  const [featuredPlayers, setFeaturedPlayers] = useState<FeaturedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPlayers = async () => {
      setLoading(true);
      // Fetch top 6 players by price
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('current_price', { ascending: false })
        .limit(6);
      if (playersError || !players) {
        setFeaturedPlayers([]);
        setLoading(false);
        return;
      }
      // Fetch and aggregate stats for each player
      const playerIds = players.map((p) => p.id);
      const { data: stats, error: statsError } = await supabase
        .from('match_stats')
        .select('player_id, goals, assists')
        .in('player_id', playerIds);
      // Aggregate stats per player
      const statsMap: Record<string, { goals: number; assists: number; matches: number }> = {};
      playerIds.forEach((id) => {
        statsMap[id] = { goals: 0, assists: 0, matches: 0 };
      });
      if (stats && !statsError) {
        stats.forEach((row) => {
          if (row.player_id in statsMap) {
            statsMap[row.player_id].goals += row.goals || 0;
            statsMap[row.player_id].assists += row.assists || 0;
            statsMap[row.player_id].matches += 1;
          }
        });
      }
      // Map to PlayerCard shape
      const mapped = players.map((p) => ({
        name: p.name,
        club: p.team,
        league: p.league,
        price: p.current_price ? `€${(p.current_price / 1000000).toFixed(2)}M` : 'N/A',
        change: '+€0', // Placeholder, you can calculate this if you have price history
        changePercent: '+0%', // Placeholder
        isUp: true, // Placeholder, you can set logic based on price change
        position: p.position,
        stats: statsMap[p.id] || { goals: 0, assists: 0, matches: 0 },
      }));
      setFeaturedPlayers(mapped);
      setLoading(false);
    };
    fetchFeaturedPlayers();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StockTicker />
      
      <main className="container mx-auto px-4 py-8">
        {/* Dashboard Overview */}
        <DashboardStats />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <TradingChart />
          </div>
          <div>
            <TopGainers />
          </div>
        </div>
        
        {/* Portfolio Section */}
        <div className="mb-8">
          <Portfolio />
        </div>
        
        {/* Featured Players */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Trending Players</h2>
            <button className="text-primary hover:text-primary/80 transition-colors">
              View All →
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading featured players...</div>
          ) : (
            <div className="trading-grid">
              {featuredPlayers.map((player, index) => (
                <div key={index} className="animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <PlayerCard {...player} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">© 2024 FootyStock. Where Football Meets Finance.</p>
            <p className="text-xs">
              Virtual trading platform for entertainment purposes. Player values are fictional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

