/**
 * Database Seeding Script
 * Generates initial demo users, 50 customer profiles, and 1,250 realistic transactions
 * with genuine, edge-case, and fraud scenarios spanning the past 30 days.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, isNative } = require('../src/config/db');
const store = require('../src/utils/dataStore');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Transaction = require('../src/models/Transaction');
const FraudAlert = require('../src/models/FraudAlert');
const AuditLog = require('../src/models/AuditLog');
const SystemSetting = require('../src/models/SystemSetting');
const { evaluateFallbackRisk } = require('../src/services/fallbackDetector');

const CITIES = [
  'New York, USA',
  'San Francisco, USA',
  'London, UK',
  'Toronto, Canada',
  'Singapore',
  'Sydney, Australia',
  'Frankfurt, Germany',
  'Tokyo, Japan'
];

const FOREIGN_SUSPICIOUS_CITIES = [
  'Lagos, Nigeria',
  'St. Petersburg, Russia',
  'Bucharest, Romania',
  'Panama City, Panama'
];

const MERCHANTS_GENUINE = [
  'Whole Foods Market', 'Amazon Retail', 'Target Store #104', 'Starbucks Coffee',
  'Uber Rides', 'Apple Store Online', 'Netflix Subscription', 'Shell Gas Station',
  'Delta Air Lines', 'Marriott Hotels', 'Best Buy Electronics', 'Costco Wholesale'
];

const MERCHANTS_SUSPICIOUS = [
  'CryptoEx QuickTrade Inc', 'Offshore Escrow Ltd', 'Anonymous VPN Services',
  'Global Remittance Direct', 'QuickCash Express Terminal', 'Alpha Digital Wallet'
];

const FIRST_NAMES = ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Sophia', 'James', 'Isabella', 'William', 'Mia', 'Benjamin', 'Charlotte', 'Lucas', 'Amelia', 'Henry', 'Harper', 'Alexander', 'Evelyn'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

async function seedDatabase() {
  console.log('--- Starting Database Seeding Process ---');
  await connectDB();

  // 1. Clear existing collections
  if (isNative()) {
    console.log('[Native Mongo] Clearing collections...');
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Transaction.deleteMany({});
    await FraudAlert.deleteMany({});
    await AuditLog.deleteMany({});
    await SystemSetting.deleteMany({});
  } else {
    console.log('[Embedded Store] Clearing store...');
    store.clearCollection('users');
    store.clearCollection('customers');
    store.clearCollection('transactions');
    store.clearCollection('alerts');
    store.clearCollection('auditLogs');
    store.clearCollection('settings');
  }

  // 2. Create Users
  console.log('Creating demo users (Admin & Fraud Analyst)...');
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
  const analystPasswordHash = await bcrypt.hash('Analyst@123', salt);

  const demoUsers = [
    {
      _id: 'usr_admin_001',
      name: 'Chief Risk Officer (Admin)',
      email: 'admin@fraudshield.local',
      passwordHash: adminPasswordHash,
      role: 'admin',
      status: 'active',
      createdAt: new Date()
    },
    {
      _id: 'usr_analyst_001',
      name: 'Senior Fraud Analyst',
      email: 'analyst@fraudshield.local',
      passwordHash: analystPasswordHash,
      role: 'analyst',
      status: 'active',
      createdAt: new Date()
    }
  ];

  if (isNative()) {
    await User.insertMany(demoUsers);
  } else {
    store.insertMany('users', demoUsers);
  }

  // 3. Create 50 Customers
  console.log('Generating 50 synthetic customer profiles...');
  const customers = [];
  for (let i = 1; i <= 50; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const tier = i % 4;
    let avg = 45;
    if (tier === 1) avg = 180;
    else if (tier === 2) avg = 750;
    else if (tier === 3) avg = 3200;

    const riskProfile = i % 10 === 0 ? 'HIGH' : (i % 4 === 0 ? 'MEDIUM' : 'LOW');
    const custId = `CUST-${1000 + i}`;

    customers.push({
      customerId: custId,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.org`,
      phone: `+1 (${Math.floor(200 + Math.random()*700)}) ${Math.floor(200 + Math.random()*700)}-${Math.floor(1000 + Math.random()*9000)}`,
      avgAmount: avg,
      maxAmount: avg * 4,
      typicalHourRange: '08:00 - 22:00',
      typicalChannels: ['CARD', 'ONLINE', 'UPI'],
      riskProfile,
      recentTransactionsCount: 25,
      historicalFraudCount: riskProfile === 'HIGH' ? 1 : 0,
      primaryLocation: CITIES[i % CITIES.length],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    });
  }

  if (isNative()) {
    await Customer.insertMany(customers);
  } else {
    store.insertMany('customers', customers);
  }

  // 4. Create 1,250 Synthetic Transactions
  console.log('Generating 1,250 realistic transactions spanning 30 days...');
  const transactions = [];
  const alerts = [];
  const now = Date.now();
  const channels = ['CARD', 'ONLINE', 'WIRE_TRANSFER', 'ATM', 'UPI'];

  for (let i = 1; i <= 1250; i++) {
    const cust = customers[i % customers.length];
    const txId = `TX-${100000 + i}`;
    
    // Spread evenly across 30 days
    const daysAgo = (1250 - i) / 41.6;
    const txTimestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const hour = (i * 7) % 24;
    txTimestamp.setHours(hour, (i * 13) % 60, (i * 17) % 60);

    // Scenarios distribution:
    // 82% normal, 7% legit high-value, 4% velocity burst, 4% account takeover, 1.5% midnight drain, 1.5% card testing
    const rand = Math.random();
    let scenario = 'normal';
    if (rand > 0.96) scenario = 'card_testing';
    else if (rand > 0.93) scenario = 'midnight_drain';
    else if (rand > 0.88) scenario = 'takeover';
    else if (rand > 0.83) scenario = 'velocity_burst';
    else if (rand > 0.75) scenario = 'legit_high';

    let amount = cust.avgAmount * (0.4 + Math.random() * 0.9);
    let channel = channels[i % channels.length];
    let merchant = MERCHANTS_GENUINE[i % MERCHANTS_GENUINE.length];
    let location = cust.primaryLocation;
    let deviceId = `DEV-${cust.customerId}-01`;
    let isNewDevice = 0;
    let isNewLocation = 0;
    let velocity = 1;

    if (scenario === 'legit_high') {
      amount = cust.avgAmount * (3.5 + Math.random() * 3.5);
      merchant = 'Delta Air Lines International';
      channel = 'ONLINE';
    } else if (scenario === 'takeover') {
      amount = cust.avgAmount * (8.0 + Math.random() * 15.0);
      merchant = MERCHANTS_SUSPICIOUS[i % MERCHANTS_SUSPICIOUS.length];
      location = FOREIGN_SUSPICIOUS_CITIES[i % FOREIGN_SUSPICIOUS_CITIES.length];
      deviceId = `DEV-UNKNOWN-${Math.floor(10000 + Math.random() * 90000)}`;
      isNewDevice = 1;
      isNewLocation = 1;
      channel = 'WIRE_TRANSFER';
      txTimestamp.setHours(2, 45, 0); // 2:45 AM
    } else if (scenario === 'velocity_burst') {
      amount = cust.avgAmount * (1.2 + Math.random() * 2.0);
      velocity = Math.floor(6 + Math.random() * 6);
      isNewDevice = 1;
      merchant = 'QuickCash Digital Pay';
      channel = 'ONLINE';
    } else if (scenario === 'midnight_drain') {
      amount = cust.avgAmount * (6.0 + Math.random() * 8.0);
      channel = 'ATM';
      merchant = 'ATM Cash Withdrawal Terminal';
      deviceId = 'ATM-MACH-09';
      isNewDevice = 1;
      isNewLocation = 1;
      txTimestamp.setHours(3, 15, 0); // 3:15 AM
    } else if (scenario === 'card_testing') {
      amount = Number((1.5 + Math.random() * 4.0).toFixed(2));
      velocity = 9;
      channel = 'ONLINE';
      merchant = 'Digital Micro Merchant Services';
      isNewDevice = 1;
    }

    const isNightTx = [0, 1, 2, 3, 4, 5].includes(txTimestamp.getHours()) ? 1 : 0;
    const ratio = Number((amount / (cust.avgAmount + 1e-5)).toFixed(2));

    // Evaluate risk
    const assessment = evaluateFallbackRisk({
      amount,
      customerAvgAmount: cust.avgAmount,
      txVelocity1h: velocity,
      isNewDevice,
      isNewLocation,
      txHour: txTimestamp.getHours(),
      channel,
      historicalFraudCount: cust.historicalFraudCount
    });

    let finalStatus = 'Genuine';
    if (assessment.riskScore >= 75) {
      // Confirmed or Flagged
      finalStatus = (i % 3 === 0) ? 'Confirmed Fraud' : 'Flagged';
    } else if (assessment.riskScore >= 45) {
      finalStatus = (scenario === 'legit_high') ? 'Genuine' : 'Pending Review';
    }

    const txDoc = {
      transactionId: txId,
      customerId: cust.customerId,
      amount: Number(amount.toFixed(2)),
      transactionType: channel,
      channel,
      timestamp: txTimestamp,
      merchant,
      location,
      deviceId,
      customerAvgAmount: cust.avgAmount,
      amountToAvgRatio: ratio,
      txVelocity1h: velocity,
      isNewDevice,
      isNewLocation,
      isNightTx,
      historicalFraudCount: cust.historicalFraudCount,
      daysSinceLastTx: 1.0,
      riskScore: assessment.riskScore,
      riskCategory: assessment.riskCategory,
      anomalyScore: assessment.anomalyScore,
      supervisedProbability: assessment.supervisedProbability,
      predictedClass: assessment.predictedClass,
      finalStatus,
      reasons: assessment.reasons,
      modelVersion: 'v1.2.0',
      detector: 'ml_ensemble_random_forest_isolation_forest',
      createdAt: txTimestamp,
      updatedAt: txTimestamp
    };

    transactions.push(txDoc);

    // Generate Alert for high/critical transactions
    if (assessment.riskScore >= 70) {
      const alertId = `ALT-${20000 + alerts.length + 1}`;
      let invStatus = 'Pending';
      let disposition = null;
      let assignedAnalyst = 'Unassigned';

      if (finalStatus === 'Confirmed Fraud') {
        invStatus = 'Resolved';
        disposition = 'Confirmed Fraud';
        assignedAnalyst = 'Senior Fraud Analyst';
      } else if (i % 2 === 0) {
        invStatus = 'Under Investigation';
        assignedAnalyst = 'Senior Fraud Analyst';
      }

      alerts.push({
        alertId,
        transactionId: txId,
        customerId: cust.customerId,
        amount: txDoc.amount,
        riskScore: assessment.riskScore,
        riskCategory: assessment.riskCategory,
        reasons: assessment.reasons,
        assignedAnalyst,
        investigationStatus: invStatus,
        finalDisposition: disposition,
        analystNotes: [
          {
            note: `Automated ML ensemble alert: Risk score ${assessment.riskScore}/100. Reasons: ${assessment.reasons.join(', ')}`,
            author: 'System Sentinel',
            timestamp: txTimestamp
          },
          ...(disposition ? [{
            note: `Investigation concluded. Verified unauthorized withdrawal pattern and confirmed fraud classification.`,
            author: 'Senior Fraud Analyst',
            timestamp: new Date(txTimestamp.getTime() + 3600000)
          }] : [])
        ],
        resolvedBy: disposition ? 'Senior Fraud Analyst' : null,
        resolvedAt: disposition ? new Date(txTimestamp.getTime() + 3600000) : null,
        createdAt: txTimestamp,
        updatedAt: txTimestamp
      });
    }
  }

  console.log(`Inserting ${transactions.length} transactions and ${alerts.length} fraud alerts...`);
  if (isNative()) {
    await Transaction.insertMany(transactions);
    await FraudAlert.insertMany(alerts);
    await SystemSetting.create({
      lowRiskThreshold: 30,
      mediumRiskThreshold: 60,
      highRiskThreshold: 80,
      autoAlertThreshold: 70,
      activeModelVersion: 'v1.2.0',
      autoFlagNightTransactions: true
    });
    await AuditLog.create({
      logId: 'LOG-INIT-001',
      actorId: 'usr_admin_001',
      actorName: 'Chief Risk Officer (Admin)',
      actorRole: 'admin',
      action: 'SYSTEM_SEEDED',
      entityType: 'System',
      entityId: 'database_seed',
      timestamp: new Date(),
      details: {
        transactionsCount: transactions.length,
        customersCount: customers.length,
        alertsCount: alerts.length
      }
    });
  } else {
    store.insertMany('transactions', transactions);
    store.insertMany('alerts', alerts);
    store.insertOne('auditLogs', {
      logId: 'LOG-INIT-001',
      actorId: 'usr_admin_001',
      actorName: 'Chief Risk Officer (Admin)',
      actorRole: 'admin',
      action: 'SYSTEM_SEEDED',
      entityType: 'System',
      entityId: 'database_seed',
      timestamp: new Date(),
      details: {
        transactionsCount: transactions.length,
        customersCount: customers.length,
        alertsCount: alerts.length
      }
    });
  }

  console.log('================================================================');
  console.log(' Seeding Complete!');
  console.log(` - Users: 2 (Admin: admin@fraudshield.local, Analyst: analyst@fraudshield.local)`);
  console.log(` - Password for demo accounts: Admin@123 / Analyst@123`);
  console.log(` - Customers: ${customers.length}`);
  console.log(` - Transactions: ${transactions.length}`);
  console.log(` - Fraud Alerts: ${alerts.length}`);
  console.log('================================================================');
}

seedDatabase().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Seeding failed with error:', err);
  process.exit(1);
});
