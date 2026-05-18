const supabase = require('../db/supabase');

const allocatePoints = async (req, res) => {
    try {
        const { studentId, amount, studentName } = req.body;

        // studentId here might actually be the university ID (like '24101342') based on the frontend form
        // Let's check how the frontend sends it. In ProfessorDashboard, targetStudentId is the string student_id.
        if (!studentId || !amount || amount <= 0 || !studentName) {
            return res.status(400).json({ success: false, message: 'Student ID, Student Name, and positive amount are required' });
        }

        // Look up the student using their student_id string, not UUID
        const { data: student, error: studentError } = await supabase
            .from('profiles')
            .select('id, role, name')
            .eq('student_id', studentId)
            .single();

        if (studentError || !student) {
            return res.status(404).json({ success: false, message: 'Student not found with that ID' });
        }

        if (student.role !== 'student') {
            return res.status(400).json({ success: false, message: 'Can only allocate points to students' });
        }

        // Validate the student's name matches
        if (!student.name || student.name.trim().toLowerCase() !== studentName.trim().toLowerCase()) {
            return res.status(400).json({ success: false, message: 'Student name does not match the provided ID' });
        }

        const studentUuid = student.id;

        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', studentUuid).single();
        const newBalance = profile.balance + amount;

        await supabase.from('profiles').update({ balance: newBalance }).eq('id', studentUuid);

        // Log the allocation (optional but good practice, the schema has allocation_logs)
        await supabase.from('allocation_logs').insert({
            professor_id: req.user.id,
            student_id: studentUuid,
            amount: amount,
            reason: req.body.reason || 'Allocation'
        });

        res.json({ success: true, message: 'Points allocated successfully', balance: newBalance });
    } catch (err) {
        console.error('Allocation error:', err);
        res.status(500).json({ success: false, message: 'Internal server error during allocation' });
    }
};

module.exports = { allocatePoints };
