const fs = require('fs');
const chalk = require('chalk');
const { callApi } = require('./utils');

const log = async (data, streamId, tag, type) => {
  try {
    const payload = { 
      payload: data, 
      streamId,
      type,
      tag
    };

    const result = await callApi('log', payload, true);

    if (result && !result.error && result.status === 'success') {
      if (result.root) {
        console.log('\n');
        console.log(result);

        const { address, explorer, messageIndex, root } = result;
        const metadata = { address, explorer, messageIndex, root };
        // Store stream metadata
        fs.writeFileSync(`./${streamId}.json`, JSON.stringify(metadata, undefined, "\t"));
      }
    } else {
      result && result.error && console.error(chalk.red.bold('\n', result.error));
    }
    return result;
  } catch (error) {
    console.log(error)
  }
}

module.exports = log;
