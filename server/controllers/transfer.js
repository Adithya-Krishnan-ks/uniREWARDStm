const supabase = require('../db/supabase');

const transferPoints = async (req, res) => {
    try {
        const { studentId, amount, receiverName } = req.body;
        const senderId = req.user.id;

        if (!studentId || !amount || amount <= 0 || !receiverName) {
            return res.status(400).json({ success: false, message: 'Receiver Student ID, Receiver Name, and positive amount are required' });
        }

        // Look up the receiver's UUID using their string studentId
        const { data: receiver, error: receiverError } = await supabase
            .from('profiles')
            .select('id, student_id, name')
            .eq('student_id', studentId)
            .single();

        if (receiverError || !receiver) {
            return res.status(404).json({ success: false, message: 'Receiver not found with that Student ID' });
        }

        // Validate the receiver's name matches
        if (!receiver.name || receiver.name.trim().toLowerCase() !== receiverName.trim().toLowerCase()) {
            return res.status(400).json({ success: false, message: 'Receiver name does not match the provided ID' });
        }

        const receiverId = receiver.id;

        if (senderId === receiverId) {
            return res.status(400).json({ success: false, message: 'Cannot transfer points to yourself' });
        }

        // Call the RPC function using the Service Role Key
        // This executes securely on the backend, bypassing RLS but utilizing our strict RPC logic
        const { error: rpcError } = await supabase.rpc('transfer_points', {
            sender: senderId,
            receiver: receiverId,
            transfer_amount: amount
        });

        if (rpcError) {
            console.error('RPC Transfer Error:', rpcError);

            // Handle known errors from our RPC
            if (rpcError.message.includes('Insufficient balance')) {
                return res.status(400).json({ success: false, message: 'Insufficient balance for transfer' });
            }
            if (rpcError.message.includes('Sender not found') || rpcError.message.includes('receiver_id')) {
                return res.status(400).json({ success: false, message: 'Invalid sender or receiver' });
            }

            return res.status(500).json({ success: false, message: 'Transfer failed' });
        }

        res.json({ success: true, message: 'Points transferred successfully' });

    } catch (err) {
        console.error('Transfer API error:', err);
        res.status(500).json({ success: false, message: 'Internal server error during transfer' });
    }
};

module.exports = { transferPoints };
