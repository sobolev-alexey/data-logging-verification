const firebase = require('firebase');
const NodeRSA = require('node-rsa');
const crypto = require('crypto');

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

module.exports = {
  generateKeys,
  verifyToken,
  isJSON,
  getHash,
};
