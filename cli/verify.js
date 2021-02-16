const chalk = require('chalk');
const { signMessage } = require('./encryption');
const { getKeys, callApi } = require('./utils');

const verify = async (data, streamId, groupId, publicKey, messageIndex = 0, returnPayload = false, returnMetadata = false, keyFile) => {
  try {
    // Get keys
    const keys = getKeys(keyFile);

    // Sign message
    const signature = signMessage(keys.privateKey, data);

    const payload = { 
      signature: JSON.stringify(signature),
      publicKey,
      payload: data, 
      streamId,
      groupId,
      messageIndex,
      returnPayload,
      returnMetadata
    };

    const result = await callApi('verify', payload, true);
    if (result && !result.error && result.status === 'success') {
      console.log('\n');
      console.log(JSON.stringify(result, null, 2));
    } else {
      result && result.error && console.error(chalk.red.bold('\n', result.status, result.error));
    }
    return result;
  } catch (error) {
    console.log(error)
  }
}

module.exports = verify;
