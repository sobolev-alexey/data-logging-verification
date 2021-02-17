const chalk = require('chalk');
const { signMessage } = require('./encryption');
const { getKeys, callApi } = require('./utils');

const trade_verify = async (
  streamIdProducer, publicKeyProducer, 
  streamIdConsumer, publicKeyConsumer, 
  streamIdAgreedBid, publicKeyAgreedBid, 
  groupId, returnPayload, returnMetadata, keyFile
) => {
  try {
    const data = { streamIdProducer, streamIdConsumer, streamIdAgreedBid };
    
    // Get keys
    const keys = getKeys(keyFile);

    // Sign message
    const signature = signMessage(keys.privateKey, data);

    const payload = { 
      payload: data, 
      signature: JSON.stringify(signature),
      streamIdProducer,
      streamIdConsumer,
      streamIdAgreedBid,
      publicKeyProducer,
      publicKeyConsumer, 
      publicKeyAgreedBid,
      groupId,
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
