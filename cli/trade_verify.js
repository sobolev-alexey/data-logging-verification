const { signMessage } = require('./encryption');
const { getConfig, getKeys, callApi } = require('./utils');

(async () => {
    try {
        const data = {
          streamIdProducer: 'test-producer',
          streamIdConsumer: 'test-consumer',
          streamIdAgreedBid: 'test-bid'
        };
        
        const config = getConfig();
        const { groupId, streamId } = config;

        // Get keys
        const keys = getKeys();

        // Sign message
        const signature = signMessage(keys.privateKey, data);

        const payload = { 
          payload: data, 
          signature: JSON.stringify(signature),
          streamIdProducer: 'test-producer',
          streamIdConsumer: 'test-consumer',
          streamIdAgreedBid: 'test-bid',
          publicKeyProducer: keys.publicKey,
          publicKeyConsumer: keys.publicKey, 
          publicKeyAgreedBid: keys.publicKey,
          groupId,
          returnPayload: true,
          returnMetadata: true
        };

        const result = await callApi('trade_verify', payload, true);
        if (result && !result.error && result.status === 'success') {
          console.log(result);
        } else {
          result && result.error && console.log(result.status, result.error);
        }
    } catch (error) {
      console.log(666, error)
    }
})();
