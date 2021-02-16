const chalk = require('chalk');
const { signMessage } = require('./encryption');
const { getKeys, callApi } = require('./utils');

const read = async (streamId, groupId, keyFile) => {
  try {
    // Get keys
    const keys = getKeys(keyFile);

    // Sign message
    const signature = signMessage(keys.privateKey, { streamId });

    const payload = { 
      signature: JSON.stringify(signature),
      payload: { streamId }, 
      streamId,
      groupId
    };

    const result = await callApi('read', payload, true);
    if (result && !result.error && result.status === 'success') {
      if (result.metadata) {
        console.log('\n');
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      result && result.error && console.error(chalk.red.bold('\n', result.status, result.error));
    }
    return result;
  } catch (error) {
    console.log(error)
  }
}

module.exports = read;