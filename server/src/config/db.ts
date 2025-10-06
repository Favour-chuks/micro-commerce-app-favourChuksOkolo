import { createClient } from '@supabase/supabase-js';
import {config} from 'dotenv';
import pkg from 'pg';
import fs from 'fs';
const { Client } = pkg;

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabaseHost = process.env.SUPABASE_DB_HOST;
const PORT= 3000;
const databasePassword = process.env.SUPABASE_DATABASE_PASSWORD;


if (!supabaseUrl || !supabaseKey || !supabaseHost || !databasePassword ) {
	throw new Error([
		'Failed to connect to supabase. Missing environment variables.',
		'Set SUPABASE_URL and either SUPABASE_API_KEY (anon/public) or SUPABASE_SERVICE_ROLE_KEY (server) in your environment.',
	].join(' '));
}


const supabase = createClient(supabaseUrl, supabaseKey);



// PostgreSQL client (direct connection to Supabase DB)
const client = new Client({
  host: supabaseHost, // usually something like db.<project>.supabase.co
  port:  PORT,
  user: 'postgres',
  password: databasePassword,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();

// Paste your full schema here
const schemaSQL = fs.readFileSync('schema.txt', 'utf-8');

await client.query(schemaSQL);
console.log('Tables created!');

// Step 2: Populate tables with dummy data
const data = JSON.parse(fs.readFileSync('demo-data.json', 'utf-8'));


// TODO: comeback to deal with the linking of the data entries 





async function insertNewData() {
  try {
    // 1️⃣ Insert users
    const { data: usersInserted, error: usersError } = await supabase
      .from('users')
      .insert(data.users)
      .select();

    if (usersError) throw new Error(`Users insertion failed: ${usersError.message}`);
    if (!usersInserted?.length) throw new Error('No users were inserted');

    console.log(`✅ Users inserted: ${usersInserted.length}`);

    // 2️⃣ Insert carts with user relationships
    const cartsToInsert = data.cart.map((c: any) => ({
      ...c,
      user_id: usersInserted[c.user_index]?.id,
    }));

    // Validate all user IDs exist
    if (cartsToInsert.some((c:any) => !c.user_id)) {
      throw new Error('Invalid user_index in cart data');
    }

    const { data: cartsInserted, error: cartsError } = await supabase
      .from('cart')
      .insert(cartsToInsert)
      .select();

    if (cartsError) throw new Error(`Carts insertion failed: ${cartsError.message}`);
    if (!cartsInserted?.length) throw new Error('No carts were inserted');

    console.log(`✅ Carts inserted: ${cartsInserted.length}`);

    // 3️⃣ Insert cart items with cart relationships
    const cartItemsToInsert = data.cart_items.map((ci: any) => ({
      ...ci,
      cart_id: cartsInserted[ci.cart_index]?.id,
    }));

    // Validate all cart IDs exist
    if (cartItemsToInsert.some((ci:any) => !ci.cart_id)) {
      throw new Error('Invalid cart_index in cart_items data');
    }

    const { data: cartItemsInserted, error: cartItemsError } = await supabase
      .from('cart_item')
      .insert(cartItemsToInsert)
      .select();

    if (cartItemsError) throw new Error(`Cart items insertion failed: ${cartItemsError.message}`);

    console.log(`✅ Cart items inserted: ${cartItemsInserted?.length || 0}`);

    

    return {
      success: true,
      inserted: {
        users: usersInserted.length,
        carts: cartsInserted.length,
        cartItems: cartItemsInserted?.length || 0,
      },
    };

  } catch (error) {
    console.error('❌ Insertion failed:', error);
    
    // Optional: Rollback by deleting inserted data
    // This is pseudo-rollback since Supabase doesn't support transactions across multiple inserts
    // You'd need to implement cleanup logic here if needed
    
    throw error;
  }
}

insertNewData().catch(err => console.error(err));


await client.end();


export { supabase };

