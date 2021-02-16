#!/usr/bin/env node
const inquirer = require('inquirer');
const chalk = require('chalk');
const { 
  updateConfig, parseJSON, isJSON, 
  generateFileName, saveToFile, fixPublicKey
} = require('./utils');
const {
  inputStreamId, inputGroupId, inputTag, inputType, inputKeyFile, inputEmail,
  inputData, inputPublicKey, inputMessageIndex, inputReturnPayload, inputReturnMetadata,
  inputStreamIdProducer, inputStreamIdConsumer, inputStreamIdAgreedBid,
  inputPublicKeyProducer, inputPublicKeyConsumer, inputPublicKeyAgreedBid
} = require('./inputs');
const { startSpinner, stopSpinner } = require('./spinner');

const register = require('./register');
const login = require('./login');
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
    const { streamId, groupId, data, type, tag, keyFile } = await inquirer.prompt([
      inputStreamId, inputGroupId, inputData, inputType, inputTag, inputKeyFile
    ]);
    updateConfig(configFilePath, { streamId, groupId, type, tag, keyFile });
    execute(
      'Appending data to stream, please wait...',
      () => log(parseJSON(data), streamId, groupId, tag, type, keyFile)
    );
  }],
  ['Verify data', async () => {
    console.clear();
    const { streamId, groupId, data, publicKey, messageIndex, returnPayload, returnMetadata, keyFile } = await inquirer.prompt([
      inputStreamId, inputGroupId, inputData, inputPublicKey, inputMessageIndex,
      inputReturnPayload, inputReturnMetadata, inputKeyFile
    ]);
    updateConfig(configFilePath, { streamId, groupId, keyFile });
    execute(
      'Verifying message...',
      () => verify(parseJSON(data), streamId, groupId, fixPublicKey(publicKey), messageIndex, returnPayload, returnMetadata, keyFile),
      generateFileName(streamId)
    );
  }],
  ['Verify trade', async () => {
    console.clear();
    const { 
      streamIdProducer, publicKeyProducer, 
      streamIdConsumer, publicKeyConsumer,
      streamIdAgreedBid, publicKeyAgreedBid,
      groupId, returnPayload, returnMetadata, keyFile 
    } = await inquirer.prompt([
      inputStreamIdProducer, inputPublicKeyProducer, 
      inputStreamIdConsumer, inputPublicKeyConsumer,
      inputStreamIdAgreedBid, inputPublicKeyAgreedBid,
      inputGroupId, inputReturnPayload, inputReturnMetadata, inputKeyFile
    ]);
    updateConfig(configFilePath, { groupId, keyFile });
    execute(
      'Verifying trade...',
      () => trade_verify(
        streamIdProducer, fixPublicKey(publicKeyProducer), 
        streamIdConsumer, fixPublicKey(publicKeyConsumer), 
        streamIdAgreedBid, fixPublicKey(publicKeyAgreedBid), 
        groupId, returnPayload, returnMetadata, keyFile
      ),
      generateFileName(streamIdAgreedBid)
    );
  }],
  ['Index', async () => {
    console.clear();
    const { streamId, groupId, keyFile } = await inquirer.prompt([
      inputStreamId, inputGroupId, inputKeyFile
    ]);
    updateConfig(configFilePath, { streamId, groupId, keyFile });
    execute(
      'Retrieving data stream...',
      () => read(streamId, groupId, keyFile),
      generateFileName(streamId)
    );
  }],
  [new inquirer.Separator()],
  ['Login', async () => {
    console.clear();
    const { email, keyFile } = await inquirer.prompt([
      inputEmail, inputKeyFile
    ]);
    updateConfig(configFilePath, { email, keyFile });
    execute(
      'Click on the link in your email to confirm login.',
      () => login(email, keyFile)
    )
  }],
  ['Register', async () => {
    console.clear();
    const { email, groupId, keyFile } = await inquirer.prompt([
      inputEmail, inputGroupId, inputKeyFile
    ]);
    updateConfig(configFilePath, { email, keyFile });
    execute(
      'Click on the link in your email to confirm registration.',
      () => register(email, groupId, keyFile)
    )
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
    pageSize: 10,
    choices: Array.from(mainMenuMap.entries()).map(arr => arr[0])
  }]).then(async answers => {
    mainMenuMap.get(answers.mainChoice)();
  });
}

showMainMenu();

module.exports = () => showMainMenu();