import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

interface PortfolioItem {
  id: string;
  quantity: number;
  average_buy_price: number;
  player: {
    id: string;
    name: string;
    team: string;
    position: string;
    league: string;
    current_price: number;
  };
}

interface UserBalance {
  balance: number;
}

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPortfolio();
      fetchUserBalance();
    }
  }, [user]);

  const fetchUserBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // If user has no balance, set it to 1000 (starting amount)
      if (data?.balance === null || data?.balance === 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ balance: 1000 })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating user balance:', updateError);
        } else {
          setUserBalance(1000);
          return;
        }
      }
      
      setUserBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const fetchPortfolio = async () => {
    if (!user) return;

    try {
      console.log('Fetching portfolio for user:', user.id);
      
      const { data, error } = await supabase
        .from('portfolio')
        .select(`
          id,
          quantity,
          average_buy_price,
          player_id,
          players!portfolio_player_fk(
            id,
            name,
            team,
            position,
            league,
            current_price
          )
        `)
        .eq('user_id', user.id)
        .gt('quantity', 0);

      console.log('Portfolio fetch result:', { data, error });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        quantity: item.quantity,
        average_buy_price: item.average_buy_price,
        player: Array.isArray(item.players) ? item.players[0] : item.players
      })).filter(item => item.player); // Filter out items without player data

      console.log('Transformed portfolio data:', transformedData);
      setPortfolio(transformedData);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to fetch portfolio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `€${price.toFixed(2)}M`;
  };

  const calculateProfitLoss = (currentPrice: number, averagePrice: number, quantity: number) => {
    const currentValue = currentPrice * quantity;
    const investedValue = averagePrice * quantity;
    const profitLoss = currentValue - investedValue;
    const profitLossPercent = ((profitLoss / investedValue) * 100);
    
    return {
      amount: profitLoss,
      percentage: profitLossPercent,
      isProfit: profitLoss >= 0
    };
  };

  const totalPortfolioValue = portfolio.reduce((sum, item) => 
    sum + (item.player.current_price * item.quantity), 0
  );

  const totalInvested = portfolio.reduce((sum, item) => 
    sum + (item.average_buy_price * item.quantity), 0
  );

  const totalProfitLoss = totalPortfolioValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const handleSellPlayer = async (item: PortfolioItem) => {
    if (!user) return;

    try {
      // Insert sell transaction - the database trigger will handle portfolio and balance updates
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          player_id: item.player.id,
          quantity: 1,
          price: item.player.current_price,
          type: 'sell'
        });

      if (transactionError) {
        // Check if it's an insufficient shares error
        if (transactionError.message?.includes('Insufficient shares')) {
          toast({
            title: "Sale Failed",
            description: "You don't own any shares of this player",
            variant: "destructive"
          });
        } else {
          throw transactionError;
        }
        return;
      }

      toast({
        title: "Sale Successful",
        description: `Sold 1 share of ${item.player.name} for ${formatPrice(item.player.current_price)}`,
      });

      // Refresh data
      fetchPortfolio();
      fetchUserBalance();
    } catch (error) {
      console.error('Error selling player:', error);
      toast({
        title: "Sale Failed",
        description: "Failed to complete the sale",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your portfolio</h1>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading portfolio...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Portfolio</h1>
          <p className="text-muted-foreground">Track your football player investments</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{formatPrice(userBalance)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{formatPrice(totalPortfolioValue)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{formatPrice(totalInvested)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}{formatPrice(totalProfitLoss)}
              </div>
              <div className={`text-sm ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings */}
        {portfolio.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No holdings yet</h3>
              <p className="text-muted-foreground mb-4">Start building your portfolio by buying players</p>
              <Button onClick={() => window.location.href = '/players'}>
                Browse Players
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((item) => {
              const profitLoss = calculateProfitLoss(
                item.player.current_price,
                item.average_buy_price,
                item.quantity
              );

              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold">{item.player.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{item.player.team}</p>
                        <p className="text-xs text-muted-foreground">{item.player.league}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {item.player.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {item.player.position}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Quantity</div>
                          <div className="font-semibold">{item.quantity}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg. Price</div>
                          <div className="font-semibold font-mono">{formatPrice(item.average_buy_price)}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Current Price</div>
                          <div className="font-semibold font-mono">{formatPrice(item.player.current_price)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Value</div>
                          <div className="font-semibold font-mono">{formatPrice(item.player.current_price * item.quantity)}</div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Profit/Loss</span>
                          <div className={`flex items-center space-x-1 ${profitLoss.isProfit ? 'text-green-400' : 'text-red-400'}`}>
                            {profitLoss.isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="font-mono font-semibold">{profitLoss.percentage.toFixed(2)}%</span>
                          </div>
                        </div>
                        <div className={`font-mono text-lg font-bold ${profitLoss.isProfit ? 'text-green-400' : 'text-red-400'}`}>
                          {profitLoss.isProfit ? '+' : ''}{formatPrice(profitLoss.amount)}
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full border-red-500 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleSellPlayer(item)}
                      >
                        Sell 1 Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;