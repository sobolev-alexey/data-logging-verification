const fs = require('fs');
const axios = require('axios');
const { signMessage } = require('./encryption');

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

const getKeys = () => {
  try {
      let keys = {};
      let storedKeys = fs.readFileSync('./keys.json');
      if (storedKeys) {
          keys = JSON.parse(storedKeys.toString());
      }
      return keys;
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
      console.log(333, error)
    }
})();
