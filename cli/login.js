const fs = require('fs');
const axios = require('axios');
const { signMessage, verifySignature } = require('./encryption');
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

(async () => {
    try {
        const email = 'lexerr@gmail.com';
        
        // Get keys
        const keys = getKeys();

        // Sign message
        const signature = signMessage(keys.privateKey,  { email });
        // console.log('Signature', signature)

        // const signatureString = JSON.stringify(signature);
        // console.log(signatureString);

        // const valueFromString = Buffer.from(JSON.parse(signatureString));

        // console.log(typeof valueFromString, valueFromString instanceof Buffer, valueFromString);

        // const verification = verifySignature(keys.publicKey, { email }, valueFromString);

        // console.log('Verification', verification)

        const result = await callApi('login', { email, signature: JSON.stringify(signature) });

        console.log(result);
    } catch (error) {
      console.log(333, error)
    }
})();
