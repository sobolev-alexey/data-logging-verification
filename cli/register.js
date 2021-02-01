const fs = require('fs');
const axios = require('axios');
const { generateKeys } = require('./encryption');

const getConfig = () => {
  try {
      let config = {};
      let storedConfig = fs.readFileSync('./config.json');
      if (storedConfig) {
        config = JSON.parse(storedConfig.toString());
      }
      return config;
  } catch (error) {
      throw new Error(error);
  }
}

const callApi = async (url, payload) => {
  try {
    const headers = {
      "Content-Type": "application/json"
    };

    const config = getConfig();
    const response = await axios.post(`${config && config.serviceUrl}/${url}`, payload, { headers });
    return response && response.data;
  } catch (error) {
    return { error };
  }
};

(async () => {
    try {
        const config = getConfig();
        const keys = generateKeys();
        keys.groupId = config && config.group;

        // Store keys
        fs.writeFileSync('./keys.json', JSON.stringify(keys, undefined, "\t"));

        const result = await callApi('register', {
          email: config && config.email,
          groupId: config && config.group,
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
          result && result.error && console.log(result.status, result.error);
        }
    } catch (error) {
      console.log(error)
    }
})();
