// Commenting out Firebase imports and initialization
// import { initializeApp } from "firebase/app";
// import { getFirestore, FieldValue, serverTimestamp, increment, arrayUnion } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_STORAGE_BUCKET",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID"
// };

// const app = initializeApp(firebaseConfig);
// export const db = getFirestore(app);

// Legacy support for older parts of the app that expect the firebase namespace
// export const firebase = {
//   firestore: {

// Replacing with Supabase initialization
import { supabase } from "./service/supabase";

export default supabase;