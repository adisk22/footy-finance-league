import { supabase } from '@/integrations/supabase/client';

export const api = {
  // User operations
  async getUsers() {
    console.log('API: getUsers called - using Supabase client');
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('username');
      
      console.log('API: Supabase response:', { data, error });
      
      if (error) {
        console.error('API: Supabase error:', error);
        throw error;
      }
      
      console.log('API: Returning users:', data);
      return data;
    } catch (error) {
      console.error('API: Error in getUsers:', error);
      throw error;
    }
  },

  async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Player operations
  async getPlayers() {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting players:', error);
      throw error;
    }
  },

  async getPlayerById(playerId: string) {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting player:', error);
      throw error;
    }
  },

  // Portfolio operations
  async getPortfolio(userId: string) {
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select(`
          *,
          players (
            id,
            name,
            position,
            team,
            current_price,
            previous_price
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting portfolio:', error);
      throw error;
    }
  },

  // Transaction operations
  async getTransactions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          players (
            id,
            name,
            position,
            team
          )
        `)
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  },

  // Buy player function - FIXED VERSION
  async buyPlayer(userId: string, playerId: string, quantity: number, price: number) {
    console.log('Buying player:', { userId, playerId, quantity, price });
    
    try {
      // First, check if user has enough balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      
      const totalCost = price * quantity;
      if (user.balance < totalCost) {
        throw new Error('Insufficient balance');
      }

      // Check if user already owns shares of this player
      const { data: existingPortfolio, error: portfolioCheckError } = await supabase
        .from('portfolio')
        .select('quantity, average_buy_price')
        .eq('user_id', userId)
        .eq('player_id', playerId)
        .single();

      let newQuantity, newAveragePrice;

      if (existingPortfolio) {
        // User already owns shares - add to existing quantity
        newQuantity = existingPortfolio.quantity + quantity;
        // Calculate weighted average price
        const existingValue = existingPortfolio.quantity * existingPortfolio.average_buy_price;
        const newValue = quantity * price;
        newAveragePrice = (existingValue + newValue) / newQuantity;
      } else {
        // User doesn't own shares - create new entry
        newQuantity = quantity;
        newAveragePrice = price;
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          player_id: playerId,
          type: 'buy',
          quantity,
          price,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      console.log('Transaction result:', { transaction, transactionError });

      if (transactionError) throw transactionError;

      // Update portfolio using upsert
      const { error: portfolioError } = await supabase
        .from('portfolio')
        .upsert({
          user_id: userId,
          player_id: playerId,
          quantity: newQuantity,
          average_buy_price: newAveragePrice
        }, {
          onConflict: 'user_id,player_id'
        });

      console.log('Portfolio update result:', { portfolioError });

      if (portfolioError) throw portfolioError;

      // Update user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ 
          balance: user.balance - totalCost
        })
        .eq('id', userId);

      console.log('Balance update result:', { balanceError });

      if (balanceError) throw balanceError;

      return transaction;
    } catch (error) {
      console.error('Error in buyPlayer:', error);
      throw error;
    }
  },

  // Sell player function - FIXED VERSION
  async sellPlayer(userId: string, playerId: string, quantity: number, price: number) {
    console.log('Selling player:', { userId, playerId, quantity, price });
    
    try {
      // Check if user has enough shares
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolio')
        .select('quantity, average_buy_price')
        .eq('user_id', userId)
        .eq('player_id', playerId)
        .single();

      if (portfolioError) throw portfolioError;
      
      if (!portfolio || portfolio.quantity < quantity) {
        throw new Error('Insufficient shares');
      }

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          player_id: playerId,
          type: 'sell',
          quantity,
          price,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update portfolio
      if (portfolio.quantity === quantity) {
        // Remove completely if selling all
        const { error: deleteError } = await supabase
          .from('portfolio')
          .delete()
          .eq('user_id', userId)
          .eq('player_id', playerId);

        if (deleteError) throw deleteError;
      } else {
        // Update quantity
        const { error: updateError } = await supabase
          .from('portfolio')
          .update({ quantity: portfolio.quantity - quantity })
          .eq('user_id', userId)
          .eq('player_id', playerId);

        if (updateError) throw updateError;
      }

      // Update user balance
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const { error: balanceError } = await supabase
        .from('users')
        .update({ 
          balance: currentUser.balance + (price * quantity)
        })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      console.log('Sell transaction completed successfully');
      return transaction;
    } catch (error) {
      console.error('Error in sellPlayer:', error);
      throw error;
    }
  },

  async storePlayerStats(stats: {
    player_id: string;
    fbr_player_id: number;
    gameweek: number;
    season: number;
    minutes_played: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: number;
    creativity: number;
    threat: number;
    ict_index: number;
    total_points: number;
    in_dreamteam: boolean;
    form: number;
    points_per_game: number;
    selected_by_percent: number;
    transfers_in_event: number;
    transfers_out_event: number;
  }) {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .upsert(stats, {
          onConflict: 'player_id,gameweek,season'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing player stats:', error);
      throw error;
    }
  },

  async getPlayerStats(playerId: string, gameweek?: number, season?: number) {
    try {
      let query = supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', playerId);
      
      if (gameweek) query = query.eq('gameweek', gameweek);
      if (season) query = query.eq('season', season);
      
      const { data, error } = await query.order('gameweek', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting player stats:', error);
      throw error;
    }
  }
};