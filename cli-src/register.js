const fs = require('fs');
const chalk = require('chalk');
const { generateKeys } = require('./encryption');
const { callApi } = require('./utils');

const register = async (email, groupId, keyFile) => {
  try {
    const keys = generateKeys();
    keys.groupId = groupId;

    // Store keys
    fs.writeFileSync(keyFile, JSON.stringify(keys, undefined, "\t"));

    const result = await callApi('register', {
      email,
      groupId,
      publicKey: keys.publicKey
    });

    if (result && result.status === 'success') {
      if (result.servicePublicKey) {
        keys.servicePublicKey = result.servicePublicKey;
        // Store keys
        fs.writeFileSync(keyFile, JSON.stringify(keys, undefined, "\t"));
      }
      if (result.token) {
        // Store token
        fs.writeFileSync('./token.json', result.token);
      }
      console.log(chalk.green.bold('\nRegistration successful'));
    } else {
      result && result.error && console.error(chalk.red.bold('\n', result.error));
    }
    return result;
  } catch (error) {
    console.log(error)
  }
}

module.exports = register;
