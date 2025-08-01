// Script to update player prices in Supabase
// Run this with: node scripts/update-player-prices.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://exfduwwkneyxfododmhi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4ZmR1d3drbmV5eGZvZG9kbWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NzQ4NjEsImV4cCI6MjA2NDQ1MDg2MX0.BGL-F6DowvaCULTMgynYtZ-OmQTDh-Fn2e3reTuZV7c";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Realistic price ranges for different positions (in millions)
const PRICE_RANGES = {
  'Forward': { min: 50, max: 200 }, // €50M - €200M
  'Midfielder': { min: 30, max: 150 }, // €30M - €150M
  'Defender': { min: 20, max: 100 }, // €20M - €100M
  'Goalkeeper': { min: 15, max: 80 }, // €15M - €80M
};

// Generate a random price within the range
function generatePrice(position) {
  const range = PRICE_RANGES[position] || PRICE_RANGES['Midfielder'];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

async function updatePlayerPrices() {
  try {
    console.log('Fetching all players...');
    
    // First, get all players
    const { data: players, error: fetchError } = await supabase
      .from('players')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching players:', fetchError);
      return;
    }
    
    console.log(`Found ${players.length} players`);
    
    if (players.length === 0) {
      console.log('No players found in database');
      return;
    }
    
    // Update each player with a realistic price
    for (const player of players) {
      const newPrice = generatePrice(player.position);
      
      console.log(`Updating ${player.name} (${player.position}) to €${newPrice.toFixed(2)}M`);
      
      const { error: updateError } = await supabase
        .from('players')
        .update({ 
          current_price: newPrice,
          last_updated: new Date().toISOString()
        })
        .eq('id', player.id);
      
      if (updateError) {
        console.error(`Error updating ${player.name}:`, updateError);
      } else {
        console.log(`✅ Updated ${player.name}`);
      }
    }
    
    console.log('✅ All player prices updated successfully!');
    
  } catch (error) {
    console.error('Error updating player prices:', error);
  }
}

// Run the script
updatePlayerPrices(); 