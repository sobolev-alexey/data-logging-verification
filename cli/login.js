const fs = require('fs');
const { signMessage } = require('./encryption');
const { getConfig, getKeys, callApi } = require('./utils');

(async () => {
    try {
        const config = getConfig();
        
        // Get keys
        const keys = getKeys();

        // Sign message
        const signature = signMessage(keys.privateKey,  { email: config.email });

        const result = await callApi('login', { email: config.email, signature: JSON.stringify(signature) });

        if (result && result.status === 'success') {
          if (result.token) {
            // Update token
            fs.writeFileSync('./token.json', result.token);

            console.log(result);
          }
        } else {
          result && result.error && console.log(result.status, result.error);
        }
    } catch (error) {
      console.log(error)
    }
})();
