const crypto = require('crypto');
const { getEncryption } = require("./firebase");

exports.decrypt = async encrypted => {
  try {
    const { encryption } = await getEncryption();
    const ENC_KEY = Buffer.from(encryption.keyString).toString('hex').slice(0, 32);
    const IV = Buffer.from(encryption.ivString).toString('hex').slice(0, 16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, IV);
    const decrypted = decipher.update(encrypted, 'base64', 'utf8');
    const final = decipher.final('utf8');
    return decrypted + final;
  } catch (error) {
    console.log('decrypt ERROR', encrypted);
    throw new Error(error);
  }
};