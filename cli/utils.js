const fs = require('fs');
const axios = require('axios');

const getConfig = (configFile = './config.json') => {
  try {
      let config = {};
      let storedConfig = fs.readFileSync(configFile);
      if (storedConfig) {
        config = JSON.parse(storedConfig.toString());
      }
      return config;
  } catch (error) {
      throw new Error(error);
  }
}

const updateConfig = (configFile = './config.json', values) => {
  try {
      let config = {};
      let storedConfig = fs.readFileSync(configFile);
      if (storedConfig) {
        config = JSON.parse(storedConfig.toString());
        config = { ...config, ...values };
      }
      fs.writeFileSync(configFile, JSON.stringify(config, undefined, "\t"));

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

const getKeys = (keysFile = './keys.json') => {
  try {
      let keys = {};
      let storedKeys = fs.readFileSync(keysFile);
      if (storedKeys) {
          keys = JSON.parse(storedKeys.toString());
      }
      return keys;
  } catch (error) {
      throw new Error(error);
  }
}

const validateEmail = email => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
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
      console.error('\n', error.message, error.response.statusText);
      console.error(error.response.data);
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
  }

  return payload;
}

const parseJSON = string =>
  JSON.parse(string.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": '));

const isJSON = data => {
  let hasKeys = false;
  for (let property in data) {
    if (data.hasOwnProperty(property) && !(/^\d+$/.test(property))) {
      hasKeys = true;
      break;
    }
  }

  return (hasKeys && data.constructor === Object && data.constructor !== Array) ? true : false;
}

const generateFileName = streamId => {
  const timestamp = (new Date()).toLocaleString()
    .replace(/\//g, '.')
    .replace(/ /g, '')
    .replace(/,/g, '-')
    .replace(/:/g, '.');
  return `./${streamId}-${timestamp}.json`;
}

const saveToFile = async (fileName, data) => {
  try {
    fs.writeFileSync(fileName, JSON.stringify(data, undefined, "\t"));
  } catch (error) {
      throw new Error(error);
  }
}

const fixPublicKey = key => key.split('\\n').join('\n');

module.exports = {
  getConfig,
  getKeys,
  generatePayload,
  callApi,
  updateConfig,
  validateEmail,
  parseJSON,
  isJSON,
  generateFileName,
  saveToFile,
  fixPublicKey
};
