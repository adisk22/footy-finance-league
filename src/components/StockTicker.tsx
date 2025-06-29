
import { TrendingUp, TrendingDown } from 'lucide-react';

const tickerData = [
  { name: 'Mbappe', price: '€1,247', change: '+12.5%', up: true },
  { name: 'Haaland', price: '€1,189', change: '+8.3%', up: true },
  { name: 'Bellingham', price: '€987', change: '-2.1%', up: false },
  { name: 'Vinicius Jr', price: '€1,156', change: '+15.2%', up: true },
  { name: 'Pedri', price: '€743', change: '+4.7%', up: true },
  { name: 'Saka', price: '€821', change: '-1.3%', up: false },
  { name: 'Osimhen', price: '€934', change: '+7.8%', up: true },
];

const StockTicker = () => {
  return (
    <div className="bg-trading-dark border-y border-border overflow-hidden">
      <div className="animate-stock-ticker whitespace-nowrap py-3">
        <div className="inline-flex space-x-8">
          {[...tickerData, ...tickerData].map((player, index) => (
            <div key={index} className="inline-flex items-center space-x-2 px-4">
              <span className="font-semibold text-sm">{player.name}</span>
              <span className="font-mono text-sm text-muted-foreground">{player.price}</span>
              <div className={`flex items-center space-x-1 text-xs ${
                player.up ? 'text-green-400' : 'text-red-400'
              }`}>
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
      </div>
    </div>
  );
};

export default StockTicker;

