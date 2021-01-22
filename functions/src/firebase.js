require('./firebaseInit');
const admin = require('firebase-admin');
const firebase = require('firebase');

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

exports.getSettings = async () => {
  // Get settings
  const doc = await admin
    .firestore()
    .collection('settings')
    .doc('settings')
    .get();
  if (doc.exists) {
    const settings = doc.data();
    return settings;
  }

  const message = 'getSettings failed. Setting does not exist';
  console.error(message, doc);
  throw Error(message);
};

exports.register = async (uid, publicKey, user) => {
  try {
    await admin.firestore().collection('users').doc(uid).set({
      publicKey, uid, emailVerified: false, email: user.email
    });
  } catch(error) {
    console.error('Firebase register', error);
    throw error;
  }
}

exports.completeRegistration = async uid => {
  try {
    await admin.firestore().collection('users').doc(uid).set({
      emailVerified: true
    }, { merge: true });
  } catch(error) {
      console.error('Firebase completeRegistration', error);
      throw error;
  }
}

exports.completeLogin = async (uid, flag) => {
  try {
    await admin.firestore().collection('users').doc(uid).set({
      loginConfirmed: flag
    }, { merge: true });
  } catch(error) {
      console.error('Firebase completeRegistration', error);
      throw error;
  }
}



