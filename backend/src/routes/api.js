const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const transactionController = require('../controllers/transactionController');
const customerController = require('../controllers/customerController');
const alertController = require('../controllers/alertController');
const reportController = require('../controllers/reportController');
const modelController = require('../controllers/modelController');
const userController = require('../controllers/userController');
const settingsController = require('../controllers/settingsController');

// --- AUTHENTICATION ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);

// --- DASHBOARD ---
router.get('/dashboard/summary', authenticate, dashboardController.getSummary);

// --- TRANSACTIONS ---
router.get('/transactions', authenticate, transactionController.getTransactions);
router.get('/transactions/export', authenticate, transactionController.exportTransactions);
router.get('/transactions/:id', authenticate, transactionController.getTransactionById);
router.post('/transactions/analyze', authenticate, transactionController.analyzeTransaction);
router.post('/transactions/import', authenticate, transactionController.importTransactions);

// --- CUSTOMERS ---
router.get('/customers', authenticate, customerController.getCustomers);
router.get('/customers/:id', authenticate, customerController.getCustomerById);

// --- FRAUD ALERTS ---
router.get('/alerts', authenticate, alertController.getAlerts);
router.get('/alerts/:id', authenticate, alertController.getAlertById);
router.patch('/alerts/:id', authenticate, alertController.updateAlert);
router.post('/alerts/:id/notes', authenticate, alertController.addNote);

// --- REPORTS ---
router.get('/reports/summary', authenticate, reportController.getReportSummary);

// --- ML MODEL PERFORMANCE ---
router.get('/model/status', authenticate, modelController.getModelStatus);
router.get('/model/metrics', authenticate, modelController.getModelMetrics);

// --- USER MANAGEMENT & AUDIT LOGS (Admin only) ---
router.get('/users', authenticate, authorize(['admin']), userController.getUsers);
router.patch('/users/:id', authenticate, authorize(['admin']), userController.updateUser);
router.get('/audit-logs', authenticate, authorize(['admin']), userController.getAuditLogs);

// --- SYSTEM SETTINGS ---
router.get('/settings', authenticate, settingsController.getSettings);
router.patch('/settings', authenticate, authorize(['admin']), settingsController.updateSettings);

module.exports = router;
