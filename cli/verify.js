const { signMessage } = require('./encryption');
const { getConfig, getKeys, callApi } = require('./utils');

(async () => {
    try {
        const data = {"Quantity": {"Value": 85},"timestamp":"2/11/2021, 10:33:05 PM"};
        
        const config = getConfig();
        const { groupId, streamId } = config;

        // Get keys
        const keys = getKeys();

        // Sign message
        const signature = signMessage(keys.privateKey, data);

        const payload = { 
          signature: JSON.stringify(signature),
          publicKey: keys.publicKey,
          payload: data, 
          streamId,
          groupId,
          returnPayload: true,
          returnMetadata: true
        };

        const result = await callApi('verify', payload, true);
        if (result && !result.error && result.status === 'success') {
          console.log(result);
        } else {
          result && result.error && console.log(result.status, result.error);
        }
    } catch (error) {
      console.log(666, error)
    }
})();
