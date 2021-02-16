const { getConfig, parseJSON, isJSON, validateEmail } = require('./utils');

const config = getConfig();

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

module.exports = {
  inputStreamId,
  inputGroupId,
  inputTag,
  inputType,
  inputKeyFile,
  inputEmail,
  inputData,
  inputPublicKey,
  inputMessageIndex,
  inputReturnPayload,
  inputReturnMetadata,
  inputStreamIdProducer,
  inputStreamIdConsumer,
  inputStreamIdAgreedBid,
  inputPublicKeyProducer,
  inputPublicKeyConsumer,
  inputPublicKeyAgreedBid
};