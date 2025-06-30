
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';

const chartData = [
  { time: '09:00', value: 1247, volume: 234 },
  { time: '10:00', value: 1289, volume: 567 },
  { time: '11:00', value: 1234, volume: 432 },
  { time: '12:00', value: 1356, volume: 789 },
  { time: '13:00', value: 1298, volume: 345 },
  { time: '14:00', value: 1423, volume: 678 },
  { time: '15:00', value: 1389, volume: 543 },
  { time: '16:00', value: 1467, volume: 890 },
];

const TradingChart = () => {
  return (
    <div className="footy-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Market Overview</h2>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md">1D</button>
          <button className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">1W</button>
          <button className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">1M</button>
          <button className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">1Y</button>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              className="text-muted-foreground text-xs"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              className="text-muted-foreground text-xs"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="metric-card">
          <div className="text-xs text-muted-foreground">Market Cap</div>
          <div className="font-mono font-bold text-lg">€2.4M</div>
        </div>
        <div className="metric-card">
          <div className="text-xs text-muted-foreground">24h Volume</div>
          <div className="font-mono font-bold text-lg">€847K</div>
        </div>
      </div>
    </div>
  );
};

export default TradingChart;
