// js/supabase-config.js


const supabaseUrl = 'https://muunpvdviardazbpnxbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11dW5wdmR2aWFyZGF6YnBueGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzcyNjMsImV4cCI6MjA5NDYxMzI2M30.k1mbeMufeNcBIHc253ylisYhV1A86LEJziwgLTHOrto';


try {
    if (typeof supabase === 'undefined') {
        throw new Error('Supabase SDK library failed to load. If you are using Brave or an adblocker (like uBlock Origin), it might be blocking the CDN script. Please disable shields/adblocker for this site and reload.');
    }
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client successfully initialized.');
} catch (error) {
    console.error('Supabase Initialization Error:', error.message);
}
