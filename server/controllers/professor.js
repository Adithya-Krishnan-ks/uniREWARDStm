const supabase = require('../db/supabase');

const getStudents = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, student_id, role, balance, status, name, department, semester')
            .eq('role', 'student')
            .eq('status', 'approved')
            .order('student_id', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        console.error('getStudents error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch students' });
    }
};

const allocatePoints = async (req, res) => {
    try {
        const { studentId, amount, reason } = req.body;
        const professorId = req.user.id;

        if (req.user.role === 'professor' && req.user.status !== 'approved') {
            return res.status(403).json({ success: false, message: 'Your account must be approved by an admin before you can allocate points.' });
        }

        if (!studentId || !amount || amount <= 0 || !reason) {
            return res.status(400).json({ success: false, message: 'Student ID, positive amount, and reason are required' });
        }

        if (amount > 500) {
            return res.status(400).json({ success: false, message: 'You can allocate a maximum of 500 points per transaction.' });
        }

        // 1. Get the student's UUID based on their string studentId
        const { data: student, error: studentError } = await supabase
            .from('profiles')
            .select('id, role, status, balance')
            .eq('student_id', studentId)
            .single();

        if (studentError || !student) {
            return res.status(404).json({ success: false, message: 'Student not found with that ID' });
        }

        if (student.role !== 'student' || student.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Can only allocate points to approved students' });
        }

        const newBalance = student.balance + amount;

        // 2. Update the balance
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', student.id);

        if (updateError) throw updateError;

        // 3. Log the allocation reason
        const { error: logError } = await supabase
            .from('allocation_logs')
            .insert([{
                professor_id: professorId,
                student_id: student.id,
                amount: amount,
                reason: reason
            }]);

        if (logError) {
            console.error('Failed to log allocation:', logError);
            // We still proceed since points were allocated, but log it internally
        }

        res.json({ success: true, message: 'Points allocated successfully', balance: newBalance });
    } catch (err) {
        console.error('Allocation error:', err);
        res.status(500).json({ success: false, message: 'Internal server error during allocation' });
    }
};

module.exports = { getStudents, allocatePoints };
