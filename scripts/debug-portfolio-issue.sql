-- Debug Portfolio Issue Script
-- Run this in your Supabase SQL Editor to identify and fix the issue

-- Step 1: Check if the trigger function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'update_portfolio_on_transaction';

-- Step 2: Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_portfolio';

-- Step 3: Check if users have balance
SELECT 
    id,
    email,
    balance
FROM users 
LIMIT 5;

-- Step 4: Check recent transactions
SELECT 
    id,
    user_id,
    player_id,
    quantity,
    price,
    type,
    timestamp
FROM transactions 
ORDER BY timestamp DESC 
LIMIT 5;

-- Step 5: Check portfolio entries
SELECT 
    id,
    user_id,
    player_id,
    quantity,
    average_buy_price
FROM portfolio 
LIMIT 5;

-- Step 6: If trigger doesn't exist, create it
-- (Only run this if Step 1 shows no results)

-- Create the trigger function
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

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_portfolio ON transactions;
CREATE TRIGGER trigger_update_portfolio
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_on_transaction();

-- Step 7: Ensure users have balance
UPDATE users 
SET balance = 1000 
WHERE balance IS NULL OR balance = 0;

-- Step 8: Add unique constraint if it doesn't exist
ALTER TABLE portfolio 
ADD CONSTRAINT IF NOT EXISTS portfolio_user_player_unique 
UNIQUE (user_id, player_id);

-- Step 9: Test the trigger with a sample transaction
-- (Replace 'your-user-id' and 'your-player-id' with actual values)
-- INSERT INTO transactions (user_id, player_id, quantity, price, type) 
-- VALUES ('your-user-id', 'your-player-id', 1, 100, 'buy');

-- Step 10: Verify everything is working
SELECT 'Debug script completed! Check the results above.' as status; 