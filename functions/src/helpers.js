const jwt = require('jsonwebtoken');
const NodeRSA = require('node-rsa');
const serviceAccount = require('./serviceAccount.json');
const publicKey = new NodeRSA().importKey(serviceAccount.private_key, "pkcs8-private-pem").exportKey("pkcs8-public-pem");

const verifyToken = async token => {
  const promise = new Promise(resolve => {
    jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, decoded) => {
      if (err) {
        throw new Error(err);
      } else {
        resolve(decoded);
      }
    });
  });
  return promise;
};

module.exports = {
  verifyToken
};
