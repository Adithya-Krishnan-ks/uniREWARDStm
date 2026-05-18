require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testProducts() {
    console.log("Fetching products...");
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
        console.error("Error fetching:", error);
    } else {
        console.log("Products schema check:", data.length > 0 ? Object.keys(data[0]) : "No products found");
    }
}

testProducts();
