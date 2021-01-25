// const crypto = require('crypto');
const admin = require('firebase-admin');
const firebase = require('firebase');
const { firebaseUrl } = require('../config');
const { verifyToken } = require("../helpers");
const { verifySignature } = require("../encryption");
const {
    getUser,
    register,
    completeRegistration,
    completeLogin,
    getSettings
} = require("../firebase");


// // Retrieve user
// const user = await admin.auth().getUser(params.userId);

exports.verifyToken = async (req, res) => {
    try {
        // const settings = await getSettings();
        // console.log(settings)
        // console.log('====================')
        // console.log(settings.keys.publicKey)
        
        // Check Fields
        const params = req.body;
        if (!params || !params.token) {
            console.error("Verify token failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        await verifyToken(params.token);
        return res.json({ status: "success" });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.login = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || !params.email || !params.signature) {
            console.error("Log in user failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are provided" });
        }

        admin
            .auth()
            .getUserByEmail(params.email)
            .then(async (userRecord) => {
                // Get user from DB
                const user = await getUser(userRecord.uid);
                
                // Check signature
                const signature = Buffer.from(JSON.parse(params.signature));
                const verificationResult = verifySignature(user.publicKey, { email: params.email }, signature);
                console.log('Login signature', verificationResult);

                if (!verificationResult) {
                    return res.status(400).send({ status: "error", error: 'Wrong signature' });
                }
                
                const options = {
                    url: `${firebaseUrl}/login-complete/?uid=${userRecord.uid}`,
                    handleCodeInApp: true,
                };

                firebase.auth().sendSignInLinkToEmail(params.email, options)
                    .then(async () => {
                        await completeLogin(userRecord.uid, false);
                        console.log(`Login email confirmation sent to ${params.email}`);
                    })
                    .catch(error => console.log("email error", error));

                
                let token;
                let confirmed = false;
                for await (const _ of Array.from(new Array(250), (x,i) => i)) {
                    if (!confirmed && userRecord) {
                        const userData = await getUser(userRecord.uid);
                        if (userData && userData.loginConfirmed) {
                            token = await admin.auth().createCustomToken(userData.uid);
                            confirmed = true;
                            console.log(`Login with email address ${userData.email} successful. UID: ${userData.uid}`);
                        }
                    }
                    await new Promise(resolved => setTimeout(resolved, confirmed ? 0 : 2000));
                };

                return res.send({ status: "success", token });
            })
            .catch((error) => {
                console.log(`Error logging in user with email ${params.email}`, error);
            });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.register = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || !params.email || !params.publicKey) {
            console.error("Register user failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are provided" });
        }

        admin
            .auth()
            .createUser({
                email: params.email,
                emailVerified: false
            })
            .then(async (userRecord) => {
                const options = {
                    url: `${firebaseUrl}/register-complete/?uid=${userRecord && userRecord.uid}`,
                    handleCodeInApp: true,
                };

                firebase.auth().sendSignInLinkToEmail(params.email, options)
                    .then(async () => {
                        await register(userRecord.uid, params.publicKey, userRecord);
                        console.log(`Registration email confirmation sent to ${params.email}`);
                    })
                    .catch(error => console.log("email error", error));

                
                let token;
                let confirmed = false;
                for await (const _ of Array.from(new Array(250), (x,i) => i)) {
                    !confirmed && userRecord && admin
                        .auth()
                        .getUser(userRecord.uid)
                        .then(async (user) => {
                            if (user && user.emailVerified) {
                                token = await admin.auth().createCustomToken(user.uid);
                                confirmed = true;
                                console.log(`Email address ${user.email} successfully verified. UID: ${user.uid}`);
                            }
                    })
                    await new Promise(resolved => setTimeout(resolved, confirmed ? 0 : 2000));
                };

                const settings = await getSettings();

                return res.send({ status: "success", token, servicePublicKey: settings.keys.publicKey });
            })
            .catch((error) => {
                console.log(`Error creating new user with email ${params.email}`, error);
            });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.completeRegistration = async (req, res) => {
    try {
        // Check Fields
        const params = req.query;
        if (!params || !params.uid) {
            console.error("Get user by ID failed. Params: ", params);
            return res.status(400).json({ error: "Ensure your user ID is provided" });
        }
        admin
            .auth()
            .getUser(params.uid)
            .then(async (userRecord) => {
                await admin.auth().updateUser(params.uid, {
                    ...userRecord,
                    emailVerified: true
                });
                await completeRegistration(userRecord.uid);

                console.log(`Successfully confirmed email for user`, userRecord.uid, userRecord.email);
            })
            .catch((error) => {
                console.log(`Error confirming user email ${params.uid}`, error);
            });
        return res.json({ status: "success" });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.completeLogin = async (req, res) => {
    try {
        // Check Fields
        const params = req.query;
        if (!params || !params.uid) {
            console.error("Get user by ID failed. Params: ", params);
            return res.status(400).json({ error: "Ensure your user ID is provided" });
        }
        admin
            .auth()
            .getUser(params.uid)
            .then(async (userRecord) => {
                await completeLogin(userRecord.uid, true);

                console.log(`Successfully logged in user`, userRecord.uid, userRecord.email);
            })
            .catch((error) => {
                console.log(`Error logging in user email ${params.uid}`, error);
            });
        return res.json({ status: "success" });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};