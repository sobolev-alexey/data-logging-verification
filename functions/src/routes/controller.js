const crypto = require('crypto');
const admin = require('firebase-admin');
const firebase = require('firebase');
const { verifyToken } = require("../helpers");
const { decrypt } = require("../encryption");
const {
    getUser,
    userLogin
} = require("../firebase");

exports.createUpdateUser = async (req, res) => {
    try {
        const { token } = req.body;
        const tokenData = await verifyToken(token);

        const { uid, email, name, photo, claims } = tokenData;
        if (!uid) { //  || !name || !email || !claims || !claims.role
            return res.status(400).send({ message: 'Missing fields' });
        }

        const user = await admin.auth().updateUser(uid, {
            uid,
            email,
            displayName: name || claims.name || '',
            photoURL: photo || null
        });

        await admin.auth().setCustomUserClaims(user.uid, claims);

        if (claims && claims.tenant) {
            firebase.auth().tenantId = claims.tenant;
        }

        return res.status(200).send({ status: "success" });
    } catch (error) {
        console.error("Create / Update user failed. Error: ", error.message);
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.getUser = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || !params.userId) {
            console.error("Get user failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // Retrieve user
        const user = await admin.auth().getUser(params.userId);

        return res.json({ user, status: "success" });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.verifyToken = async (req, res) => {
    try {
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

exports.createTestToken = async (req, res) => {
    try {
        let userId = 'test\@iota.org';
        let claims = {
            external_id: 1,
            tenant: "",
            workspace: "",
            email: "test\@iota.org",
            name: "Test User",
            role: "admin",
            can_upload_files: true
        };

        const params = req.body;
        if (params && params.userId && params.claims) {
            userId = params.userId;
            claims = params.claims;
        }

        const token = await admin.auth().createCustomToken(userId, claims);
        console.log('createTestToken', token);
        return res.json({ status: "success", token });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.userLogin = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || !params.email) {
            console.error("Get user user email failed. Params: ", params);
            return res.status(400).json({ error: "Ensure your email is provided" });
        }
        // Retrieve user
        const user = await userLogin(params.email);

        return res.json({ user, status: "success" });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};
