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
          token = storedToken.toString();
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
    const headers = {
      "Content-Type": "application/json"
    };

    if (auth) {
      headers.Authorization = `Bearer ${getToken()}`;
    }

    const config = getConfig();

    const response = await axios.post(`${config && config.serviceUrl}/${url}`, payload, { headers })
    return response && response.data;
  } catch (error) {
    // error.message
    // error.response.status
    // error.response.statusText
    // error.response.data.message
    if (!error.response || !error.response.data || !error.response.data.message) {
      console.error(error);
    }
    return { 
      error: error.response.data.message,
      status: error.response.status
    };
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
