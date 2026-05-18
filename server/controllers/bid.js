const supabase = require('../db/supabase');

const placeBid = async (req, res) => {
    try {
        const { productId, amount } = req.body;
        const bidderId = req.user.id;

        if (!productId || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Product ID and positive amount are required' });
        }

        // Backend pre-check: ensure user has enough balance considering other active bids
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', bidderId)
            .single();

        if (profileErr || !profile) {
            return res.status(500).json({ success: false, message: 'Could not fetch user profile' });
        }

        const { data: activeWinningBids, error: bidsErr } = await supabase
            .from('products')
            .select('highest_bid')
            .eq('highest_bidder_id', bidderId)
            .eq('status', 'active')
            .neq('id', productId);

        if (bidsErr) {
            return res.status(500).json({ success: false, message: 'Could not fetch active bids' });
        }

        const totalActiveBidsAmount = activeWinningBids ? activeWinningBids.reduce((sum, item) => sum + item.highest_bid, 0) : 0;

        if (profile.balance < (totalActiveBidsAmount + amount)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Insufficient balance to place this bid (including other active bids)' 
            });
        }

        // Call the RPC function using the Service Role Key
        const { error: rpcError } = await supabase.rpc('place_bid', {
            product: productId,
            bidder: bidderId,
            bid_amount: amount
        });

        if (rpcError) {
            console.error('RPC Bid Error:', rpcError);

            // Handle known errors from our RPC
            if (rpcError.message.includes('Bid must be higher')) {
                return res.status(400).json({ success: false, message: 'Bid must be higher than current highest bid' });
            }
            if (rpcError.message.includes('Product not found')) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            if (rpcError.message.includes('Insufficient balance')) {
                return res.status(400).json({ success: false, message: 'Insufficient balance to place this bid' });
            }

            return res.status(500).json({ success: false, message: 'Bidding failed' });
        }

        res.json({ success: true, message: 'Bid placed successfully' });

    } catch (err) {
        console.error('Bid API error:', err);
        res.status(500).json({ success: false, message: 'Internal server error during bidding' });
    }
};

module.exports = { placeBid };
