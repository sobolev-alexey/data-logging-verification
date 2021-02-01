const fs = require('fs');
const { signMessage } = require('./encryption');
const { getConfig, getKeys, callApi, generatePayload } = require('./utils');

(async () => {
    try {
        const payload = generatePayload();
        
        const config = getConfig();
        const { groupId, streamId, tag, type } = config;

        // Get keys
        const keys = getKeys();

        // Sign message
        const signature = signMessage(keys.privateKey,  payload);

        const result = await callApi('log', { 
          signature: JSON.stringify(signature),
          payload, 
          streamId,
          groupId,
          type,
          tag
        }, true);

        console.log(result);
        if (result && result.status === 'success') {
          if (result.root) {
            const { address, explorer, messageIndex, root } = result;
            const metadata = { address, explorer, messageIndex, root };
            // Store stream metadata
            fs.writeFileSync(`./${streamId}.json`, JSON.stringify(metadata, undefined, "\t"));
          }
        } else {
          result && result.error && console.log(result.status, result.error);
        }
    } catch (error) {
      console.log(error)
    }
})();
