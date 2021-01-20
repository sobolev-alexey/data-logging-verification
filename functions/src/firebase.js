require('./firebaseInit');
const admin = require('firebase-admin');
const firebase = require('firebase');

exports.setUser = async (uid, obj) => {
  await admin.firestore().collection('users').doc(uid).set(obj);

  return true;
};

exports.getUser = async (userId) => {
  // Get user
  const userDocument = await admin
    .firestore()
    .collection('users')
    .doc(userId)
    .get();

  // Check and return user
  if (userDocument.exists) {
    const user = userDocument.data();

    return user;
  }

  console.log('User not in DB:', userId);
  return null;
};

exports.getServiceAccount = async () => {
  // Get settings
  const doc = await admin
    .firestore()
    .collection('settings')
    .doc('settings')
    .get();
  if (doc.exists) {
    const settings = doc.data();
    return settings.serviceAccount || null;
  }

  const message = 'getSettings failed. Setting does not exist';
  console.error(message, doc);
  throw Error(message);
};

exports.getSettings = async () => {
  // Get settings
  const doc = await admin
    .firestore()
    .collection('settings')
    .doc('settings')
    .get();
  if (doc.exists) {
    const settings = doc.data();
    return {
      googleMaps: settings.googleMaps,
    } || null;
  }

  const message = 'getSettings failed. Setting does not exist';
  console.error(message, doc);
  throw Error(message);
};

exports.getEncryption = async () => {
  // Get encryption settings
  const doc = await admin
    .firestore()
    .collection('settings')
    .doc('settings')
    .get();
  if (doc.exists) {
    const settings = doc.data();
    return {
      encryption: settings.encryption,
    } || null;
  }

  const message = 'getEncryption failed. Setting does not exist';
  console.error(message, doc);
  throw Error(message);
};

exports.userLogin = async email => {
  try {
      const settings = {
        url: 'https://www.example.com',
        handleCodeInApp: true,
      };
      admin
        .auth()
        .generateSignInWithEmailLink(email, settings)
        .then((link) => {
            firebase.auth().sendSignInLinkToEmail(email, settings);
            // firebase.auth().signInWithEmailLink(email, link);
            // console.log("link", link);
  })
  } catch(error) {
      console.error(error);
      throw error;
  }
}





