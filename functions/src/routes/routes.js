const cors = require('cors');
const { 
    verifyToken, 
    // getUser,
    login,
    completeLogin,
    register,
    completeRegistration
} = require("./accessController");
const { 
    log, 
    read,
    verify,
    trade_verify
} = require("./dataController");
const { isAuthenticated } = require("../auth/authenticated");
const { isAuthorized } = require("../auth/authorized");

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
    app.post('/verify', cors(corsOptions), verifyToken);
    app.post('/login', cors(corsOptions), login);

    app.post('/log', cors(corsOptions), isAuthenticated, isAuthorized, log);
    app.post('/read', cors(corsOptions), isAuthenticated, isAuthorized, read);
    app.post('/verify', cors(corsOptions), isAuthenticated, isAuthorized, verify);
    app.post('/trade_verify', cors(corsOptions), isAuthenticated, isAuthorized, trade_verify);

    app.post('/register', register);
    app.get('/register-complete', completeRegistration);
    app.get('/login-complete', completeLogin);
    // app.get('/test', createTestToken);
    // app.post('/test', createTestToken);
}