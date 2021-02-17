const isEmpty = require('lodash/isEmpty');
const last = require('lodash/last');
const get = require('lodash/get');
const { isJSON, checkMessageTag, getHash, fetchStream } = require("../helpers");
const { publish, getExplorerURL } = require("../streams");
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
            !params.type 
        ) {
            console.error("Log data failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // Verify payload
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

        // Get existing stream by ID
        let streamDetails = await getStreamDetails(params.streamId);
        let streamMetadata = {};

        // If no stream found, create new stream
        if (!streamDetails || isEmpty(streamDetails)) {
            streamDetails = {
                created: (new Date()).toLocaleString().replace(/\//g, '.'),
                createdTimestamp: Date.now(),
                lastIndex: 0,
                streamId: params.streamId
            }
        } else {
            streamMetadata = streamDetails && streamDetails.metadata;
        }

        // MAM attach payload
        const { metadata, explorer } = await publish(
            params.payload,
            params.tag || null, 
            streamMetadata, 
            params.streamId
        );

        if (!metadata || isEmpty(metadata)) {
            return res.status(400).send({ status: "error", error: 'Stream attach error' });
        }
        streamDetails.metadata = metadata;
        streamDetails.lastIndex = metadata && metadata.start;
        
        // Calculate and store payload hash, timestamp, message index
        const message = {
            hash: getHash(JSON.stringify(params.payload)),
            index: metadata && metadata.start,
            type: params.type
        };

        // Store stream metadata & message
        const result = await storeStreamMessage(params.streamId, streamDetails, message);
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
            if (!params || !params.streamId) {
            console.error("Read stream failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        // MAM fetch payload
        const result = await fetchStream(params.streamId);
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
        if (!params || !params.payload || !params.streamId) {
            console.error("Verify message failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        const response = { status: "success", verified: true, statusCode: 200 };

        // Verify payload type
        if (isEmpty(params.payload) || !isJSON(params.payload)) {
            return res.status(400).send({ status: "error", error: 'Wrong payload format' });
        }

        // MAM fetch payload
        const result = await fetchStream(params.streamId);
        if (result.status !== 'success' || !result.messages) {
            response.status = 'error';
            response.verified = false;
            response.error = result.error;
            response.statusCode = 400;
            return res.json(response);
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
            return res.json(response);
        }

        // Get existing stream by ID
        const storedMessages = await getStreamMessages(params.streamId);

        const storedMessage = storedMessages.find(msg => msg.index === index);
        if (isEmpty(storedMessage) || !isJSON(storedMessage)) {
            response.status = 'error';
            response.verified = false;
            response.error = 'Message not found';
            response.statusCode = 404;
            return res.json(response);
        }

        // Verify payload integrity, compare fetched message hash with stored hash
        const payloadHash = getHash(JSON.stringify(params.payload));
        const fetchedPayloadHash = getHash(JSON.stringify(fetchedMessage));
        if (payloadHash !== storedMessage.hash || fetchedPayloadHash !== storedMessage.hash) {
            response.status = 'error';
            response.verified = false;
            response.malicious = true;
            response.error = 'Integrity error';
            response.statusCode = 400;
            const logs = [
                `Payload: ${JSON.stringify(params.payload)}`,
                `Fetched: ${JSON.stringify(fetchedMessage)}`,
                `Stored: ${JSON.stringify(storedMessage)}`,
                `Payload Hash: ${payloadHash}`,
                `Fetched Payload Hash: ${fetchedPayloadHash}`,
                `Stored Payload Hash: ${storedMessage.hash}`,
                'Error: Integrity error'
            ]
            await logMessage(logs, 'malicious', params.streamId);
            return res.json(response);
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
        if (!params || !params.streamIdProducer || !params.streamIdConsumer || !params.streamIdAgreedBid) {
            console.error("Verify trade failed. Params: ", params);
            return res.status(400).json({ error: "Ensure all fields are included" });
        }

        const response = { status: "success", verified: true, statusCode: 200 };

        // MAM fetch producer stream payload
        const streamProducer = await fetchStream(params.streamIdProducer);
        if (streamProducer.status !== 'success' || !streamProducer.messages) {
            response.status = 'error';
            response.verified = false;
            response.error = streamProducer.error;
            response.statusCode = 400;
            return res.json(response);
        }
        const fetchedProducerMessages = streamProducer.messages;

        // MAM fetch consumer stream payload
        const streamConsumer = await fetchStream(params.streamIdConsumer);
        if (streamConsumer.status !== 'success' || !streamConsumer.messages) {
            response.status = 'error';
            response.verified = false;
            response.error = streamConsumer.error;
            response.statusCode = 400;
            return res.json(response);
        }
        const fetchedConsumerMessages = streamConsumer.messages;

        // MAM fetch bid stream payload
        const streamAgreedBid = await fetchStream(params.streamIdAgreedBid);
        if (streamAgreedBid.status !== 'success' || !streamAgreedBid.messages) {
            response.status = 'error';
            response.verified = false;
            response.error = get(streamAgreedBid, 'error');
            response.statusCode = 400;
            return res.json(response);
        }
        const fetchedAgreedBidMessages = get(streamAgreedBid, 'messages');

        // Verify producer payload integrity, compare fetched message hash with stored hash
        const storedProducerMessages = await getStreamMessages(params.streamIdProducer);
        storedProducerMessages.sort((a, b) => a.index - b.index).forEach((storedMessage, index) => {
            const fetchedMessage = fetchedProducerMessages[index];
            
            if (isEmpty(storedMessage) || !isJSON(storedMessage) || isEmpty(fetchedMessage) || !isJSON(fetchedMessage)) {
                response.status = 'error';
                response.verified = false;
                response.error = 'Message not found';
                response.statusCode = 404;
                return res.json(response);
            }

            const fetchedPayloadHash = getHash(JSON.stringify(fetchedMessage));
            if (fetchedPayloadHash !== storedMessage.hash) {
                response.status = 'error';
                response.verified = false;
                response.malicious = true;
                response.error = 'Integrity error';
                response.statusCode = 400;
                const logs = [
                    `Fetched: ${JSON.stringify(fetchedMessage)}`,
                    `Stored: ${JSON.stringify(storedMessage)}`,
                    `Fetched Payload Hash: ${fetchedPayloadHash}`,
                    `Stored Payload Hash: ${storedMessage.hash}`,
                    'Error: Integrity error'
                ]
                logMessage(logs, 'malicious', params.streamIdProducer);
                return res.json(response);
            }
        });

        // Verify consumer payload integrity, compare fetched message hash with stored hash
        const storedConsumerMessages = await getStreamMessages(params.streamIdConsumer);
        storedConsumerMessages.sort((a, b) => a.index - b.index).forEach((storedMessage, index) => {
            const fetchedMessage = fetchedConsumerMessages[index];
            
            if (isEmpty(storedMessage) || !isJSON(storedMessage) || isEmpty(fetchedMessage) || !isJSON(fetchedMessage)) {
                response.status = 'error';
                response.verified = false;
                response.error = 'Message not found';
                response.statusCode = 404;
                return res.json(response);
            }

            const fetchedPayloadHash = getHash(JSON.stringify(fetchedMessage));
            if (fetchedPayloadHash !== storedMessage.hash) {
                response.status = 'error';
                response.verified = false;
                response.malicious = true;
                response.error = 'Integrity error';
                response.statusCode = 400;
                const logs = [
                    `Fetched: ${JSON.stringify(fetchedMessage)}`,
                    `Stored: ${JSON.stringify(storedMessage)}`,
                    `Fetched Payload Hash: ${fetchedPayloadHash}`,
                    `Stored Payload Hash: ${storedMessage.hash}`,
                    'Error: Integrity error'
                ]
                logMessage(logs, 'malicious', params.streamIdConsumer);
                return res.json(response);
            }
        });

        // Verify bid payload integrity, compare fetched message hash with stored hash
        const storedAgreedBidMessages = await getStreamMessages(params.streamIdAgreedBid);
        storedAgreedBidMessages.sort((a, b) => get(a, 'index') - get(b, 'index')).forEach((storedMessage, index) => {
            const fetchedMessage = fetchedAgreedBidMessages[index];
            
            if (isEmpty(storedMessage) || !isJSON(storedMessage) || isEmpty(fetchedMessage) || !isJSON(fetchedMessage)) {
                response.status = 'error';
                response.verified = false;
                response.error = 'Message not found';
                response.statusCode = 404;
                return res.json(response);
            }

            const fetchedPayloadHash = getHash(JSON.stringify(fetchedMessage));
            if (fetchedPayloadHash !== get(storedMessage, 'hash')) {
                response.status = 'error';
                response.verified = false;
                response.malicious = true;
                response.error = 'Integrity error';
                response.statusCode = 400;
                const logs = [
                    `Fetched: ${JSON.stringify(fetchedMessage)}`,
                    `Stored: ${JSON.stringify(storedMessage)}`,
                    `Fetched Payload Hash: ${fetchedPayloadHash}`,
                    `Stored Payload Hash: ${get(storedMessage, 'hash')}`,
                    'Error: Integrity error'
                ]
                logMessage(logs, 'malicious', params.streamIdAgreedBid);
                return res.json(response);
            }
        });

        // Calculate produced energy
        response.energyProduced = 0;
        fetchedProducerMessages.forEach(messageObj => {
            response.energyProduced += Number(get(messageObj, 'Quantity.Value'));
        });

        // Calculate consumed energy
        response.energyConsumed = 0;
        fetchedConsumerMessages.forEach(messageObj => {
            response.energyConsumed += Number(get(messageObj, 'Quantity.Value'));
        });

        // Verify energy amount match between producer, consumer, bid
        response.energyAgreedBid = get(last(fetchedAgreedBidMessages), 'Quantity.Value');
        if (response.energyAgreedBid !== response.energyProduced || response.energyAgreedBid !== response.energyConsumed) {
            response.status = 'error';
            response.verified = false;
            response.error = 'Amount mismatch error';
            response.statusCode = 400;
            return res.json(response);
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
