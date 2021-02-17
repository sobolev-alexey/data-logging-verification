const cors = require('cors');
const { log, read, verify, trade_verify } = require('./dataController');

const whitelist = [
    'http://localhost:3000', 
    'https://data-logging-verification.web.app', 
    'https://data-logging-verification.firebaseapp.com'
];
const corsOptions = {
    // methods: ["GET, POST, OPTIONS"],
    // allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null);
        } else {
            console.error('Not allowed by CORS', origin);
            callback(new Error('Not allowed by CORS ' + origin));
        }
    }
};

exports.routesConfig = app => {
    app.post('/log', cors(corsOptions), log);
    app.post('/read', cors(corsOptions), read);
    app.post('/verify', cors(corsOptions), verify);
    app.post('/trade_verify', cors(corsOptions), trade_verify);
}