# Portfolio System Setup

## Overview
This document outlines the portfolio system implementation for the Footy Finance League application. The system now includes proper user balances, automated portfolio management, and database triggers for transaction handling.

## What's Been Implemented

### 1. User Balance System
- **Starting Balance**: All new users receive €1000 as their starting balance
- **Existing Users**: Users who previously had 0 or null balance will be updated to have €1000
- **Automatic Balance Management**: User balances are automatically updated when buying/selling players

### 2. Database Structure
The following database components have been set up:

#### Users Table
- `balance` field with default value of 1000
- Automatic balance updates on transactions

#### Portfolio Table
- Tracks user holdings for each player
- Stores quantity and average buy price
- Unique constraint on (user_id, player_id) to prevent duplicates

#### Transactions Table
- Records all buy/sell transactions
- Automatic timestamp and default values

### 3. Database Triggers
A PostgreSQL trigger function has been created that automatically:
- **Buy Transactions**: 
  - Checks if user has sufficient balance
  - Deducts purchase amount from balance
  - Updates portfolio with new shares and recalculates average price
- **Sell Transactions**:
  - Checks if user has sufficient shares
  - Adds sale proceeds to balance
  - Updates portfolio quantity or removes entry if quantity reaches 0

### 4. Frontend Updates

#### AuthContext.tsx
- Enhanced to ensure all users have a balance
- `ensureUserBalance()` function checks and sets balance for existing users
- Automatic balance setup on sign-in and sign-up

#### Portfolio.tsx
- Simplified sell functionality to use database triggers
- Enhanced balance fetching with fallback to starting amount
- Better error handling for insufficient funds/shares

#### Players.tsx
- Simplified buy/sell functionality to use database triggers
- Removed manual portfolio and balance updates
- Better error handling for transaction failures

## Setup Instructions

### 1. Database Setup
Run the SQL script in your Supabase SQL Editor:
```sql
-- Copy and paste the contents of scripts/setup-portfolio-system.sql
```

### 2. Verify Setup
After running the script, you should see:
- All existing users have a balance of €1000
- New users automatically get €1000 starting balance
- Portfolio and transaction triggers are working

### 3. Testing the System
1. **New User Registration**: New users should automatically receive €1000
2. **Existing User Login**: Existing users should have their balance updated to €1000
3. **Buying Players**: Users can buy players if they have sufficient balance
4. **Selling Players**: Users can sell players they own
5. **Portfolio Updates**: Portfolio automatically updates when transactions occur

## Key Features

### Automatic Portfolio Management
- No manual portfolio updates needed
- Average buy price automatically calculated
- Portfolio entries removed when quantity reaches 0

### Balance Protection
- Users cannot buy players without sufficient funds
- Users cannot sell players they don't own
- All transactions are atomic (all-or-nothing)

### Performance Optimizations
- Database indexes on frequently queried columns
- Efficient trigger-based updates
- Proper foreign key constraints

## Error Handling
The system includes comprehensive error handling:
- Insufficient balance errors
- Insufficient shares errors
- Database constraint violations
- User-friendly error messages

## Future Enhancements
Potential improvements for the portfolio system:
- Transaction history page
- Portfolio performance analytics
- Price alerts
- Bulk buy/sell operations
- Portfolio diversification metrics

## Troubleshooting

### Common Issues
1. **Users still have 0 balance**: Run the SQL script again to update existing users
2. **Transactions failing**: Check if the trigger function was created successfully
3. **Portfolio not updating**: Verify the trigger is active on the transactions table

### Manual Balance Updates
If needed, you can manually update user balances:
```sql
UPDATE users SET balance = 1000 WHERE balance IS NULL OR balance = 0;
```

## Security Considerations
- Row Level Security (RLS) policies are in place
- Users can only access their own data
- All transactions are validated at the database level
- No client-side balance manipulation possible 