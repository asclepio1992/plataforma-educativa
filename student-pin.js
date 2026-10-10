const crypto=require('node:crypto');
const pinHash=(pin,salt)=>new Promise((resolve,reject)=>crypto.scrypt(pin,salt,32,(error,key)=>error?reject(error):resolve(key.toString('hex'))));
async function makePin(){const pin=String(crypto.randomInt(100000,1000000)),pinSalt=crypto.randomBytes(16).toString('hex');return {pin,pinSalt,pinHash:await pinHash(pin,pinSalt)};}
async function checkPin(pin,student){return typeof pin==='string'&&/^\d{6}$/.test(pin)&&/^[a-f0-9]{32}$/.test(student.pinSalt||'')&&/^[a-f0-9]{64}$/.test(student.pinHash||'')&&crypto.timingSafeEqual(Buffer.from(await pinHash(pin,student.pinSalt),'hex'),Buffer.from(student.pinHash,'hex'));}
module.exports={makePin,checkPin};
