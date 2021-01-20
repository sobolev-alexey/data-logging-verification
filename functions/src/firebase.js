const admin = require('firebase-admin');
require('dotenv').config();

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
  const { Magic } = require("@magic-sdk/admin");
  const magic = new Magic(process.env.MAGIC_SECRET_API_KEY);
  console.log("HEREE");

  /* Get users */
  const usersCollection = await admin
    .firestore()
    .collection('users');

  if (email) {
    const didToken = await magic.auth.loginWithMagicLink({ email });
    const auth = firebase.functions().httpsCallable("auth");
    let result = (await auth({ didToken })).data;
    await firebase.auth().signInWithCustomToken(result.token);
    let user = await usersCollection.doc(result.uid).get();
    if (!user.exists) {
      /* Add new user to database */
      let newUser = {
        email: email,
      };
      await usersCollection.doc(result.uid).set(newUser);
      console.log(`User ${email} just signed up!`);
    }
  }
  return true;
};

exports.userLogout = async () => {
  await magic.user.logout();
  await firebase.auth().signOut();
};