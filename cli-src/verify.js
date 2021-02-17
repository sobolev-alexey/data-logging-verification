const chalk = require('chalk');
const { callApi } = require('./utils');

const verify = async (data, streamId, messageIndex = 0, returnPayload = false, returnMetadata = false) => {
  try {
    const payload = { 
      payload: data, 
      streamId,
      messageIndex,
      returnPayload,
      returnMetadata
    };

    const result = await callApi('verify', payload, true);

    if (result && !result.error && result.status === 'success') {
      console.log('\n');
      console.log(JSON.stringify(result, null, 2));
    } else {
      result && result.error && console.error(chalk.red.bold('\n', result.error));
    }
    return result;
  } catch (error) {
    console.log(error)
  }
}

module.exports = verify;
