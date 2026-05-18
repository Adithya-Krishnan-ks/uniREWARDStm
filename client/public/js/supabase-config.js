// js/supabase-config.js


const supabaseUrl = 'https://muunpvdviardazbpnxbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11dW5wdmR2aWFyZGF6YnBueGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzcyNjMsImV4cCI6MjA5NDYxMzI2M30.k1mbeMufeNcBIHc253ylisYhV1A86LEJziwgLTHOrto';


window.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
