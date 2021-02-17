const { log, read, verify, trade_verify } = require('./dataController');

exports.routesConfig = app => {
    app.post('/log', log);
    app.post('/read', read);
    app.post('/verify', verify);
    app.post('/trade_verify', trade_verify);
}