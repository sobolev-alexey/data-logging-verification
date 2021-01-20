const cors = require('cors');
const { 
    createUpdateUser, 
    verifyToken, 
    getUser,
    userLogin,
} = require("./controller");
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
    app.post('/create', cors(corsOptions), createUpdateUser);
    app.post('/verify', cors(corsOptions), verifyToken);
    app.post('/update', cors(corsOptions), isAuthenticated, createUpdateUser);
    app.post('/user', cors(corsOptions), isAuthenticated, getUser);
    app.post('/test-auth', cors(corsOptions), userLogin);

    // app.get('/test', createTestToken);
    // app.post('/test', createTestToken);
}