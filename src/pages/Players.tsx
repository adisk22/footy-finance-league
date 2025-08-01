
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, TrendingUp, TrendingDown, ShoppingCart, Minus, Plus } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  league: string;
  current_price: number;
  image_url?: string;
  last_updated: string;
}

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [userBalance, setUserBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlayers();
    if (user) {
      fetchUserBalance();
    }
  }, [user]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('current_price', { ascending: false });

      if (error) throw error;
      
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to fetch players",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = selectedPosition === 'ALL' || player.position === selectedPosition;
    const matchesLeague = selectedLeague === 'ALL' || player.league === selectedLeague;
    
    return matchesSearch && matchesPosition && matchesLeague;
  });

  const uniquePositions = [...new Set(players.map(p => p.position))];
  const uniqueLeagues = [...new Set(players.map(p => p.league))];

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined || price === 0) {
      return '€0.00M';
    }
    // Prices are already in millions (e.g., 150 = €150M)
    return `€${price.toFixed(2)}M`;
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 100) {
      setBuyQuantity(newQuantity);
    }
  };

  const handleSellQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 100) {
      setSellQuantity(newQuantity);
    }
  };

  const getTotalCost = () => {
    if (!selectedPlayer) return 0;
    return selectedPlayer.current_price * buyQuantity;
  };

  const getRemainingBalance = () => {
    return userBalance - getTotalCost();
  };

  const canAfford = () => {
    return getTotalCost() <= userBalance;
  };

  const handleBuyPlayer = (player: Player) => {
    if (!user) return;
    
    setSelectedPlayer(player);
    setBuyQuantity(1);
    setBuyDialogOpen(true);
  };

  const handleConfirmBuy = async () => {
    if (!user || !selectedPlayer) return;

    setIsProcessing(true);
    try {
      console.log('Starting buy transaction:', {
        user_id: user.id,
        player_id: selectedPlayer.id,
        quantity: buyQuantity,
        price: selectedPlayer.current_price,
        type: 'buy'
      });

      // Insert transaction record - the database trigger will handle portfolio and balance updates
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          player_id: selectedPlayer.id,
          quantity: buyQuantity,
          price: selectedPlayer.current_price,
          type: 'buy'
        })
        .select();

      console.log('Transaction result:', { transactionData, transactionError });

      if (transactionError) {
        console.error('Transaction error details:', transactionError);
        // Check if it's an insufficient balance error
        if (transactionError.message?.includes('Insufficient balance')) {
          toast({
            title: "Insufficient Funds",
            description: "You don't have enough balance to buy this player",
            variant: "destructive"
          });
        } else {
          throw transactionError;
        }
        return;
      }

      console.log('Transaction successful, checking portfolio and balance...');

      // Check if portfolio was updated
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .eq('player_id', selectedPlayer.id);

      console.log('Portfolio check:', { portfolioData, portfolioError });

      // Check if balance was updated
      const { data: balanceData, error: balanceError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();

      console.log('Balance check:', { balanceData, balanceError });

      toast({
        title: "Purchase Successful",
        description: `Bought ${buyQuantity} share${buyQuantity > 1 ? 's' : ''} of ${selectedPlayer.name} for ${formatPrice(selectedPlayer.current_price * buyQuantity)}`,
      });

      // Refresh user balance
      await fetchUserBalance();
      
      // Close dialog
      setBuyDialogOpen(false);
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Error buying player:', error);
      toast({
        title: "Purchase Failed",
        description: "Failed to complete the purchase",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSellPlayer = (player: Player) => {
    if (!user) return;
    
    setSelectedPlayer(player);
    setSellQuantity(1);
    setSellDialogOpen(true);
  };

  const handleConfirmSell = async () => {
    if (!user || !selectedPlayer) return;

    setIsProcessing(true);
    try {
      // Insert sell transaction - the database trigger will handle portfolio and balance updates
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          player_id: selectedPlayer.id,
          quantity: sellQuantity,
          price: selectedPlayer.current_price,
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
        description: `Sold ${sellQuantity} share${sellQuantity > 1 ? 's' : ''} of ${selectedPlayer.name} for ${formatPrice(selectedPlayer.current_price * sellQuantity)}`,
      });

      // Refresh user balance
      await fetchUserBalance();
      
      // Close dialog
      setSellDialogOpen(false);
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Error selling player:', error);
      toast({
        title: "Sale Failed",
        description: "Failed to complete the sale",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading players...</div>
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
          <h1 className="text-3xl font-bold mb-2">Player Market</h1>
          <p className="text-muted-foreground">Browse and trade football players</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players or teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ALL">All Positions</option>
            {uniquePositions.map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>

          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ALL">All Leagues</option>
            {uniqueLeagues.map(league => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>

          <div className="text-sm text-muted-foreground flex items-center">
            Showing {filteredPlayers.length} of {players.length} players
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold">{player.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{player.team}</p>
                    <p className="text-xs text-muted-foreground">{player.league}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {player.position}
                </Badge>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold font-mono">
                      {formatPrice(player.current_price)}
                    </span>
                    <div className="flex items-center text-green-500">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-mono">+2.3%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={() => handleBuyPlayer(player)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                      onClick={() => handleSellPlayer(player)}
                    >
                      Sell
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No players found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Buy Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buy Shares</DialogTitle>
          </DialogHeader>
          
          {selectedPlayer && (
            <div className="space-y-6">
              {/* Player Info */}
              <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {selectedPlayer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedPlayer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPlayer.team} • {selectedPlayer.position}</p>
                  <p className="text-sm text-muted-foreground">{selectedPlayer.league}</p>
                </div>
              </div>

              {/* Current Price */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold font-mono">{formatPrice(selectedPlayer.current_price)}</p>
              </div>

              {/* Quantity Selection */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Number of Shares</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(buyQuantity - 1)}
                    disabled={buyQuantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="100"
                    value={buyQuantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(buyQuantity + 1)}
                    disabled={buyQuantity >= 100}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Cost:</span>
                  <span className="font-mono font-semibold">{formatPrice(getTotalCost())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Balance:</span>
                  <span className="font-mono">{formatPrice(userBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Remaining Balance:</span>
                  <span className={`font-mono ${getRemainingBalance() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(getRemainingBalance())}
                  </span>
                </div>
              </div>

              {/* Warning if insufficient funds */}
              {!canAfford() && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    Insufficient funds. You need {formatPrice(getTotalCost() - userBalance)} more to complete this purchase.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBuyDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmBuy}
              disabled={!canAfford() || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processing...' : `Buy ${buyQuantity} Share${buyQuantity > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sell Shares</DialogTitle>
          </DialogHeader>
          
          {selectedPlayer && (
            <div className="space-y-6">
              {/* Player Info */}
              <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {selectedPlayer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedPlayer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPlayer.team} • {selectedPlayer.position}</p>
                  <p className="text-sm text-muted-foreground">{selectedPlayer.league}</p>
                </div>
              </div>

              {/* Current Price */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold font-mono">{formatPrice(selectedPlayer.current_price)}</p>
              </div>

              {/* Quantity Selection */}
              <div className="space-y-2">
                <Label htmlFor="sell-quantity">Number of Shares</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSellQuantityChange(sellQuantity - 1)}
                    disabled={sellQuantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    id="sell-quantity"
                    type="number"
                    min="1"
                    max="100"
                    value={sellQuantity}
                    onChange={(e) => handleSellQuantityChange(parseInt(e.target.value) || 1)}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSellQuantityChange(sellQuantity + 1)}
                    disabled={sellQuantity >= 100}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Sale Breakdown */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sale Proceeds:</span>
                  <span className="font-mono font-semibold text-green-600">{formatPrice(selectedPlayer.current_price * sellQuantity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Balance:</span>
                  <span className="font-mono">{formatPrice(userBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Balance:</span>
                  <span className="font-mono text-green-600">{formatPrice(userBalance + (selectedPlayer.current_price * sellQuantity))}</span>
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
              disabled={isProcessing}
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

export default Players;
