const isEmpty = require('lodash/isEmpty');
const last = require('lodash/last');
const get = require('lodash/get');
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
            { message: params.payload, signature: params.signature },
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

        const response = { status: "success", verified: true, statusCode: 200 };

        // Verify payload type
        if (isEmpty(params.payload) || !isJSON(params.payload)) {
            return res.status(400).send({ status: "error", error: 'Wrong payload format' });
        }

        // MAM fetch payload
        const result = await fetchStream(params.groupId, params.streamId);
        if (result.status !== 'success') {
            response.status = 'error';
            response.verified = false;
            response.error = result.error;
            response.statusCode = 400;
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
            response.error = 'Message not fetched';
            response.statusCode = 400;
        }

        // Get existing stream by ID + group ID
        const streamId = `${params.groupId}__${params.streamId}`;
        const storedMessages = await getStreamMessages(streamId);

        const storedMessage = storedMessages.find(msg => msg.index === index);
        if (isEmpty(storedMessage) || !isJSON(storedMessage)) {
            response.status = 'error';
            response.verified = false;
            response.error = 'Message not found';
            response.statusCode = 404;
        }

        // Verify payload integrity, compare fetched message hash with stored hash
        const payloadHash = getHash(JSON.stringify(params.payload));
        const fetchedPayloadHash = getHash(JSON.stringify(fetchedMessage.message));
        if (payloadHash !== storedMessage.hash || fetchedPayloadHash !== storedMessage.hash) {
            response.status = 'error';
            response.verified = false;
            response.malicious = true;
            response.error = 'Integrity error';
            response.statusCode = 400;
            const logs = [
                `Payload: ${JSON.stringify(params.payload)}`,
                `Fetched: ${JSON.stringify(fetchedMessage.message)}`,
                `Stored: ${JSON.stringify(storedMessage)}`,
                `Payload Hash: ${payloadHash}`,
                `Fetched Payload Hash: ${fetchedPayloadHash}`,
                `Stored Payload Hash: ${storedMessage.hash}`,
                'Error: Integrity error'
            ]
            await logMessage(logs, 'malicious', params.streamId, params.groupId);
        }

        // Verify signature of fetched message with the provided public key, flag malicious
        const signature = Buffer.from(JSON.parse(fetchedMessage.signature));
        const signatureVerificationResult = await verifySignature(params.publicKey, fetchedMessage.message, signature);
        if (!signatureVerificationResult) {
            response.status = 'error';
            response.verified = false;
            response.malicious = true;
            response.error = 'Wrong signature';
            response.statusCode = 400;
            const logs = [
                `Payload: ${JSON.stringify(params.payload)}`,
                `Fetched: ${JSON.stringify(fetchedMessage.message)}`,
                `Fetched Signature: ${JSON.stringify(fetchedMessage.signature)}`,
                'Error: Wrong signature'
            ]
            await logMessage(logs, 'malicious', params.streamId, params.groupId);

        }

        // Prepare response
        const settings = await getSettings();
        const { root, sideKey } = storedMessage.metadata;
        response.explorer = getExplorerURL(root, sideKey, settings.tangle.network);
        
        if (params.returnPayload) {
            response.fetchedPayload = fetchedMessage.message;
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

        const response = { status: "success", verified: true, statusCode: 200 };

        // MAM fetch producer stream payload
        const streamProducer = await fetchStream(params.groupId, params.streamIdProducer);
        if (streamProducer.status !== 'success') {
            response.status = 'error';
            response.verified = false;
            response.error = streamProducer.error;
            response.statusCode = 400;
        }
        const fetchedProducerMessages = streamProducer.messages;

        // MAM fetch consumer stream payload
        const streamConsumer = await fetchStream(params.groupId, params.streamIdConsumer);
        if (streamConsumer.status !== 'success') {
            response.status = 'error';
            response.verified = false;
            response.error = streamConsumer.error;
            response.statusCode = 400;
        }
        const fetchedConsumerMessages = streamConsumer.messages;

        // MAM fetch bid stream payload
        const streamAgreedBid = await fetchStream(params.groupId, params.streamIdAgreedBid);
        if (streamAgreedBid.status !== 'success') {
            response.status = 'error';
            response.verified = false;
            response.error = get(streamAgreedBid, 'error');
            response.statusCode = 400;
        }
        const fetchedAgreedBidMessages = get(streamAgreedBid, 'messages');

        // Verify signature of fetched producer message with the provided producer public key, flag malicious
        fetchedProducerMessages.forEach((messageObj, index) => {
            const signature = Buffer.from(JSON.parse(messageObj.signature));
            const signatureVerificationResult = verifySignature(params.publicKeyProducer, messageObj.message, signature);
            if (!signatureVerificationResult) {
                response.status = 'error';
                response.verified = false;
                response.malicious = true;
                response.error = 'Wrong signature';
                response.statusCode = 400;
                const logs = [
                    `Data stream: producer ${params.streamIdProducer}`,
                    `Fetched: ${JSON.stringify(messageObj)}`,
                    `Message index: ${index}`,
                    'Error: Wrong signature'
                ]
                logMessage(logs, 'malicious', params.streamIdProducer, params.groupId);
            }
        });

        // Verify signature of fetched consumer message with the provided consumer public key, flag malicious
        fetchedConsumerMessages.forEach((messageObj, index) => {
            const signature = Buffer.from(JSON.parse(messageObj.signature));
            const signatureVerificationResult = verifySignature(params.publicKeyConsumer, messageObj.message, signature);
            if (!signatureVerificationResult) {
                response.status = 'error';
                response.verified = false;
                response.malicious = true;
                response.error = 'Wrong signature';
                response.statusCode = 400;
                const logs = [
                    `Data stream: consumer ${params.streamIdConsumer}`,
                    `Fetched: ${JSON.stringify(messageObj)}`,
                    `Message index: ${index}`,
                    'Error: Wrong signature'
                ]
                logMessage(logs, 'malicious', params.streamIdConsumer, params.groupId);
            }
        });
        
        // Verify signature of fetched bid message with the provided bid public key, flag malicious
        fetchedAgreedBidMessages.forEach((messageObj, index) => {
            const signature = Buffer.from(JSON.parse(get(messageObj, 'signature')));
            const signatureVerificationResult = verifySignature(params.publicKeyAgreedBid, get(messageObj, 'message'), signature);
            if (!signatureVerificationResult) {
                response.status = 'error';
                response.verified = false;
                response.malicious = true;
                response.error = 'Wrong signature';
                response.statusCode = 400;
                const logs = [
                    `Data stream: agreed bid ${params.streamIdAgreedBid}`,
                    `Fetched: ${JSON.stringify(messageObj)}`,
                    `Message index: ${index}`,
                    'Error: Wrong signature'
                ]
                logMessage(logs, 'malicious', params.streamIdAgreedBid, params.groupId);
            }
        });

        // Verify producer payload integrity, compare fetched message hash with stored hash
        const storedProducerMessages = await getStreamMessages(`${params.groupId}__${params.streamIdProducer}`);
        storedProducerMessages.sort((a, b) => a.index - b.index).forEach((storedMessage, index) => {
            const fetchedMessage = fetchedProducerMessages[index];
            
            if (isEmpty(storedMessage) || !isJSON(storedMessage) || isEmpty(fetchedMessage) || !isJSON(fetchedMessage)) {
                response.status = 'error';
                response.verified = false;
                response.error = 'Message not found';
                response.statusCode = 404;
            }

            const fetchedPayloadHash = getHash(JSON.stringify(fetchedMessage.message));
            if (fetchedPayloadHash !== storedMessage.hash) {
                response.status = 'error';
                response.verified = false;
                response.malicious = true;
                response.error = 'Integrity error';
                response.statusCode = 400;
                const logs = [
                    `Fetched: ${JSON.stringify(fetchedMessage.message)}`,
                    `Stored: ${JSON.stringify(storedMessage)}`,
                    `Fetched Payload Hash: ${fetchedPayloadHash}`,
                    `Stored Payload Hash: ${storedMessage.hash}`,
                    'Error: Integrity error'
                ]
                logMessage(logs, 'malicious', params.streamId, params.groupId);
            }
        });

        // Verify consumer payload integrity, compare fetched message hash with stored hash
        const storedConsumerMessages = await getStreamMessages(`${params.groupId}__${params.streamIdConsumer}`);
        storedConsumerMessages.sort((a, b) => a.index - b.index).forEach((storedMessage, index) => {
            const fetchedMessage = fetchedConsumerMessages[index];
            
            if (isEmpty(storedMessage) || !isJSON(storedMessage) || isEmpty(fetchedMessage) || !isJSON(fetchedMessage)) {
                response.status = 'error';
                response.verified = false;
                response.error = 'Message not found';
                response.statusCode = 404;
            }

            const fetchedPayloadHash = getHash(JSON.stringify(fetchedMessage.message));
            if (fetchedPayloadHash !== storedMessage.hash) {
                response.status = 'error';
                response.verified = false;
                response.malicious = true;
                response.error = 'Integrity error';
                response.statusCode = 400;
                const logs = [
                    `Fetched: ${JSON.stringify(fetchedMessage.message)}`,
                    `Stored: ${JSON.stringify(storedMessage)}`,
                    `Fetched Payload Hash: ${fetchedPayloadHash}`,
                    `Stored Payload Hash: ${storedMessage.hash}`,
                    'Error: Integrity error'
                ]
                logMessage(logs, 'malicious', params.streamId, params.groupId);
            }
        });

        // Verify bid payload integrity, compare fetched message hash with stored hash
        const storedAgreedBidMessages = await getStreamMessages(`${params.groupId}__${params.streamIdAgreedBid}`);
        storedAgreedBidMessages.sort((a, b) => get(a, 'index') - get(b, 'index')).forEach((storedMessage, index) => {
            const fetchedMessage = fetchedAgreedBidMessages[index];
            
            if (isEmpty(storedMessage) || !isJSON(storedMessage) || isEmpty(fetchedMessage) || !isJSON(fetchedMessage)) {
                response.status = 'error';
                response.verified = false;
                response.error = 'Message not found';
                response.statusCode = 404;
            }

            const fetchedPayloadHash = getHash(JSON.stringify(get(fetchedMessage, 'message')));
            if (fetchedPayloadHash !== get(storedMessage, 'hash')) {
                response.status = 'error';
                response.verified = false;
                response.malicious = true;
                response.error = 'Integrity error';
                response.statusCode = 400;
                const logs = [
                    `Fetched: ${JSON.stringify(get(fetchedMessage, 'message'))}`,
                    `Stored: ${JSON.stringify(storedMessage)}`,
                    `Fetched Payload Hash: ${fetchedPayloadHash}`,
                    `Stored Payload Hash: ${get(storedMessage, 'hash')}`,
                    'Error: Integrity error'
                ]
                logMessage(logs, 'malicious', params.streamId, params.groupId);
            }
        });

        // Calculate produced energy
        response.energyProduced = 0;
        fetchedProducerMessages.forEach(messageObj => {
            response.energyProduced += Number(get(messageObj, 'message.Quantity.Value'));
        });

        // Calculate consumed energy
        response.energyConsumed = 0;
        fetchedConsumerMessages.forEach(messageObj => {
            response.energyConsumed += Number(get(messageObj, 'message.Quantity.Value'));
        });

        // Verify energy amount match between producer, consumer, bid
        response.energyAgreedBid = get(last(fetchedAgreedBidMessages), 'message.Quantity.Value');
        if (response.energyAgreedBid !== response.energyProduced || response.energyAgreedBid !== response.energyConsumed) {
            response.status = 'error';
            response.verified = false;
            response.error = 'Amount mismatch error';
            response.statusCode = 400;
        }
        
        // Optionally verify starting time
        
        // Prepare response
        if (params.returnPayload) {
            response.fetchedPayload = {
                producer: fetchedProducerMessages,
                consumer: fetchedConsumerMessages,
                bid: fetchedAgreedBidMessages
            };
        }
        if (params.returnMetadata) {
            response.metadata = {
                producer: storedProducerMessages.map(message => get(message, 'metadata')),
                consumer: storedConsumerMessages.map(message => get(message, 'metadata')),
                bid: storedAgreedBidMessages.map(message => get(message, 'metadata'))
            };
        }

        return res.json(response);
    } catch (error) {
        console.error("Verify trade failed. Params: ", req.body, error);
        return res.send({ status: "error", error: error.message, code: error.code });
    };
};
