const crypto = require('crypto');
const isEmpty = require('lodash/isEmpty');
const { composeAPI } = require('@iota/core');
const { asciiToTrytes, trytesToAscii } = require('@iota/converter')
const { createChannel, createMessage, mamAttach, mamFetchAll } = require('@iota/mam.js');
const { getSettings, logMessage } = require('./firebase');

const generateSeed = (length = 81) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  let seed = '';
  while (seed.length < length) {
      const byte = crypto.randomBytes(1);
      if (byte[0] < 243) {
          seed += charset.charAt(byte[0] % 27);
      }
  }
  return seed;
};

const publish = async (payload, tag ='', currentState = null, streamId = null, groupId = null) => {
  const logs = [];

  const settings = await getSettings();
  if (!settings || isEmpty(settings.tangle)) {
    const settingsErrorMessage = 'Settings not defined';
    settings.enableCloudLogs && logs.push(settingsErrorMessage);
    console.error(settingsErrorMessage);
    throw new Error(settingsErrorMessage);
  }

  try {
    // Setup the details for the channel.
    const { depth, mwm, node, security, defaultTag, network } = settings.tangle;
    const sideKey = generateSeed();
    let channelState = currentState;

    // If we haven't received existing channel details then create a new channel.
    if (!channelState || isEmpty(channelState)) {
      channelState = createChannel(generateSeed(), security, 'restricted', sideKey);
    }

    // Create a Streams message using the channel state.
    const message = createMessage(channelState, asciiToTrytes(JSON.stringify(payload)));
    const root = currentState ? currentState.root : message.root;
    channelState.root = root;

    if (settings.enableCloudLogs) {
      const attachMessage = `Attaching to Tangle, please wait... ${root}`;
      logs.push(attachMessage);
      console.log(attachMessage);
    }

    // Attach the message.    
    const api = composeAPI({ provider: node });
    const bundle = await mamAttach(api, message, depth, mwm, tag || defaultTag);
    const bundleHash = bundle && bundle.length && bundle[0].hash;
    channelState.bundleHash = bundleHash;

    if (settings.enableCloudLogs) {
      // Log success
      const message = `You can view the Stream channel here https://utils.iota.org/mam/${root}/restricted/${sideKey}/${network}`;
      logs.push(message);
      console.log(message);

      if (bundleHash) {
        const bundleMessage = `Bundle hash: ${bundleHash}`;
        logs.push(bundleMessage);
        console.log(bundleMessage);
      }

      await logMessage(logs, 'logs', streamId, groupId);
    }

    return channelState;

  } catch (attachError) {
    const attachErrorMessage = 'Streams attach message failed';
    console.error(attachErrorMessage, attachError);
    throw new Error(attachErrorMessage, attachError);
  }
}

const fetch = async (channelState, streamId = null, groupId = null) => {
  const logs = [];

  const settings = await getSettings();
  if (!settings || isEmpty(settings.tangle) || !settings.nodes.length) {
    const settingsErrorMessage = 'Settings not defined';
    settings.enableCloudLogs && logs.push(settingsErrorMessage);

    console.error(settingsErrorMessage);
    throw new Error(settingsErrorMessage);
  }

  try {
    // Setup the details for the channel.
    const { chunkSize, node } = settings.tangle;
    const { root, sideKey } = channelState;
    const api = composeAPI({ provider: node });

    settings.enableCloudLogs && logs.push('Fetching from Tangle, please wait...', root);

    const fetched = await mamFetchAll(api, root, 'restricted', sideKey, chunkSize);
    const result = [];
        
    if (fetched && fetched.length > 0) {
        for (let i = 0; i < fetched.length; i++) {
          fetched[i] && fetched[i].message && 
          result.push(JSON.parse(trytesToAscii(fetched[i].message)));
        }
    }
    
    if (settings.enableCloudLogs) {
      if (result.length) {
        // Log success
        const message = `Fetched from ${root}: ${result.length}`;
        console.log(message);
        logs.push(message);
      } else {
        const message = `Nothing was fetched from the Streams channel ${root}`;
        console.error(message);
        logs.push(message);
      }

      await logMessage(logs, 'logs', streamId, groupId);
    }

    return result;

  } catch (fetchError) {
    const fetchErrorMessage = 'Streams fetch message failed';
    console.error(fetchErrorMessage, fetchError);
    throw new Error(fetchErrorMessage, fetchError);
  }
}

module.exports = {
  fetch,
  publish
}