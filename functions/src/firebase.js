const admin = require('firebase-admin');

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

exports.logMessage = async (messages, type, streamId = null, groupId = null) => {
  if (!streamId || !groupId) return;
  if (type !== 'logs' && type !== 'malicious') return;
  const timestamp = `${(new Date()).toLocaleString().replace(/\//g, '.')}`;

  // Save logs by group and stream
  await admin
    .firestore()
    .collection(type)
    .doc(`${groupId}__${streamId}`)
    .collection(type)
    .doc(timestamp)
    .set({ 
      ...messages.map(message => message),
      streamId,
      groupId,
      timestamp
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
