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
            firebase.auth().signInWithEmailLink(email, link);
            // console.log("link", link);
  })
  } catch(error) {
      console.error(error);
      throw error;
  }
}

exports.register = async email => {
  try {
      admin
        .auth()
        .createUser({
          email: email,
          emailVerified: false
        })
        .then((userRecord) => {
          // See the UserRecord reference doc for the contents of userRecord.
          console.log('Successfully created new user:', userRecord.toJSON());

          const settings = {
            url: `https://us-central1-data-logging-verification.cloudfunctions.net/api/register-complete/?uid=${userRecord && userRecord.uid}`,
            handleCodeInApp: true,
          };

          admin
            .auth()
            .generateEmailVerificationLink(email, settings)
            .then((link) => {
              console.log("link", link);
              firebase.auth().sendSignInLinkToEmail(email, settings)
                .then(async () => {
                  console.log("email success");
                  // The link was successfully sent. Inform the user. Save the email
                  // locally so you don't need to ask the user for it again if they open
                  // the link on the same device.
                })
                .catch(error => {
                  console.log("email error", error);
                  // Some error occurred, you can inspect the code: error.code
                });
            })
        })
        .catch((error) => {
          console.log('Error creating new user:', error);
        });
  } catch(error) {
      console.error(error);
      throw error;
  }
}

exports.completeRegistration = async uid => {
  try {
    const promise = new Promise((resolve, reject) => {
      admin
        .auth()
        .getUser(uid)
        .then(async (userRecord) => {
          await admin.auth().updateUser(uid, {
            ...userRecord,
            emailVerified: true
          });

          console.log(`Successfully fetched user data:`, userRecord.uid, uid);
          const token = await admin.auth().createCustomToken(userRecord.uid);
          resolve(token);
        })
        .catch((error) => {
          console.log('Error fetching user data:', error);
          reject(error);
        });
    });
    return promise;
  } catch(error) {
      console.error(error);
      throw error;
  }
}



