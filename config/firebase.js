// firebase-admin-config.js
import { readFile } from 'fs/promises';
import admin from "firebase-admin";

// Use relative path from the current file
const serviceAccount = JSON.parse(
  await readFile(new URL('../livyco-b65f5-firebase-adminsdk-fbsvc-bdf4b116db.json', import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("Firebase Admin initialized");
export default admin;
