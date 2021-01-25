const firebase = require('firebase');

exports.isAuthenticated = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization)
        return res.status(401).send({ message: 'Unauthorized' });

    if (!authorization.startsWith('Bearer'))
        return res.status(401).send({ message: 'Unauthorized' });

    const split = authorization.split('Bearer ');
    if (split.length !== 2)
        return res.status(401).send({ message: 'Unauthorized' });

    try {
        const token = split[1];

        firebase.auth().signInWithCustomToken(token)
            .then((userCredential) => {
                const user = userCredential.user;
                res.locals = { 
                    ...res.locals, 
                    uid: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified
                };
                return next();
            })
            .catch((error) => {
                console.error('verifyToken', error.code, error.message);
                return res.status(401).send({ message: 'Unauthorized' });
            });
    }
    catch (err) {
        console.error(`${err.code} -  ${err.message}`);
        return res.status(401).send({ message: 'Unauthorized' });
    }
}
