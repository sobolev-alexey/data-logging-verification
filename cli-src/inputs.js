const { getConfig, parseJSON, isJSON } = require('./utils');

const config = getConfig();

const inputStreamId = {
  type: 'input',
  name: 'streamId',
  message: "Stream ID",
  default: config.streamId,
  validate: answer => answer ? true : 'Stream ID is empty!',
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

module.exports = {
  inputStreamId,
  inputTag,
  inputType,
  inputData,
  inputMessageIndex,
  inputReturnPayload,
  inputReturnMetadata,
  inputStreamIdProducer,
  inputStreamIdConsumer,
  inputStreamIdAgreedBid,
};