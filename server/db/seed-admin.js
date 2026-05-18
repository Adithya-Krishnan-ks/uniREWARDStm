const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
    const email = 'adminadi@ug.in';
    const password = '24101342';

    console.log(`Setting up Admin Account: ${email}...`);

    // 1. Create the user in Auth
    // We use admin API to circumvent standard rules
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            role: 'admin',
            student_id: null
        }
    });

    if (authError) {
        if (authError.message.includes('already exists') || authError.status === 422) {
            console.log(`User ${email} might already exist. Updating role instead.`);

            // Try to look up by email via auth.listUsers or just query profiles directly
            const { data: users, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
                console.error('Failed to list users:', listError);
                return;
            }
            const existingUser = users.users.find(u => u.email === email);
            if (existingUser) {
                await updateProfileToAdmin(existingUser.id);
            } else {
                console.log('Could not find existing user ID to update.');
            }
            return;
        }
        console.error('Error creating user:', authError.message);
        return;
    }

    console.log(`User created in auth.users with ID: ${user.id}`);

    // 2. Wait a brief moment to let the database trigger `handle_new_user` create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    await updateProfileToAdmin(user.id);
}

async function updateProfileToAdmin(userId) {
    // 3. Update the profile to make them an 'admin' and 'approved'
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            role: 'admin',
            status: 'approved'
        })
        .eq('id', userId);

    if (profileError) {
        console.error('Error updating profile role:', profileError.message);
    } else {
        console.log('✅ Admin account configured successfully! You can now log in.');
    }
}

createAdmin();
