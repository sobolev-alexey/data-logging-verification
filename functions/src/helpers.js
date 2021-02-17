const crypto = require('crypto');
const isEmpty = require('lodash/isEmpty');
const { fetch } = require("./streams");
const { getStreamDetails } = require("./firebase");

const isJSON = data => {
  let hasKeys = false;
  for (let property in data) {
    if (data.hasOwnProperty(property) && !(/^\d+$/.test(property))) {
      hasKeys = true;
      break;
    }
  }

  return (hasKeys && data.constructor === Object && data.constructor !== Array) ? true : false;
}

const getHash = payload => {
  return crypto.createHash('sha256').update(payload).digest('hex');
};

const checkMessageTag = tag => {
  const regex = /^[A-Za-z0-9]+$/;
  return regex.test(tag) && tag.length <= 27;
}

const fetchStream = async streamId => {
  try {
    // Get existing stream by ID
    const streamDetails = await getStreamDetails(streamId);

    if (!streamDetails || isEmpty(streamDetails) || !streamDetails.metadata || isEmpty(streamDetails.metadata)) {
      return { status: "error", error: 'No stream metadata found', code: 404 };
    }

    // MAM fetch payload
    const messages = await fetch(streamDetails.metadata, streamId);

    return { status: "success", messages, metadata: streamDetails.metadata };
  } catch (error) {
    return { status: "error", error: error.message, code: error.code };
  };
}

module.exports = {
  isJSON,
  getHash,
  checkMessageTag,
  fetchStream
};
