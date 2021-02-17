const functions = require('firebase-functions');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { routesConfig } = require('./routes/routes');
require('./firebaseInit');

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: true }));
routesConfig(app);

exports.api = functions.https.onRequest(app);
