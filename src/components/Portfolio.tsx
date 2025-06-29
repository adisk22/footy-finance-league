
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Trophy, Star, Target } from 'lucide-react';

const portfolioData = [
  { name: 'Forwards', value: 45, color: '#22c55e' },
  { name: 'Midfielders', value: 35, color: '#3b82f6' },
  { name: 'Defenders', value: 15, color: '#f59e0b' },
  { name: 'Goalkeepers', value: 5, color: '#ef4444' },
];

const Portfolio = () => {
  return (
    <div className="footy-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">My Portfolio</h2>
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-footy-gold" />
          <span className="font-semibold text-footy-gold">#127</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Distribution */}
        <div>
          <h3 className="font-semibold mb-4">Position Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {portfolioData.map((entry, index) => (
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
                <div className="font-mono font-bold text-xl">€125,847</div>
              </div>
              <Star className="w-8 h-8 text-footy-gold" />
            </div>
          </div>
          
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Today's P&L</div>
                <div className="font-mono font-bold text-lg text-green-400">+€2,431</div>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="metric-card">
            <div className="text-xs text-muted-foreground">Best Investment</div>
            <div className="font-semibold">Kylian Mbappe</div>
            <div className="text-sm text-green-400 font-mono">+€4,127 (+24.8%)</div>
          </div>
          
          <div className="metric-card">
            <div className="text-xs text-muted-foreground">Worst Investment</div>
            <div className="font-semibold">Victor Osimhen</div>
            <div className="text-sm text-red-400 font-mono">-€847 (-8.4%)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;

