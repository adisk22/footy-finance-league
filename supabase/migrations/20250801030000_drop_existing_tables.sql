-- Drop existing tables (keeping players)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.portfolio CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.match_stats CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_portfolio_on_transaction() CASCADE;

