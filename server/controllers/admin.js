const supabase = require('../db/supabase');

const getUsers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('role', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        console.error('getUsers error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({ status })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: `User status updated to ${status}`, data });
    } catch (err) {
        console.error('updateUserStatus error:', err);
        res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
};

const updateUserPoints = async (req, res) => {
    try {
        const { userId, balance } = req.body;
        if (balance < 0) {
            return res.status(400).json({ success: false, message: 'Balance cannot be negative' });
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({ balance })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'User points updated', data });
    } catch (err) {
        console.error('updateUserPoints error:', err);
        res.status(500).json({ success: false, message: 'Failed to update points' });
    }
};

const getAllocations = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('allocation_logs')
            .select(`
                *,
                professor:professor_id(id, role, student_id),
                student:student_id(id, role, student_id)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        console.error('getAllocations error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch allocations' });
    }
};

const addProduct = async (req, res) => {
    try {
        const { name, description, base_price, start_time, end_time } = req.body;
        if (!name || base_price < 0 || !start_time) {
            return res.status(400).json({ success: false, message: 'Missing required product fields' });
        }

        const { data, error } = await supabase
            .from('products')
            .insert([{
                name,
                description,
                base_price,
                highest_bid: base_price,
                start_time,
                end_time,
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'Product added successfully', data });
    } catch (err) {
        console.error('addProduct error:', err);
        res.status(500).json({ success: false, message: 'Failed to add product' });
    }
};

const declareWinner = async (req, res) => {
    try {
        const { productId, winnerId } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Missing product ID' });
        }

        // Fetch product to ensure it exists
        const { data: product, error: prodErr } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (prodErr || !product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // If there is a winner, deduct their points
        if (winnerId) {
            const { data: profile, error: profErr } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', winnerId)
                .single();

            if (profErr || !profile) {
                return res.status(404).json({ success: false, message: 'Winner profile not found' });
            }

            // We deduct even if balance might go negative in absolute edge cases, 
            // but ideally we check if they have enough balance.
            const newBalance = Math.max(0, profile.balance - product.highest_bid);

            const { error: deductErr } = await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', winnerId);

            if (deductErr) {
                return res.status(500).json({ success: false, message: 'Failed to deduct points from winner' });
            }
        }

        // Update product status to completed and set winner
        const { data, error } = await supabase
            .from('products')
            .update({ status: 'completed', winner_id: winnerId || null, end_time: new Date().toISOString() })
            .eq('id', productId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'Winner declared successfully', data });
    } catch (err) {
        console.error('declareWinner error:', err);
        res.status(500).json({ success: false, message: 'Failed to declare winner' });
    }
};

module.exports = {
    getUsers,
    updateUserStatus,
    updateUserPoints,
    getAllocations,
    addProduct,
    declareWinner
};
