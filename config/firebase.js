// // firebase-admin-config.js
// import { readFile } from 'fs/promises';
// import admin from "firebase-admin";

// // Use relative path from the current file
// const serviceAccount = JSON.parse(
//   await readFile(new URL('../livyco-b65f5-firebase-adminsdk-fbsvc-bdf4b116db.json', import.meta.url))
// );

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// console.log("Firebase Admin initialized");
// export default admin;







import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Load service account from JSON file
    const serviceAccountPath = path.join(__dirname, '../livyco-b65f5-firebase-adminsdk-fbsvc-bdf4b116db.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://livyco-b65f5-default-rtdb.firebaseio.com"
    });
    
    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error);
    throw error;
  }
}

export default admin;