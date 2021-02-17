const chalk = require('chalk');
const { callApi } = require('./utils');

const read = async streamId => {
  try {
    const payload = { streamId };
    const result = await callApi('read', payload, true);
    
    if (result && !result.error && result.status === 'success') {
      if (result.metadata) {
        console.log('\n');
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      result && result.error && console.error(chalk.red.bold('\n', result.error));
    }
    return result;
  } catch (error) {
    console.log(error)
  }
}

module.exports = read;