const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const STATIC_OTP = '123456';

const hashValue = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');

const hashPassword = (password) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, 'raya_auth_salt', 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKey.toString('hex'));
    });
  });

const comparePassword = async (password, hashedPassword) => {
  if (!hashedPassword) {
    return false;
  }

  const passwordHash = await hashPassword(password);
  return crypto.timingSafeEqual(
    Buffer.from(passwordHash, 'hex'),
    Buffer.from(hashedPassword, 'hex')
  );
};

const createOtp = () => STATIC_OTP;

const createAuthToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

module.exports = {
  STATIC_OTP,
  hashValue,
  hashPassword,
  comparePassword,
  createOtp,
  createAuthToken
};
