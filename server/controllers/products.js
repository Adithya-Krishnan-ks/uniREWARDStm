const supabase = require('../db/supabase');

const getProducts = async (req, res) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                *,
                highest_bidder:highest_bidder_id (id, role)
            `)
            .order('id');

        if (error) {
            console.error('Database Products Error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch products' });
        }

        res.json({ success: true, products });
    } catch (err) {
        console.error('Products API error:', err);
        res.status(500).json({ success: false, message: 'Internal server error while fetching products' });
    }
};

const getWonProducts = async (req, res) => {
    try {
        const studentId = req.user.id;
        console.log('Fetching won products for user UUID:', studentId);

        const { data: wonProducts, error } = await supabase
            .from('products')
            .select('*')
            .eq('winner_id', studentId)
            .eq('status', 'completed')
            .order('end_time', { ascending: false });

        if (error) {
            console.error('getWonProducts Supabase Error:', error);
            throw error;
        }

        console.log(`Found ${wonProducts?.length || 0} won products for user ${studentId}`);
        res.json({ success: true, data: wonProducts });
    } catch (err) {
        console.error('getWonProducts error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch your won products' });
    }
};

const getAllWinners = async (req, res) => {
    try {
        const { data: winners, error } = await supabase
            .from('products')
            .select(`
                *,
                winner:winner_id(id, student_id, role)
             `)
            .eq('status', 'completed')
            .not('winner_id', 'is', null)
            .order('end_time', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: winners });
    } catch (err) {
        console.error('getAllWinners error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch winner data' });
    }
};

module.exports = { getProducts, getWonProducts, getAllWinners };
