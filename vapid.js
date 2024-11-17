const webPush = require('web-push');

// Generar claves VAPID
const vapidKeys = webPush.generateVAPIDKeys();
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
