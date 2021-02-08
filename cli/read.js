const fs = require('fs');
const { signMessage } = require('./encryption');
const { getConfig, getKeys, callApi } = require('./utils');

(async () => {
    try {
        const config = getConfig();
        const { groupId, streamId } = config;

        // Get keys
        const keys = getKeys();

        // Sign message
        const signature = signMessage(keys.privateKey, { email: config.email });

        const payload = { 
          signature: JSON.stringify(signature),
          payload: { email: config.email }, 
          streamId,
          groupId
        };

        const result = await callApi('read', payload, true);

        if (result && !result.error && result.status === 'success') {
          if (result.metadata) {
            console.log(result);
          }
        } else {
          result && result.error && console.log(result.status, result.error);
        }
    } catch (error) {
      console.log(error)
    }
})();
