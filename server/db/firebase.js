const admin = require('firebase-admin');
const path = require('path');

// Initialize the Firebase Admin SDK using the downloaded service account key
const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;
