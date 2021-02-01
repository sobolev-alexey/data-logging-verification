const fs = require('fs');
const axios = require('axios');

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

const getToken = () => {
  try {
      let token = {};
      let storedToken = fs.readFileSync('./token.json');
      if (storedToken) {
          token = JSON.parse(storedToken.toString());
      }
      return token;
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

const callApi = async (url, payload, auth = false) => {
  try {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json"
    };

    if (auth) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = getConfig();
    const response = await axios.post(`${config && config.serviceUrl}/${url}`, payload, { headers });
    return response && response.data;
  } catch (error) {
    return { error };
  }
};

const generatePayload = () => {
  const payload = {
    message: 'Hello World!',
    timestamp: (new Date()).toLocaleString()
  };

  return payload;
}


module.exports = {
  getConfig,
  getKeys,
  generatePayload,
  callApi,
};
