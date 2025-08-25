import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

interface PortfolioItem {
  id: string;
  quantity: number;
  average_buy_price: number;
  players: {
    id: string;
    name: string;
    team: string;
    position: string;
    league: string;
    current_price: number;
  };
}

const Portfolio = () => {
  const { currentUser, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for sell dialog
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: portfolio, isLoading: portfolioLoading, error: portfolioError } = useQuery({
    queryKey: ['portfolio', currentUser?.id],
    queryFn: () => api.getPortfolio(currentUser!.id),
    enabled: !!currentUser
  });

  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['transactions', currentUser?.id],
    queryFn: () => api.getTransactions(currentUser!.id),
    enabled: !!currentUser
  });

  // Reset sell quantity when dialog opens
  useEffect(() => {
    if (sellDialogOpen && selectedItem) {
      setSellQuantity(1);
    }
  }, [sellDialogOpen, selectedItem]);

  // Helper function to format prices (moved to top)
  const formatPrice = (price: number) => {
    if (price === null || price === undefined || price === 0) {
      return '€0.00M';
    }
    return `€${price.toFixed(2)}M`;
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (selectedItem?.quantity || 1)) {
      setSellQuantity(newQuantity);
    }
  };

  const getSaleProceeds = () => {
    if (!selectedItem || !selectedItem.players) return 0;
    return selectedItem.players.current_price * sellQuantity;
  };

  const handleSellPlayer = (item: PortfolioItem) => {
    setSelectedItem(item);
    setSellDialogOpen(true);
  };

  const handleConfirmSell = async () => {
    if (!selectedItem || !currentUser || !selectedItem.players) return;

    setIsProcessing(true);
    try {
      await api.sellPlayer(
        currentUser.id,
        selectedItem.players.id,
        sellQuantity,
        selectedItem.players.current_price
      );

      // Refresh user data and portfolio
      await refreshUser();
      queryClient.invalidateQueries(['portfolio', currentUser.id]);
      queryClient.invalidateQueries(['transactions', currentUser.id]);

      toast({
        title: "Sale Successful",
        description: `Sold ${sellQuantity} share${sellQuantity > 1 ? 's' : ''} of ${selectedItem.players.name} for ${formatPrice(getSaleProceeds())}`,
      });
      
      // Close dialog
      setSellDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error selling player:', error);
      toast({
        title: "Sale Failed",
        description: error instanceof Error ? error.message : "Failed to complete the sale",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-muted-foreground">You need to be signed in to view your portfolio.</p>
          </div>
        </div>
      </div>
    );
  }

  if (portfolioLoading || transactionsLoading) {
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

  // Handle errors
  if (portfolioError || transactionsError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Portfolio</h1>
            <p className="text-muted-foreground mb-4">
              {portfolioError?.message || transactionsError?.message || "Failed to load portfolio data"}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const calculateProfitLoss = (currentPrice: number, averagePrice: number, quantity: number) => {
    const currentValue = currentPrice * quantity;
    const investedValue = averagePrice * quantity;
    const profitLoss = currentValue - investedValue;
    const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;
    
    return {
      amount: profitLoss,
      percentage: profitLossPercent,
      isProfit: profitLoss >= 0
    };
  };

  // Safe portfolio calculations with null checks
  const totalPortfolioValue = portfolio?.reduce((sum, item) => {
    if (!item.players) return sum;
    return sum + (item.players.current_price * item.quantity);
  }, 0) || 0;

  const totalInvested = portfolio?.reduce((sum, item) => {
    return sum + (item.average_buy_price * item.quantity);
  }, 0) || 0;

  const totalProfitLoss = totalPortfolioValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Your Portfolio</h1>
          <p className="text-muted-foreground">Real-time portfolio tracking and performance</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-foreground">
                {formatPrice(currentUser.balance)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-foreground">
                {formatPrice(totalPortfolioValue)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-foreground">
                {formatPrice(totalInvested)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium">Total Profit/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}{formatPrice(totalProfitLoss)}
              </div>
              <div className={`text-sm ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings */}
        {!portfolio || portfolio.length === 0 ? (
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
              // Skip items without player data
              if (!item.players) return null;
              
              const profitLoss = calculateProfitLoss(
                item.players.current_price || 0,
                item.average_buy_price,
                item.quantity
              );

              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-foreground">{item.players.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{item.players.team}</p>
                        <p className="text-xs text-muted-foreground">{item.players.league}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {item.players.name?.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {item.players.position}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Quantity</div>
                          <div className="font-semibold text-foreground">{item.quantity}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg. Price</div>
                          <div className="font-semibold font-mono text-foreground">{formatPrice(item.average_buy_price)}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Current Price</div>
                          <div className="font-semibold font-mono text-foreground">{formatPrice(item.players.current_price || 0)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total Value</div>
                          <div className="font-semibold font-mono text-foreground">{formatPrice((item.players.current_price || 0) * item.quantity)}</div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Profit/Loss</span>
                          <div className={`flex items-center space-x-1 ${profitLoss.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {profitLoss.isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="font-mono font-semibold">{profitLoss.percentage.toFixed(2)}%</span>
                          </div>
                        </div>
                        <div className={`font-mono text-lg font-bold ${profitLoss.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {profitLoss.isProfit ? '+' : ''}{formatPrice(profitLoss.amount)}
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full border-red-500 text-red-600 hover:bg-red-500/10"
                        onClick={() => handleSellPlayer(item)}
                      >
                        Sell Shares
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }).filter(Boolean)} {/* Remove null items */}
          </div>
        )}

        {/* Recent Transactions */}
        {transactions && transactions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Recent Transactions</h2>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-foreground">{tx.players?.name || 'Unknown Player'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.quantity} shares
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-foreground">
                          €{tx.price?.toFixed(2) || '0.00'}M
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sell Shares</DialogTitle>
          </DialogHeader>
          
          {selectedItem && selectedItem.players && (
            <div className="space-y-6">
              {/* Player Info */}
              <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {selectedItem.players.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedItem.players.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.players.team} • {selectedItem.players.position}</p>
                  <p className="text-sm text-muted-foreground">{selectedItem.players.league}</p>
                </div>
              </div>

              {/* Current Price */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold font-mono">{formatPrice(selectedItem.players.current_price)}</p>
              </div>

              {/* Quantity Selection */}
              <div className="space-y-2">
                <Label htmlFor="sell-quantity">Number of Shares to Sell</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(sellQuantity - 1)}
                    disabled={sellQuantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    id="sell-quantity"
                    type="number"
                    min="1"
                    max={selectedItem.quantity}
                    value={sellQuantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(sellQuantity + 1)}
                    disabled={sellQuantity >= selectedItem.quantity}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  You own {selectedItem.quantity} shares
                </p>
              </div>

              {/* Sale Breakdown */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sale Proceeds:</span>
                  <span className="font-mono font-semibold text-green-600">{formatPrice(getSaleProceeds())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Balance:</span>
                  <span className="font-mono">{formatPrice(currentUser.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Balance:</span>
                  <span className="font-mono text-green-600">{formatPrice(currentUser.balance + getSaleProceeds())}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSellDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSell}
              disabled={isProcessing || !selectedItem?.players}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Processing...' : `Sell ${sellQuantity} Share${sellQuantity > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Portfolio;