const NodeRSA = require('node-rsa');

const publicEncrypt = (publicKey, message) => {
    try {
        const publicKeyInstance = getPublicKeyInstance(publicKey);
        return JSON.stringify(
            publicKeyInstance.encrypt(Buffer.from(message))
        );
    } catch (error) {
        throw new Error(error);
    }
}

const privateDecrypt = (privateKey, input) => {
    try {
        const privateKeyInstance = getPrivateKeyInstance(privateKey);
        const decrypted = privateKeyInstance.decrypt(
            Buffer.from(JSON.parse(input))
        );
        return JSON.parse(decrypted.toString());
    } catch (error) {
        throw new Error(error);
    }
}

const signMessage = (privateKey, dataToSign) => {
    try {
        const privateKeyInstance = getPrivateKeyInstance(privateKey);
        return privateKeyInstance.sign(
            Buffer.from(JSON.stringify(dataToSign))
        );
    } catch (error) {
        throw new Error(error);
    }
}

const verifySignature = (publicKey, dataToCheck, signatureToVerify) => {
    try {
        const publicKeyInstance = getPublicKeyInstance(publicKey);
        return publicKeyInstance.verify(
            Buffer.from(JSON.stringify(dataToCheck)), 
            Buffer.from(signatureToVerify)
        );
    } catch (error) {
        throw new Error(error);
    }
}

const getPublicKeyInstance = (publicKey) => {
    try {
        const nodeRSA = new NodeRSA();
        return nodeRSA.importKey(publicKey, 'public');
    } catch (error) {
        throw new Error(error);
    }
}

const getPrivateKeyInstance = (privateKey) => {
    try {
        const nodeRSA = new NodeRSA();
        return nodeRSA.importKey(privateKey, 'private');
    } catch (error) {
        throw new Error(error);
    }
}

module.exports = {
  publicEncrypt,
  privateDecrypt,
  signMessage,
  verifySignature,
  getPublicKeyInstance,
  getPrivateKeyInstance
};
