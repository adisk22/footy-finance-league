
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
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
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlayers();
  }, []);

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

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = selectedPosition === 'ALL' || player.position === selectedPosition;
    const matchesLeague = selectedLeague === 'ALL' || player.league === selectedLeague;
    
    return matchesSearch && matchesPosition && matchesLeague;
  });

  const uniquePositions = [...new Set(players.map(p => p.position))];
  const uniqueLeagues = [...new Set(players.map(p => p.league))];

  const formatPrice = (price: number) => {
    return `€${(price / 1000000).toFixed(2)}M`;
  };

  const handleBuyPlayer = async (player: Player) => {
    if (!user) return;

    // Check if user has enough balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.balance < player.current_price) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough balance to buy this player",
        variant: "destructive"
      });
      return;
    }

    try {
      // Insert transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          player_id: player.id,
          quantity: 1,
          price: player.current_price,
          type: 'buy'
        });

      if (transactionError) throw transactionError;

      // Update or create portfolio entry
      const { data: existingPortfolio, error: portfolioFetchError } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .eq('player_id', player.id)
        .maybeSingle();

      if (portfolioFetchError) throw portfolioFetchError;

      if (existingPortfolio) {
        // Update existing portfolio entry
        const newQuantity = Number(existingPortfolio.quantity) + 1;
        const newAverage = ((Number(existingPortfolio.average_buy_price) * Number(existingPortfolio.quantity)) + player.current_price) / newQuantity;
        
        const { error: updateError } = await supabase
          .from('portfolio')
          .update({
            quantity: newQuantity,
            average_buy_price: newAverage
          })
          .eq('id', existingPortfolio.id);

        if (updateError) throw updateError;
      } else {
        // Create new portfolio entry
        const { error: insertError } = await supabase
          .from('portfolio')
          .insert({
            user_id: user.id,
            player_id: player.id,
            quantity: 1,
            average_buy_price: player.current_price
          });

        if (insertError) throw insertError;
      }

      // Update user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: userData.balance - player.current_price })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      toast({
        title: "Purchase Successful",
        description: `Bought 1 share of ${player.name} for ${formatPrice(player.current_price)}`,
      });
    } catch (error) {
      console.error('Error buying player:', error);
      toast({
        title: "Purchase Failed",
        description: "Failed to complete the purchase",
        variant: "destructive"
      });
    }
  };

  const handleSellPlayer = async (player: Player) => {
    if (!user) return;
    
    try {
      // Check if user owns this player
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .eq('player_id', player.id)
        .maybeSingle();

      if (portfolioError || !portfolio || Number(portfolio.quantity) <= 0) {
        toast({
          title: "Sale Failed",
          description: "You don't own any shares of this player",
          variant: "destructive"
        });
        return;
      }

      // Insert sell transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          player_id: player.id,
          quantity: 1,
          price: player.current_price,
          type: 'sell'
        });

      if (transactionError) throw transactionError;

      // Update portfolio
      const newQuantity = Number(portfolio.quantity) - 1;
      
      if (newQuantity > 0) {
        const { error: updateError } = await supabase
          .from('portfolio')
          .update({ quantity: newQuantity })
          .eq('id', portfolio.id);

        if (updateError) throw updateError;
      } else {
        // Remove from portfolio if quantity reaches 0
        const { error: deleteError } = await supabase
          .from('portfolio')
          .delete()
          .eq('id', portfolio.id);

        if (deleteError) throw deleteError;
      }

      // Update user balance
      const { data: userData } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (userData) {
        const { error: balanceError } = await supabase
          .from('users')
          .update({ balance: userData.balance + player.current_price })
          .eq('id', user.id);

        if (balanceError) throw balanceError;
      }

      toast({
        title: "Sale Successful",
        description: `Sold 1 share of ${player.name} for ${formatPrice(player.current_price)}`,
      });
    } catch (error) {
      console.error('Error selling player:', error);
      toast({
        title: "Sale Failed",
        description: "Failed to complete the sale",
        variant: "destructive"
      });
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
    </div>
  );
};

export default Players;
