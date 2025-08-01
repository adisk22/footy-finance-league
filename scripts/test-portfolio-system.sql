-- Test Portfolio System Script
-- Run this after applying the main setup script to verify everything works

-- Test 1: Check if all required tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('users', 'portfolio', 'transactions', 'players')
AND table_schema = 'public';

-- Test 2: Check if trigger function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_name = 'update_portfolio_on_transaction'
AND routine_schema = 'public';

-- Test 3: Check if trigger exists and is active
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_portfolio'
AND event_object_table = 'transactions';

-- Test 4: Check if users have balance
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN balance IS NULL OR balance = 0 THEN 1 END) as users_without_balance,
    COUNT(CASE WHEN balance > 0 THEN 1 END) as users_with_balance
FROM users;

-- Test 5: Check if there are any existing transactions
SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN type = 'buy' THEN 1 END) as buy_transactions,
    COUNT(CASE WHEN type = 'sell' THEN 1 END) as sell_transactions
FROM transactions;

-- Test 6: Check if there are any existing portfolio entries
SELECT 
    COUNT(*) as total_portfolio_entries,
    COUNT(CASE WHEN quantity > 0 THEN 1 END) as active_holdings
FROM portfolio;

-- Test 7: Check if unique constraint exists on portfolio
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'portfolio' 
AND constraint_name = 'portfolio_user_player_unique';

-- Test 8: Check if indexes exist
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('portfolio', 'transactions', 'users')
AND indexname LIKE 'idx_%';

-- Test 9: Sample data check (replace with actual user and player IDs)
-- SELECT 
--     u.email,
--     u.balance,
--     p.name as player_name,
--     pf.quantity,
--     pf.average_buy_price
-- FROM users u
-- LEFT JOIN portfolio pf ON u.id = pf.user_id
-- LEFT JOIN players p ON pf.player_id = p.id
-- WHERE u.id = 'your-user-id-here';

-- Test 10: Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('users', 'portfolio', 'transactions');

-- Summary
SELECT 'Portfolio system test completed! Check the results above.' as status; 