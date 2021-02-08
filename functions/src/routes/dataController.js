const isEmpty = require('lodash/isEmpty');
const { isJSON, checkMessageTag, getHash, getExplorerURL, fetchStream } = require("../helpers");
const { publish } = require("../streams");
const { verifySignature } = require("../encryption");
const {
    getSettings,
    getStreamDetails,
    getStreamMessages,
    storeStreamMessage,
    logMessage
} = require("../firebase");

exports.log = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || 
            !params.payload ||
            !params.streamId ||
            !params.groupId ||
            !params.type 
        ) {
            console.error("Log data failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        const { uid } = res.locals;

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

        // Get existing stream by ID + group ID
        const streamId = `${params.groupId}__${params.streamId}`;
        let streamDetails = await getStreamDetails(streamId);
        let streamMetadata = {};

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
        streamDetails.metadata = metadata;
        
        // Calculate and store payload hash, timestamp, message index
        const message = {
            createdBy: uid,
            hash: getHash(JSON.stringify(params.payload)),
            index: metadata && metadata.start,
            signature: params.signature,
            type: params.type
        };

        // Store stream metadata & message
        const result = await storeStreamMessage(streamId, streamDetails, message);
        if (typeof result !== 'boolean' || !result) {
            console.error('Store message failed', result);
            return res.status(400).send({ status: "error", error: 'Error while saving message' });
        }

        // Prepare response
        return res.json({ 
            status: "success",
            address: metadata.address,
            root: metadata.root,
            messageIndex: metadata.start,
            explorer
        });
    } catch (error) {
        console.error("Log data failed. Params: ", req.body, error);
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.read = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
            if (!params || !params.streamId || !params.groupId) {
            console.error("Read stream failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // MAM fetch payload
        const result = await fetchStream(params.groupId, params.streamId);
        if (result.status !== 'success') {
            return res.status(result.code).send({ status: result.status, error: result.error });
        }

        return res.json(result);
    } catch (error) {
        console.error("Read stream failed. Params: ", req.body, error);
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};

exports.verify = async (req, res) => {
    try {
        // Check Fields
        const params = req.body;
        if (!params || 
            !params.payload ||
            !params.streamId ||
            !params.groupId ||
            !params.publicKey 
        ) {

            console.error("Verify message failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        const response = { status: "success", verified: true };

        // Verify payload type
        if (isEmpty(params.payload) || !isJSON(params.payload)) {
            return res.status(400).send({ status: "error", error: 'Wrong payload format' });
        }

        // MAM fetch payload
        const result = await fetchStream(params.groupId, params.streamId);
        if (result.status !== 'success') {
            response.status = 'error';
            response.verified = false;
            response.errorMessage = result.error;
        }

        const fetchedMessages = result.messages;
        let index = fetchedMessages.length;
        if (params.messageIndex && Number(params.messageIndex) > 0 && Number(params.messageIndex) <= fetchedMessages.length) {
            index = Number(params.messageIndex);
        }
        const fetchedMessage = fetchedMessages[index - 1];
        if (isEmpty(fetchedMessage) || !isJSON(fetchedMessage)) {
            response.status = 'error';
            response.verified = false;
            response.errorMessage = 'Message not fetched';
        }

        // Get existing stream by ID + group ID
        const streamId = `${params.groupId}__${params.streamId}`;
        const storedMessages = await getStreamMessages(streamId);

        const storedMessage = storedMessages.find(msg => msg.index === index);
        if (isEmpty(storedMessage) || !isJSON(storedMessage)) {
            response.status = 'error';
            response.verified = false;
            response.errorMessage = 'Message not found';
        }

        // Verify payload integrity, compare fetched message hash with stored hash
        const payloadHash = getHash(JSON.stringify(params.payload));
        if (payloadHash !== storedMessage.hash) {
            // ToDo: Log malicious
            response.status = 'error';
            response.verified = false;
            response.malicious = true;
            response.errorMessage = 'Integrity error';
        }

        // Verify signature of fetched message with the provided public key, flag malicious
        const signature = Buffer.from(JSON.parse(storedMessage.signature));
        const signatureVerificationResult = await verifySignature(params.publicKey, fetchedMessage, signature);
        if (!signatureVerificationResult) {
            // ToDo: Log malicious
            response.status = 'error';
            response.verified = false;
            response.malicious = true;
            response.errorMessage = 'Wrong signature';
        }

        // Prepare response
        const settings = await getSettings();
        const { root, sideKey } = storedMessage.metadata;
        response.explorer = getExplorerURL(root, sideKey, settings.tangle.network);
        
        if (params.returnPayload) {
            response.fetchedPayload = fetchedMessage;
        }
        if (params.returnMetadata) {
            response.metadata = storedMessage.metadata;
        }

        return res.json(response);
    } catch (error) {
        console.error("Verify message failed. Params: ", req.body, error);
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
            !params.publicKeyAgreedBid
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
        console.error("Verify trade failed. Params: ", req.body, error);
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};
