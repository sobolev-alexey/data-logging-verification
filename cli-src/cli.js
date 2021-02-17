#!/usr/bin/env node
const inquirer = require('inquirer');
const chalk = require('chalk');
const { 
  updateConfig, parseJSON, isJSON, 
  generateFileName, saveToFile
} = require('./utils');
const {
  inputStreamId, inputTag, inputType, inputData, 
  inputMessageIndex, inputReturnPayload, inputReturnMetadata,
  inputStreamIdProducer, inputStreamIdConsumer, inputStreamIdAgreedBid,
} = require('./inputs');
const { startSpinner, stopSpinner } = require('./spinner');

const log = require('./log');
const read = require('./read');
const verify = require('./verify');
const trade_verify = require('./trade_verify');

const execute = async (message, func, file = false) => {
  let response;
  try {
    console.log(chalk.white.bold(message));
    startSpinner(showMainMenu);
    response = await func();
    stopSpinner();

    if (file && response && isJSON(response) && response.status === 'success') {
      inquirer.prompt([{
        type: 'confirm',
        name: 'saveToFile',
        message: `Save output to file ${file} ?`,
        default: false,
      }]).then(async answers => {
        if (answers.saveToFile) {
          await saveToFile(file, response);
          console.log(chalk.green.bold('Saved to file', file));
        }
        showMainMenu();
      });
    }
  } catch (error) {
    console.error(chalk.red(error.message));
  } finally {
    if (!file || response.status !== 'success') {
      showMainMenu();
    }
  }
}

const mainMenuMap = new Map([
  ['Log', async () => {
    console.clear();
    const { streamId, data, type, tag } = await inquirer.prompt([
      inputStreamId, inputData, inputType, inputTag
    ]);
    updateConfig({ streamId, type, tag });
    execute(
      'Appending data to stream, please wait...',
      () => log(parseJSON(data), streamId, tag, type)
    );
  }],
  ['Verify data', async () => {
    console.clear();
    const { streamId, data, messageIndex, returnPayload, returnMetadata } = await inquirer.prompt([
      inputStreamId, inputData, inputMessageIndex, inputReturnPayload, inputReturnMetadata
    ]);
    updateConfig({ streamId });
    execute(
      'Verifying message...',
      () => verify(parseJSON(data), streamId, messageIndex, returnPayload, returnMetadata),
      generateFileName(streamId)
    );
  }],
  ['Verify trade', async () => {
    console.clear();
    const { 
      streamIdProducer, streamIdConsumer, streamIdAgreedBid, returnPayload, returnMetadata 
    } = await inquirer.prompt([
      inputStreamIdProducer, inputStreamIdConsumer, inputStreamIdAgreedBid,
      inputReturnPayload, inputReturnMetadata
    ]);
    execute(
      'Verifying trade...',
      () => trade_verify(
        streamIdProducer, streamIdConsumer, streamIdAgreedBid, returnPayload, returnMetadata
      ),
      generateFileName(streamIdAgreedBid)
    );
  }],
  ['Index', async () => {
    console.clear();
    const { streamId } = await inquirer.prompt([ inputStreamId ]);
    updateConfig({ streamId });
    execute(
      'Retrieving data stream...',
      () => read(streamId),
      generateFileName(streamId)
    );
  }],
  [new inquirer.Separator()],
  ['Exit', () => {
    console.log("exiting now");
    return process.exit(0);
  }],
]);

const showMainMenu = () => {
  inquirer.prompt([{
    type: 'rawlist',
    name: 'mainChoice',
    message: 'Please select a type of request',
    pageSize: 7,
    choices: Array.from(mainMenuMap.entries()).map(arr => arr[0])
  }]).then(async answers => {
    mainMenuMap.get(answers.mainChoice)();
  });
}

// showMainMenu();

module.exports = () => showMainMenu();