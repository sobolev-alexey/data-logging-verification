// const crypto = require('crypto');
const admin = require('firebase-admin');
const firebase = require('firebase');
// const { decrypt } = require("../encryption");
const {
    getUser,
} = require("../firebase");


// // Retrieve user
// const user = await admin.auth().getUser(params.userId);

exports.log = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || !params.token) {
            console.error("Verify token failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // await verifyToken(params.token);
        return res.json({ status: "success" });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.read = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || !params.token) {
            console.error("Verify token failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // await verifyToken(params.token);
        return res.json({ status: "success" });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.verify = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || !params.token) {
            console.error("Verify token failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // await verifyToken(params.token);
        return res.json({ status: "success" });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.trade_verify = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || !params.token) {
            console.error("Verify token failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // await verifyToken(params.token);
        return res.json({ status: "success" });
    } catch (error) {
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};
