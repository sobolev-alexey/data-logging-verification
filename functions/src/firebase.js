const admin = require('firebase-admin');

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

exports.register = async (uid, publicKey, groupId, user) => {
  try {
    await admin.firestore().collection('users').doc(uid).set({
      publicKey, 
      uid, 
      emailVerified: false, 
      email: user.email, 
      claimedGroupId: groupId,
      groups: ['temp']
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

exports.logMessage = async (messages, type, streamId = null, groupId = null) => {
  if (!streamId || !groupId) return;
  if (type !== 'logs' || type !== 'malicious') return;

  // Save logs by group and stream
  await admin
    .firestore()
    .collection(`${type}/${groupId}/streams/${streamId}/messages`)
    .doc(timestamp)
    .set({ 
      ...messages.map(message => message),
      streamId,
      groupId,
      timestamp: (new Date()).toLocaleString().replace(/\//g, '.')
    }, { merge: true });
};

exports.getStreamDetails = async key => {
  // Get stream details by groupId + streamId
  const doc = await admin
    .firestore()
    .collection('streams')
    .doc(key)
    .get();
  return doc.exists ? doc.data() : null;
};

exports.getStreamMessages = async key => {
  // Get stream messages by groupId + streamId
  const messagesSnapshot = await admin
    .firestore()
    .collection(`streams/${key}/messages`)
    .get();

  return messagesSnapshot.docs.map(document => 
    document.exists ? document.data() : null
  );
};

exports.storeStreamMessage = async (key, metadata, message) => {
  const date = (new Date()).toLocaleString().replace(/\//g, '.');
  const timestamp = Date.now();

  try {
    // Update metadata
    await admin
      .firestore()
      .collection('streams')
      .doc(key)
      .set({ 
        lastModified: date,
        lastModifiedTimestamp: timestamp,
        ...metadata
      }, { merge: true });

    // Store new message
    await admin
      .firestore()
      .collection('streams')
      .doc(key)
      .collection('messages')
      .doc(`${message.index}`)
      .set({
        created: date,
        createdTimestamp: timestamp,
        metadata: metadata.metadata,
        ...message
      });

    return true;
  } catch (error) {
    return error;
  }
};
