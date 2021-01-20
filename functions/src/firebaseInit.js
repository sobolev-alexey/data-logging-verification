const admin = require('firebase-admin');
const firebase = require('firebase');
const config = require('./data-logging-verification.json');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

firebase.initializeApp(config);