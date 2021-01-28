const fs = require('fs');
const axios = require('axios');
const { generateKeys } = require('./encryption');
const serverAPI = 'https://us-central1-data-logging-verification.cloudfunctions.net/api';

const callApi = async (url, payload) => {
  try {
    const headers = {
      "Content-Type": "application/json"
    };

    const response = await axios.post(`${serverAPI}/${url}`, payload, { headers });
    return response && response.data;
  } catch (error) {
    return { error };
  }
};

(async () => {
    try {
        const groupId = 'test';
        
        const keys = generateKeys();
        keys.groupId = groupId;

        // Store keys
        fs.writeFileSync('./keys.json', JSON.stringify(keys, undefined, "\t"));

        const result = await callApi('register', {
          email: 'lexerr@gmail.com',
          groupId,
          publicKey: keys.publicKey
        });

        if (result && result.servicePublicKey) {
          keys.servicePublicKey = result.servicePublicKey;
          // Store keys
          fs.writeFileSync('./keys.json', JSON.stringify(keys, undefined, "\t"));
        }
        if (result && result.token) {
          // Store token
          fs.writeFileSync('./token.json', result.token);
        }
    } catch (error) {
      console.log(333, error)
    }
})();
