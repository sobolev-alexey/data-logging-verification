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
                const { uid, email, emailVerified } = user;

                if (!uid) {
                    return res.status(400).send({ message: 'User ID not found' });
                }
                if (!email) {
                    return res.status(400).send({ message: 'User email not found' });
                }
                if (!emailVerified) {
                    return res.status(400).send({ message: `User email address ${email} not verified` });
                }

                res.locals = { 
                    ...res.locals, 
                    uid,
                    email,
                    emailVerified
                };

                return next();
            })
            .catch((error) => {
                console.error('verifyToken', error.code, error.message);
                return res.status(401).send({ message: 'Please log in' });
            });
    }
    catch (err) {
        console.error(`${err.code} -  ${err.message}`);
        return res.status(401).send({ message: 'Unauthorized' });
    }
}
