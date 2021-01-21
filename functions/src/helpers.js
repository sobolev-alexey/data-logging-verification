const firebase = require('firebase');

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
  verifyToken,
};
