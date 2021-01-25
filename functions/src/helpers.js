const firebase = require('firebase');
const NodeRSA = require('node-rsa');

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

module.exports = {
  generateKeys,
  verifyToken,
};
