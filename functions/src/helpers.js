const jwt = require('jsonwebtoken');
const NodeRSA = require('node-rsa');
const serviceAccount = require('./serviceAccount.json');
const publicKey = new NodeRSA().importKey(serviceAccount.private_key, "pkcs8-private-pem").exportKey("pkcs8-public-pem");
const admin = require('firebase-admin');

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

const handleExistingUser = async (user, claim) => {
  /* Check for replay attack (https://go.magic.link/replay-attack) */
  let lastSignInTime = Date.parse(user.metadata.lastSignInTime) / 1000;
  let tokenIssuedTime = claim.iat;
  if (tokenIssuedTime <= lastSignInTime) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "This DID token is invalid."
    );
  }
  let firebaseToken = await admin.auth().createCustomToken(user.uid);
  return {
    uid: user.uid,
    token: firebaseToken
  };
};

const handleNewUser = async email => {
  const newUser = await admin.auth().createUser({
    email: email,
    emailVerified: true
  });
  let firebaseToken = await admin.auth().createCustomToken(newUser.uid);
  return {
    uid: newUser.uid,
    token: firebaseToken
  };
};

module.exports = {
  verifyToken,
  handleExistingUser,
  handleNewUser
};