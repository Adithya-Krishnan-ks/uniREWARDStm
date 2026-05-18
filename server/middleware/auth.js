const supabase = require('../db/supabase');

const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Missing or invalid authorization token' });
        }

        const token = authHeader.split(' ')[1];

        // Verify the JWT by fetching the user from Supabase using the token
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        // Fetch user profile to get role, balance, status, student_id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, balance, status, student_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return res.status(401).json({ success: false, message: 'User profile not found' });
        }

        // Attach user and profile to request object
        req.user = {
            id: user.id,
            email: user.email,
            ...profile
        };

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ success: false, message: 'Internal server error during authentication' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Requires one of these roles: ${roles.join(', ')}`
            });
        }
        next();
    };
};

module.exports = { authenticateUser, requireRole };
