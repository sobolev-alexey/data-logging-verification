#!/usr/bin/env node
const inquirer = require('inquirer');
const chalk = require('chalk');
const { 
  getConfig, 
  updateConfig, 
  validateEmail, 
  parseJSON, 
  isJSON, 
  generateFileName,
  saveToFile,
  fixPublicKey
} = require('./utils');
const { startSpinner, stopSpinner } = require('./spinner');

const login = require('./login');
const log = require('./log');
const read = require('./read');
const verify = require('./verify');
// const trade_verify = require('./trade_verify');

let configFilePath = './config.json';
let config = getConfig(configFilePath);

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

const inputStreamId = {
  type: 'input',
  name: 'streamId',
  message: "Stream ID",
  default: config.streamId,
  validate: answer => answer ? true : 'Stream ID is empty!',
}

const inputGroupId = {
  type: 'input',
  name: 'groupId',
  message: 'Group ID',
  default: config.groupId,
  validate: answer => answer ? true : 'Group ID is empty!',
}

const inputTag = {
  type: 'input',
  name: 'tag',
  message: 'Tag [optional]',
  default: config.tag
}

const inputType = {
  type: 'input',
  name: 'type',
  message: 'Type of data (energy | bid | data)',
  default: config.type,
  validate: answer => 
    ['energy', 'bid', 'data'].includes(answer) ? true : 'Unknown data type',
}

const inputKeyFile = {
  type: 'input',
  name: 'keyFile',
  message: 'Path to JSON file with private key',
  default: config.keyFile,
  validate: answer => answer ? true : 'Path to JSON file is empty!',
}

const inputEmail = {
  type: 'input',
  name: 'email',
  message: "Email address",
  default: config.email,
  validate: answer => {
    try {
      if (!answer) {
        return 'Email is empty!';
      }
      const valid = validateEmail(answer);
      if (!valid) {
        return 'Wrong email address';
      }
      return true;
    } catch (error) {
      return 'Wrong email address';
    }
  },
}

const inputData = {
  type: 'editor',
  name: 'data',
  message: 'Provide data payload as JSON',
  validate: answer => {
    try {
      const json = parseJSON(answer);
      if (!isJSON(json) || typeof json !== 'object') {
        return 'Wrong value, must be a JSON object';
      }
      return true;
    } catch (error) {
      return 'Wrong value, must be a JSON object';
    }
  },
}

const inputPublicKey = {
  type: 'input',
  name: 'publicKey',
  message: 'Public key of the logger',
  validate: answer => answer ? true : 'Public key is empty!',
}

const inputMessageIndex = {
  type: 'number',
  name: 'messageIndex',
  message: 'Index of the message [optional]',
  default: 0,
}

const inputReturnPayload = {
  type: 'confirm',
  name: 'returnPayload',
  message: 'Return fetched payload?',
  default: true,
}

const inputReturnMetadata = {
  type: 'confirm',
  name: 'returnMetadata',
  message: 'Return stream metadata?',
  default: true,
}

const inputStreamIdProducer = {
  type: 'input',
  name: 'streamIdProducer',
  message: "Producer Stream ID",
  validate: answer => answer ? true : 'Producer stream ID is empty!',
}

const inputStreamIdConsumer = {
  type: 'input',
  name: 'streamIdConsumer',
  message: "Consumer Stream ID",
  validate: answer => answer ? true : 'Consumer stream ID is empty!',
}

const inputStreamIdAgreedBid = {
  type: 'input',
  name: 'streamIdAgreedBid',
  message: "Agreed Bid Stream ID",
  validate: answer => answer ? true : 'Agreed Bid stream ID is empty!',
}

const inputPublicKeyProducer = {
  type: 'input',
  name: 'publicKeyProducer',
  message: 'Public key of the producer',
  validate: answer => answer ? true : 'Public key of the producer is empty!',
}

const inputPublicKeyConsumer = {
  type: 'input',
  name: 'publicKeyConsumer',
  message: 'Public key of the consumer',
  validate: answer => answer ? true : 'Public key of the consumer is empty!',
}

const inputPublicKeyAgreedBid = {
  type: 'input',
  name: 'publicKeyAgreedBid',
  message: 'Public key of the bid logger',
  validate: answer => answer ? true : 'Public key of the bid logger is empty!',
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

   }],
  [new inquirer.Separator()],
  ['Exit', () => {
    console.log("exiting now");
    return process.exit(0);
  }],
]);

const mainMenu = [{
  type: 'rawlist',
  name: 'mainChoice',
  message: 'Please select a type of request',
  pageSize: 10,
  choices: Array.from(mainMenuMap.entries()).map(arr => arr[0])
}]

const showMainMenu = (configFile = configFilePath, questions = mainMenu) => {
  configFilePath = configFile;
  config = getConfig(configFile);

  inquirer.prompt(mainMenu).then(async answers => {
    mainMenuMap.get(answers.mainChoice)();
  });
}

showMainMenu();

module.exports = configFile => showMainMenu(configFile);