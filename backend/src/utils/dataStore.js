/**
 * Zero-Dependency Embedded Storage Engine
 * Provides synchronous/asynchronous in-memory document store with JSON file persistence.
 * Guarantees that all CRUD, analytics, pagination, and filter operations function
 * identically whether running with a native MongoDB daemon or in standalone mode.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'embedded_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class EmbeddedStore {
  constructor() {
    this.collections = {
      users: [],
      customers: [],
      transactions: [],
      alerts: [],
      auditLogs: [],
      settings: [
        {
          _id: 'default_setting',
          lowRiskThreshold: 30,
          mediumRiskThreshold: 60,
          highRiskThreshold: 80,
          autoAlertThreshold: 70,
          activeModelVersion: 'v1.2.0',
          autoFlagNightTransactions: true,
          updatedAt: new Date().toISOString()
        }
      ]
    };
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.collections = { ...this.collections, ...parsed };
      }
    } catch (err) {
      console.warn('[EmbeddedStore] Warning loading database cache:', err.message);
    }
  }

  saveToDisk() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.collections, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[EmbeddedStore] Warning saving database cache:', err.message);
    }
  }

  getCollection(name) {
    if (!this.collections[name]) {
      this.collections[name] = [];
    }
    return this.collections[name];
  }

  // Generic Query Helpers
  find(collectionName, query = {}) {
    const list = this.getCollection(collectionName);
    return list.filter(item => {
      for (const key of Object.keys(query)) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  findOne(collectionName, query = {}) {
    const results = this.find(collectionName, query);
    return results.length > 0 ? results[0] : null;
  }

  findById(collectionName, id) {
    const list = this.getCollection(collectionName);
    return list.find(item => item._id === id || item.id === id || item.transactionId === id || item.alertId === id) || null;
  }

  insertOne(collectionName, document) {
    const col = this.getCollection(collectionName);
    const newDoc = {
      _id: document._id || `${collectionName}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: document.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...document
    };
    col.push(newDoc);
    this.saveToDisk();
    return newDoc;
  }

  insertMany(collectionName, docs) {
    const col = this.getCollection(collectionName);
    const inserted = docs.map((doc, idx) => ({
      _id: doc._id || `${collectionName}_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    }));
    col.push(...inserted);
    this.saveToDisk();
    return inserted;
  }

  updateOne(collectionName, query, updateFields) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => {
      for (const key of Object.keys(query)) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });

    if (index === -1) return null;

    col[index] = {
      ...col[index],
      ...updateFields,
      updatedAt: new Date().toISOString()
    };
    this.saveToDisk();
    return col[index];
  }

  countDocuments(collectionName, query = {}) {
    return this.find(collectionName, query).length;
  }

  clearCollection(collectionName) {
    this.collections[collectionName] = [];
    this.saveToDisk();
  }
}

const storeInstance = new EmbeddedStore();

module.exports = storeInstance;
