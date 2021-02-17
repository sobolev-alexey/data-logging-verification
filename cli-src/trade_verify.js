const chalk = require('chalk');
const { callApi } = require('./utils');

const trade_verify = async (
  streamIdProducer, streamIdConsumer, streamIdAgreedBid, returnPayload, returnMetadata
) => {
  try {
    const payload = { 
      streamIdProducer,
      streamIdConsumer,
      streamIdAgreedBid,
      returnPayload,
      returnMetadata
    };

    const result = await callApi('trade_verify', payload, true);
    
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

module.exports = trade_verify;
