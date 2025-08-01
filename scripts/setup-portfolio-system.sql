-- Portfolio System Setup Script
-- Run this in your Supabase SQL Editor to set up the portfolio system

-- 1. Update existing users who don't have a balance to have a starting balance of €1000
UPDATE public.users 
SET balance = 1000 
WHERE balance IS NULL OR balance = 0;

-- 2. Ensure the users table has the correct structure
-- Add balance column if it doesn't exist (this should already exist based on types)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'balance') THEN
        ALTER TABLE public.users ADD COLUMN balance DECIMAL(10,2) DEFAULT 1000;
    END IF;
END $$;

-- 3. Set default balance for new users
ALTER TABLE public.users ALTER COLUMN balance SET DEFAULT 1000;

-- 4. Ensure portfolio table has proper constraints
ALTER TABLE public.portfolio 
ALTER COLUMN quantity SET DEFAULT 0,
ALTER COLUMN average_buy_price SET DEFAULT 0;

-- 5. Ensure transactions table has proper constraints
ALTER TABLE public.transactions 
ALTER COLUMN quantity SET DEFAULT 1,
ALTER COLUMN price SET DEFAULT 0,
ALTER COLUMN timestamp SET DEFAULT NOW();

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON public.portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_player_id ON public.portfolio(player_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_player_id ON public.transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_users_balance ON public.users(balance);

-- 7. Add a function to handle portfolio updates when buying/selling
CREATE OR REPLACE FUNCTION update_portfolio_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle buy transactions
    IF NEW.type = 'buy' THEN
        -- Check if user has enough balance
        IF (SELECT balance FROM users WHERE id = NEW.user_id) < (NEW.price * NEW.quantity) THEN
            RAISE EXCEPTION 'Insufficient balance';
        END IF;
        
        -- Update user balance
        UPDATE users 
        SET balance = balance - (NEW.price * NEW.quantity)
        WHERE id = NEW.user_id;
        
        -- Update or insert portfolio entry
        INSERT INTO portfolio (user_id, player_id, quantity, average_buy_price)
        VALUES (NEW.user_id, NEW.player_id, NEW.quantity, NEW.price)
        ON CONFLICT (user_id, player_id)
        DO UPDATE SET
            quantity = portfolio.quantity + NEW.quantity,
            average_buy_price = (
                (portfolio.average_buy_price * portfolio.quantity + NEW.price * NEW.quantity) / 
                (portfolio.quantity + NEW.quantity)
            );
    
    -- Handle sell transactions
    ELSIF NEW.type = 'sell' THEN
        -- Check if user has enough shares
        IF (SELECT COALESCE(quantity, 0) FROM portfolio WHERE user_id = NEW.user_id AND player_id = NEW.player_id) < NEW.quantity THEN
            RAISE EXCEPTION 'Insufficient shares';
        END IF;
        
        -- Update user balance
        UPDATE users 
        SET balance = balance + (NEW.price * NEW.quantity)
        WHERE id = NEW.user_id;
        
        -- Update portfolio
        UPDATE portfolio 
        SET quantity = quantity - NEW.quantity
        WHERE user_id = NEW.user_id AND player_id = NEW.player_id;
        
        -- Remove portfolio entry if quantity becomes 0
        DELETE FROM portfolio 
        WHERE user_id = NEW.user_id AND player_id = NEW.player_id AND quantity <= 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for automatic portfolio updates
DROP TRIGGER IF EXISTS trigger_update_portfolio ON transactions;
CREATE TRIGGER trigger_update_portfolio
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_on_transaction();

-- 9. Add unique constraint to portfolio to prevent duplicate entries
ALTER TABLE public.portfolio 
ADD CONSTRAINT portfolio_user_player_unique UNIQUE (user_id, player_id);

-- 10. Verify the setup
SELECT 'Portfolio system setup completed successfully!' as status; 