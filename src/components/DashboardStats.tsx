
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Award } from 'lucide-react';

const DashboardStats = () => {
  const stats = [
    {
      title: 'Portfolio Value',
      value: '€125,847',
      change: '+12.5%',
      changeValue: '+€13,924',
      isUp: true,
      icon: DollarSign,
    },
    {
      title: 'Total Players',
      value: '23',
      change: '+2',
      changeValue: 'This week',
      isUp: true,
      icon: Users,
    },
    {
      title: 'Best Performer',
      value: 'Mbappe',
      change: '+24.8%',
      changeValue: '+€312',
      isUp: true,
      icon: Award,
    },
    {
      title: 'Weekly Rank',
      value: '#127',
      change: '+45',
      changeValue: 'Positions',
      isUp: true,
      icon: Target,
    },
  ];

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
          <div className={`text-xs ${stat.isUp ? 'text-green-400' : 'text-red-400'}`}>
            {stat.changeValue}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;

