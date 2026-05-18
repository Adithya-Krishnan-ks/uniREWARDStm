const express = require('express');
const router = express.Router();
const { authenticateUser, requireRole } = require('../middleware/auth');

const { transferPoints } = require('../controllers/transfer');
const { placeBid } = require('../controllers/bid');
const { getProducts, getWonProducts, getAllWinners } = require('../controllers/products');

const adminCtrl = require('../controllers/admin');
const profCtrl = require('../controllers/professor');
const rulesCtrl = require('../controllers/rules');

// --- Shared Public Routes --- //
router.get('/products', getProducts);

// Protected routes (require valid JWT)
router.use(authenticateUser);

// --- Rules Routes --- //
router.get('/rules', rulesCtrl.getRules); // Open to all authenticated users
router.post('/admin/rules', requireRole(['admin']), rulesCtrl.createRule);
router.put('/admin/rules/:id', requireRole(['admin']), rulesCtrl.updateRule);
router.delete('/admin/rules/:id', requireRole(['admin']), rulesCtrl.deleteRule);

// --- Admin Routes --- //
router.get('/admin/users', requireRole(['admin']), adminCtrl.getUsers);
router.put('/admin/users/status', requireRole(['admin']), adminCtrl.updateUserStatus);
router.put('/admin/users/points', requireRole(['admin']), adminCtrl.updateUserPoints);
router.get('/admin/allocations', requireRole(['admin']), adminCtrl.getAllocations);
router.post('/admin/products', requireRole(['admin']), adminCtrl.addProduct);
router.post('/admin/products/winner', requireRole(['admin']), adminCtrl.declareWinner);
router.get('/admin/winners', requireRole(['admin']), getAllWinners);

// --- Professor Routes --- //
router.get('/professor/students', requireRole(['professor', 'admin']), profCtrl.getStudents);
router.post('/professor/allocate', requireRole(['professor', 'admin']), profCtrl.allocatePoints);

// --- Student Routes --- //
router.post('/transfer', requireRole(['student']), transferPoints);
router.post('/bid', requireRole(['student']), placeBid);
router.get('/products/won', requireRole(['student']), getWonProducts);

module.exports = router;
