const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const path = require('path');

// Routes
app.use('/api', apiRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/public')));

// Catch-all route to redirect unknown paths to index.html (useful if needed, but not strictly required for multi-page)
// If we are strictly multiple html files, users will navigate to /dashboard.html, etc.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
