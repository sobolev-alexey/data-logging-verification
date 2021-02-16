const fs = require('fs');
const { generateKeys } = require('./encryption');
const { getConfig, callApi } = require('./utils');

(async () => {
    try {
        const config = getConfig();
        const keys = generateKeys();
        keys.groupId = config && config.groupId;

        // Store keys
        fs.writeFileSync('./keys.json', JSON.stringify(keys, undefined, "\t"));

        const result = await callApi('register', {
          email: config && config.email,
          groupId: config && config.groupId,
          publicKey: keys.publicKey
        });

        if (result && result.status === 'success') {
          if (result.servicePublicKey) {
            keys.servicePublicKey = result.servicePublicKey;
            // Store keys
            fs.writeFileSync('./keys.json', JSON.stringify(keys, undefined, "\t"));
          }
          if (result.token) {
            // Store token
            fs.writeFileSync('./token.json', result.token);
          }
        } else {
          result && result.error && console.log(result.error);
        }
        return result;
    } catch (error) {
      console.log(error)
    }
})();
