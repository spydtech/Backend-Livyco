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

// Initialize Firebase Admin only once with better error handling
let firebaseAdminInitialized = false;

const initializeFirebaseAdmin = () => {
  if (firebaseAdminInitialized) {
    return admin;
  }

  try {
    console.log('🔄 Initializing Firebase Admin...');
    
    // Use direct service account configuration (more reliable)
    const serviceAccount = {
          "type": "service_account",
        "project_id": "livyco-b65f5",
        "private_key_id": "6d0129e2200c1d702a3db4c17309f0a36e59cc2a",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC8GHIsn27lyC6U\ng7jgC0fnVYAFWDQBaOnlgWTqMGO7CxXuayS0yFHRYY2NjQImC1vwbSLOpJLisJo/\nB0g2Be32LMR+3bK1QYQKwfkQotdju74ktd+W2nSDy/h1YBHVka4rQFmNj/XAxrDO\n0ws3wQ6rrYVfXjgEKb0lZO2UcfHXlldkus3XGGoypvwsv/Ss4UovcLYSqDd+8aJ2\nzPsdLmRUaN4sTCP8B3K7QQBfgbNYuiNaftYNXpip01p/mYq3h0yIuwuXTGq5cHWL\n1XB0vTaYkP+1OOsJdUfjvGL2YxLRS8geu9GmLz5QX1m432aLMp0Jz00QNGCMLqwk\nchVbPTODAgMBAAECggEAUrvj+Im2Mz8OcgfQWUfM/E2IzpEB6v7VJrx4AWSAcYTK\nRED/d79G8bSZmUIFSGulqIawkTklXK22YvPWiOCpzybY1T65vO1Q4ZR5c55U5Erv\ns2EGNGnpZxFgO2yi25BFDkQzP8erHnymx4pfvEngJJZh/FVKiVY8msaek7Vc3WjD\nND1l31cCdG58UJ7xpx3n1kM6QLJM57jSqej486YSFr4BkiIJstCVuNeQ+QnU95Ti\nHbrsLbQImkyosi4OUyBahM6n05JSvFVKZHvTf3To4dkrYeSJWpfACJrxlmdzAY7V\nVrhDbr+FWtVhQ0whKE+arbJVB5X9qy+SBz0eqAgLLQKBgQDwhYJhZs8381EQPXhQ\nG3qdeo5mulZlkBGzWxOieLi2/Iji0CWKCmRSCZ9KrVt+wglOS4H8Mqzts3dAlWbf\nEoq687gBlC3bnxwQLYP3QAJiFaNWXid5KXiP89izuwfW1Zm8mHvh+F8Fh9rkF9KE\naEG0V/tdxvBTWAhzq9mHxFxtdQKBgQDIMz1uarpGuhOZJc9CAlz/330a6xmBq0Jm\nZX6zAK1F0ojYj0RpNTQhuYUG1EZu+cY01gkKZAYHCN+tkAjCBbNRuU5J5wmG16cr\nz2BxK70ohnHV6XDbaGYFPrgi3VX9tQPprxiABGRTGkIFoNw/nY4G1mqUrCpu0aj3\nDY9LvfAmFwKBgQCpk5fPEGs86WHX717qK9WRPh00NGBBjwfLyoTXYgHpkbb5IwO0\nhYshhAM45WzCvA9PklD8/MWLeaK0eCFlWW9STA8Jne2PEGj6xvxp0Eld2h+k/xEZ\njbGg3K2GWnE2eLbBj0iYk0J7ZcNgWaNlExRwEC/7eA1s1X5v/1OJM1pvGQKBgQCf\nLX6OqHVrfs/OWO2twktHdt715C/nlc+5ssFGeidK+NatuVvfetn0ZpmKkIVf/2DE\n6dlOVbElLr0KNxd/jSDCvd+tivFcMWNNxhkcYnaIHj2so2uESEG1seSec/XHP4HY\n78s/Hj7WhG4yI3B7dD5U2W7svucOLc12gWWKB39GCQKBgHkrVvZjP23XoSoXZYN0\n8w59YP9VTAbs0s/6vYJjkhaypvE23iG2T9TIdc6l2eDrJ+vPEOtSPVyRh64YY6bo\nC1STLLpFo4O2VCj78SgrGY5OCXEuwiO7vmTXqjhjf482R/FPP4NhLU0mJ3x4c+GV\nGkuLvIlRxlRr2OuodwedhwWR\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-fbsvc@livyco-b65f5.iam.gserviceaccount.com",
        "client_id": "110492546779742691196",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40livyco-b65f5.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    };

    // Validate required fields
    if (!serviceAccount.private_key) {
      throw new Error("Firebase private key is missing");
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://livyco-b65f5-default-rtdb.firebaseio.com"
    });
    
    firebaseAdminInitialized = true;
    console.log(" Firebase Admin initialized successfully");
    
    return admin;
    
  } catch (error) {
    console.error(" Firebase Admin initialization failed:", error);
    
    // Fallback: Try with application default credentials
    try {
      console.log("🔄 Trying Firebase Admin with default credentials...");
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: "https://livyco-b65f5-default-rtdb.firebaseio.com"
      });
      
      firebaseAdminInitialized = true;
      console.log(" Firebase Admin initialized with default credentials");
      return admin;
    } catch (fallbackError) {
      console.error(" Firebase Admin fallback also failed:", fallbackError);
      throw fallbackError;
    }
  }
};

// Export initialized admin
export default initializeFirebaseAdmin();
