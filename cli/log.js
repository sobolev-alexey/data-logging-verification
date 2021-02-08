const fs = require('fs');
const { signMessage } = require('./encryption');
const { getConfig, getKeys, callApi, generatePayload } = require('./utils');

(async () => {
    try {
        const data = generatePayload();
        
        const config = getConfig();
        const { groupId, streamId, tag, type } = config;

        // Get keys
        const keys = getKeys();

        // Sign message
        const signature = signMessage(keys.privateKey, data);

        const payload = { 
          signature: JSON.stringify(signature),
          payload: data, 
          streamId,
          groupId,
          type,
          tag
        };

        const result = await callApi('log', payload, true);

        if (result && !result.error && result.status === 'success') {
          if (result.root) {
            console.log(result);

            const { address, explorer, messageIndex, root } = result;
            const metadata = { address, explorer, messageIndex, root };
            // Store stream metadata
            fs.writeFileSync(`./${streamId}.json`, JSON.stringify(metadata, undefined, "\t"));
          }
        } else {
          result && result.error && console.log(result.status, result.error);
        }
    } catch (error) {
      console.log(666, error)
    }
})();
