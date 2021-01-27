const admin = require('firebase-admin');
const firebase = require('firebase');
const isEmpty = require('lodash/isEmpty');
const { isJSON, checkMessageTag, getHash } = require("../helpers");
const { fetch, publish } = require("../streams");
const {
    getUser,
    getStreamDetails,
    getStreamMessages,
    storeStreamMessage,
    logMessage
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
        const { uid, email, emailVerified } = res.locals;
        console.log('LOG 1: ', uid, email, emailVerified);
        console.log('LOG 2: ', streamId, groupId, type);

        if (!uid) {
            return res.status(400).send({ message: 'User ID not found' });
        }
        if (!email) {
            return res.status(400).send({ message: 'User email not found' });
        }
        if (!emailVerified) {
            return res.status(400).send({ message: `User email address ${email} not verified` });
        }

        const user = await getUser(uid);

        // Verify payload type
        if (isEmpty(params.payload) || !isJSON(params.payload)) {
            return res.status(400).send({ status: "error", error: 'Wrong payload format' });
        }

        // Verify tag
        if (params.tag) {
            const isValidTag = checkMessageTag(params.tag);
            if (!isValidTag) {
                return res.status(400).send({ status: "error", error: 'Wrong message tag' });
            }
        }

        // Verify group assignment
        console.log('User groups', user.groups);
        if (!user.groups.includes(params.groupId)) {
            return res.status(400).send({ status: "error", error: 'No access to given group' });
        }

        // Verify signature 
        const signature = Buffer.from(JSON.parse(params.signature));
        const callerSignatureVerificationResult = verifySignature(user.publicKey, params.payload, signature);
        console.log('Log signature', callerSignatureVerificationResult);

        if (!callerSignatureVerificationResult) {
            return res.status(400).send({ status: "error", error: 'Wrong signature' });
        }

        // Get existing stream by ID + group ID
        const streamId = `${params.groupId}__${params.streamId}`;
        let streamDetails = await getStreamDetails(streamId);
        let streamMetadata = null;

        console.log('LOG 3: ', JSON.stringify(streamDetails));

        // If no stream found, create new stream
        if (!streamDetails || isEmpty(streamDetails)) {
            streamDetails = {
                created: (new Date()).toLocaleString().replace(/\//g, '.'),
                createdTimestamp: Date.now(),
                groupId: params.groupId,
                lastIndex: 0,
                streamId: params.streamId,
                writers: [uid]
            }

            console.log('LOG 4: ', JSON.stringify(streamDetails));
        } else {
            streamMetadata = streamDetails && streamDetails.metadata;
        }

        // MAM attach payload
        const { metadata, explorer } = await publish(
            params.payload, 
            params.tag || null, 
            streamMetadata, 
            params.streamId, 
            params.groupId
        );

        if (!metadata || isEmpty(metadata)) {
            return res.status(400).send({ status: "error", error: 'Stream attach error' });
        }
        streamMetadata.metadata = metadata;
        
        console.log('LOG 5: ', JSON.stringify(metadata));

        // Calculate and store payload hash, timestamp, message index
        const message = {
            createdBy: uid,
            hash: getHash(params.payload),
            index: metadata && metadata.start,
            signature: params.signature,
            type: params.type
        };

        console.log('LOG 6: ', JSON.stringify(message));

        // Store stream metadata
        const result = await storeStreamMessage(streamId, metadata, message);
        if (typeof result !== 'boolean' || !result) {
            console.error('Store message failed', result);
            return res.status(400).send({ status: "error", error: 'Error while saving message' });
        }
        console.log('LOG 7: ', result);

        // Prepare response
        return res.json({ 
            status: "success",
            address: metadata.address,
            root: metadata.root,
            messageIndex: metadata.start,
            explorer
        });
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
        const { uid, email, emailVerified } = res.locals;
        console.log('READ 1: ', uid, email, emailVerified);
        console.log('READ 2: ', streamId, groupId, type);

        if (!uid) {
            return res.status(400).send({ message: 'User ID not found' });
        }
        if (!email) {
            return res.status(400).send({ message: 'User email not found' });
        }
        if (!emailVerified) {
            return res.status(400).send({ message: `User email address ${email} not verified` });
        }

        const user = await getUser(uid);

        // Verify group assignment
        console.log('User groups', user.groups);
        if (!user.groups.includes(params.groupId)) {
            return res.status(400).send({ status: "error", error: 'No access to given group' });
        }

        // Verify signature 
        const signature = Buffer.from(JSON.parse(params.signature));
        const callerSignatureVerificationResult = verifySignature(user.publicKey, params.payload, signature);
        console.log('Read signature', callerSignatureVerificationResult);

        if (!callerSignatureVerificationResult) {
            return res.status(400).send({ status: "error", error: 'Wrong signature' });
        }

        // Get existing stream by ID + group ID
        const streamId = `${params.groupId}__${params.streamId}`;
        const streamDetails = await getStreamDetails(streamId);

        console.log('READ 3: ', JSON.stringify(streamDetails));

        if (!streamDetails || isEmpty(streamDetails) || !streamDetails.metadata || isEmpty(streamDetails.metadata)) {
            return res.status(400).send({ status: "error", error: 'No stream metadata found' });
        }

        // MAM fetch payload
        const messages = await fetch(
            streamDetails.metadata, 
            params.streamId, 
            params.groupId
        );

        console.log('READ 4: ', JSON.stringify(messages));
        
        // Prepare response
        return res.json({ 
            status: "success",
            messages,
            metadata: streamDetails.metadata
        });
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
        const { uid, email, emailVerified } = res.locals;
        console.log('VERIFY 1: ', uid, email, emailVerified);
        console.log('VERIFY 2: ', streamId, groupId, type);

        if (!uid) {
            return res.status(400).send({ message: 'User ID not found' });
        }
        if (!email) {
            return res.status(400).send({ message: 'User email not found' });
        }
        if (!emailVerified) {
            return res.status(400).send({ message: `User email address ${email} not verified` });
        }

        const user = await getUser(uid);

        // Verify group assignment
        console.log('User groups', user.groups);
        if (!user.groups.includes(params.groupId)) {
            return res.status(400).send({ status: "error", error: 'No access to given group' });
        }

        // Verify payload type
        if (isEmpty(params.payload) || !isJSON(params.payload)) {
            return res.status(400).send({ status: "error", error: 'Wrong payload format' });
        }

        // Verify signature 
        const signature = Buffer.from(JSON.parse(params.signature));
        const callerSignatureVerificationResult = verifySignature(user.publicKey, params.payload, signature);
        console.log('Read signature', callerSignatureVerificationResult);

        if (!callerSignatureVerificationResult) {
            return res.status(400).send({ status: "error", error: 'Wrong signature' });
        }

        // Get existing stream by ID + group ID
        const streamId = `${params.groupId}__${params.streamId}`;
        const streamDetails = await getStreamDetails(streamId);

        console.log('VERIFY 3: ', JSON.stringify(streamDetails));

        if (!streamDetails || isEmpty(streamDetails) || !streamDetails.metadata || isEmpty(streamDetails.metadata)) {
            return res.status(400).send({ status: "error", error: 'No stream metadata found' });
        }

        // MAM fetch payload
        const messages = await fetch(
            streamDetails.metadata, 
            params.streamId, 
            params.groupId
        );

        console.log('VERIFY 4: ', JSON.stringify(messages));

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
