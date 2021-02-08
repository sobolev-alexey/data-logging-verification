const NodeRSA = require('node-rsa');

const generateKeys = () => {
    try {
        const keySize = 2048;
        const rsaKeypair = new NodeRSA({ b: keySize });
        if (rsaKeypair.getKeySize() === keySize && 
            rsaKeypair.getMaxMessageSize() >= Math.round(keySize / 10) &&
            rsaKeypair.isPrivate() &&
            rsaKeypair.isPublic()
        ) {
            return { 
                publicKey: rsaKeypair.exportKey('public'), 
                privateKey: rsaKeypair.exportKey('private')
            };
        } else {
            throw new Error('Key generation failed');
        }
    } catch (error) {
        throw new Error(error);
    }
}

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
    generateKeys,
    publicEncrypt,
    privateDecrypt,
    signMessage,
    verifySignature,
    getPublicKeyInstance,
    getPrivateKeyInstance
};
