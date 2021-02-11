const firebase = require('firebase');
const NodeRSA = require('node-rsa');
const crypto = require('crypto');
const isEmpty = require('lodash/isEmpty');
const { fetch } = require("./streams");
const { getStreamDetails } = require("./firebase");

const generateKeys = () => {
  try {
    const keySize = 2048;
    const rsaKeypair = new NodeRSA({ b: keySize });
    if (rsaKeypair.getKeySize() === keySize && 
      rsaKeypair.getMaxMessageSize() >= Math.round(keySize / 10) &&
      rsaKeypair.isPrivate() &&
      rsaKeypair.isPublic()
    ) {
      return { 
        publicKey: rsaKeypair.exportKey('public'), 
        privateKey: rsaKeypair.exportKey('private')
      };
    } else {
      throw new Error('Key generation failed');
    }
  } catch (error) {
    throw new Error(error);
  }
}

const verifyToken = async token => {
  const promise = new Promise((resolve, reject) => {
    firebase.auth().signInWithCustomToken(token)
      .then((userCredential) => {
        const user = userCredential.user;
        resolve({ 
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified
        });
      })
      .catch((error) => {
        console.error('verifyToken', error.code, error.message);
        reject(error);
      });
    });
    return promise;
};

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

const fetchStream = async (groupId, streamId) => {
  try {
    // Get existing stream by ID + group ID
    const streamDetails = await getStreamDetails(`${groupId}__${streamId}`);

    if (!streamDetails || isEmpty(streamDetails) || !streamDetails.metadata || isEmpty(streamDetails.metadata)) {
      return { status: "error", error: 'No stream metadata found', code: 404 };
    }

    // MAM fetch payload
    const messages = await fetch(streamDetails.metadata, streamId, groupId);

    return { status: "success", messages, metadata: streamDetails.metadata };
  } catch (error) {
    return { status: "error", error: error.message, code: error.code };
  };
}

module.exports = {
  generateKeys,
  verifyToken,
  isJSON,
  getHash,
  checkMessageTag,
  fetchStream
};
