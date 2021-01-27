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
        if (!params || 
            !params.payload ||
            !params.signature ||
            !params.streamId ||
            !params.groupId ||
            !params.type 
        ) {
            console.error("Log data failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // Get user by ID from cloud database

        // Verify signature 

        // Verify payload type

        // Get existing stream by ID + group ID

        // If no stream found, create new stream

        // MAM attach payload

        // Store stream metadata

        // Calculate and store payload hash, timestamp, message index

        // Prepare response

        
        return res.json({ status: "success" });
    } catch (error) {
        console.error("Log data failed. Params: ", params, error);
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.read = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
            if (!params || !params.signature || !params.streamId || !params.groupId) {
            console.error("Read stream failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // Get user by ID from cloud database

        // Verify signature 

        // Get existing stream by ID + group ID

        // MAM fetch payload

        // Prepare response

        return res.json({ status: "success" });
    } catch (error) {
        console.error("Read stream failed. Params: ", params, error);
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.verify = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || 
            !params.payload ||
            !params.signature ||
            !params.streamId ||
            !params.groupId ||
            !params.publicKey 
        ) {
            console.error("Verify message failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // Get user by ID from cloud database

        // Verify signature 

        // Verify payload type

        // Get existing stream by ID + group ID

        // MAM fetch payload

        // Verify signature of fetched message with the provided public key, flag malicious

        // Verify payload integrity, compare fetched message hash with stored hash

        // Prepare response


        return res.json({ status: "success" });
    } catch (error) {
        console.error("Verify message failed. Params: ", params, error);
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.trade_verify = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || 
            !params.streamIdProducer   ||
            !params.streamIdConsumer   ||
            !params.streamIdAgreedBid  ||
            !params.publicKeyProducer  ||
            !params.publicKeyConsumer  || 
            !params.publicKeyAgreedBid || 
            !params.groupId || 
            !params.signature
        ) {
            console.error("Verify trade failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // Get user by ID from cloud database

        // Verify signature 

        // Verify payload

        // Get existing producer stream by ID + group ID
        // Get existing consumer stream by ID + group ID
        // Get existing bid stream by ID + group ID

        // MAM fetch producer stream payload
        // MAM fetch consumer stream payload
        // MAM fetch bid stream payload

        // Verify signature of fetched producer message with the provided producer public key, flag malicious
        // Verify signature of fetched consumer message with the provided consumer public key, flag malicious
        // Verify signature of fetched bid message with the provided bid public key, flag malicious

        // Verify producer payload integrity, compare fetched message hash with stored hash
        // Verify consumer payload integrity, compare fetched message hash with stored hash
        // Verify bid payload integrity, compare fetched message hash with stored hash

        // Calculate produced energy
        // Calculate consumed energy

        // Verify energy amount match between producer, consumer, bid
        
        // Optionally verify starting time
        
        // Prepare response

        return res.json({ status: "success" });
    } catch (error) {
        console.error("Verify trade failed. Params: ", params, error);
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};
