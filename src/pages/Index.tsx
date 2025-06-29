
import Header from '@/components/Header';
import StockTicker from '@/components/StockTicker';
import DashboardStats from '@/components/DashboardStats';
import TradingChart from '@/components/TradingChart';
import PlayerCard from '@/components/PlayerCard';
import TopGainers from '@/components/TopGainers';
import Portfolio from '@/components/Portfolio';

const Index = () => {
  const featuredPlayers = [
    {
      name: 'Kylian Mbappe',
      club: 'Paris Saint-Germain',
      league: 'Ligue 1',
      price: '€1,467',
      change: '+€312',
      changePercent: '+24.8%',
      isUp: true,
      position: 'FW',
      stats: { goals: 28, assists: 12, matches: 31 }
    },
    {
      name: 'Jude Bellingham',
      club: 'Real Madrid',
      league: 'La Liga',
      price: '€1,234',
      change: '+€189',
      changePercent: '+18.2%',
      isUp: true,
      position: 'MF',
      stats: { goals: 15, assists: 8, matches: 29 }
    },
    {
      name: 'Vinicius Jr',
      club: 'Real Madrid',
      league: 'La Liga',
      price: '€1,189',
      change: '+€167',
      changePercent: '+15.7%',
      isUp: true,
      position: 'FW',
      stats: { goals: 19, assists: 11, matches: 28 }
    },
    {
      name: 'Phil Foden',
      club: 'Manchester City',
      league: 'Premier League',
      price: '€987',
      change: '+€108',
      changePercent: '+12.3%',
      isUp: true,
      position: 'MF',
      stats: { goals: 22, assists: 9, matches: 32 }
    },
    {
      name: 'Victor Osimhen',
      club: 'SSC Napoli',
      league: 'Serie A',
      price: '€856',
      change: '-€78',
      changePercent: '-8.4%',
      isUp: false,
      position: 'FW',
      stats: { goals: 16, assists: 4, matches: 25 }
    },
    {
      name: 'Bukayo Saka',
      club: 'Arsenal',
      league: 'Premier League',
      price: '€743',
      change: '+€34',
      changePercent: '+4.8%',
      isUp: true,
      position: 'MF',
      stats: { goals: 12, assists: 15, matches: 30 }
    }
  ];

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
          
          <div className="trading-grid">
            {featuredPlayers.map((player, index) => (
              <div key={index} className="animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <PlayerCard {...player} />
              </div>
            ))}
          </div>
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

