-- Create proper RLS policies for all tables

-- Users table policies (for profile access)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Portfolio table policies
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio" ON public.portfolio
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio" ON public.portfolio
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio" ON public.portfolio
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio" ON public.portfolio
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions table policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Match stats can be viewed by everyone (public data)
ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match stats are publicly viewable" ON public.match_stats
  FOR SELECT USING (true);

-- Add foreign key constraints for data integrity
ALTER TABLE public.portfolio 
ADD CONSTRAINT portfolio_player_fk 
FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_player_fk 
FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;

ALTER TABLE public.match_stats 
ADD CONSTRAINT match_stats_player_fk 
FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;