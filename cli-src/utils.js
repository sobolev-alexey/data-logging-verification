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

const updateConfig = (values, configFile = './config.json') => {
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

const callApi = async (url, payload) => {
  try {
    const config = getConfig();
    const response = await axios.post(`${config && config.serviceUrl}/${url}`, payload);
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

module.exports = {
  getConfig,
  callApi,
  updateConfig,
  parseJSON,
  isJSON,
  generateFileName,
  saveToFile,
};
