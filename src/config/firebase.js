const firebaseAdmin = require("firebase-admin");
const serviceAccount = require("../secrets/Firebasesecret.json");

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

module.exports = firebaseAdmin;
