const db = require('../db/firebase');

const getRules = async (req, res) => {
    try {
        const snapshot = await db.collection('allocation_rules').orderBy('points', 'asc').get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data });
    } catch (err) {
        console.error('getRules error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch allocation rules' });
    }
};

const createRule = async (req, res) => {
    try {
        const { title, description, points } = req.body;

        if (!title || !points) {
            return res.status(400).json({ success: false, message: 'Title and points are required' });
        }

        const newRule = { title, description, points, created_at: new Date().toISOString() };
        const docRef = await db.collection('allocation_rules').add(newRule);
        
        res.json({ success: true, data: { id: docRef.id, ...newRule }, message: 'Rule created successfully' });
    } catch (err) {
        console.error('createRule error:', err);
        res.status(500).json({ success: false, message: 'Failed to create rule' });
    }
};

const updateRule = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, points } = req.body;

        const updateData = { title, description, points, updated_at: new Date().toISOString() };
        await db.collection('allocation_rules').doc(id).update(updateData);
        
        const doc = await db.collection('allocation_rules').doc(id).get();
        res.json({ success: true, data: { id: doc.id, ...doc.data() }, message: 'Rule updated successfully' });
    } catch (err) {
        console.error('updateRule error:', err);
        res.status(500).json({ success: false, message: 'Failed to update rule' });
    }
};

const deleteRule = async (req, res) => {
    try {
        const { id } = req.params;

        await db.collection('allocation_rules').doc(id).delete();

        res.json({ success: true, message: 'Rule deleted successfully' });
    } catch (err) {
        console.error('deleteRule error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete rule' });
    }
};

module.exports = { getRules, createRule, updateRule, deleteRule };
