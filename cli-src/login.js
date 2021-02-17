const fs = require('fs');
const chalk = require('chalk');
const { signMessage } = require('./encryption');
const { getKeys, callApi } = require('./utils');

const login = async (email, keyFile) => {
  try {
    // Get keys
    const keys = getKeys(keyFile);

    // Sign message
    const signature = signMessage(keys.privateKey,  { email });

    const result = await callApi('login', { email, signature: JSON.stringify(signature) });

    if (result && result.status === 'success') {
      if (result.token) {
        // Update token
        fs.writeFileSync('./token.json', result.token);
      }
      console.log(chalk.green.bold('\nLogin successful'));
    } else {
      result && result.error && console.error(chalk.red.bold('\n', result.status, result.error));
    }
    return result;
  } catch (error) {
    console.log(error)
  }
}

module.exports = login;
