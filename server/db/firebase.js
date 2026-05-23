const admin = require('firebase-admin');
const path = require('path');

let serviceAccount;

// Try loading from environment variable first (for production/Render)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:', err);
  }
}

// Fallback to local file (for local development)
if (!serviceAccount) {
  try {
    const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
    serviceAccount = require(serviceAccountPath);
  } catch (err) {
    console.error('Failed to load local firebase-service-account.json file:', err.message);
  }
}

if (!serviceAccount) {
  throw new Error('Firebase Admin SDK initialization failed: No service account credentials found. Please set FIREBASE_SERVICE_ACCOUNT env var or add firebase-service-account.json file.');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;
