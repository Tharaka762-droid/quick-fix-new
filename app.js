// 🔑 Global Firebase Configuration (100% Accurate API Key with --)
const firebaseConfig = {
  apiKey: "AIzaSyD29G6zoTABg1YybqIWdKzCq_v--pA0ofI",
  authDomain: "quickfix-new.firebaseapp.com",
  projectId: "quickfix-new",
  storageBucket: "quickfix-new.firebasestorage.app",
  messagingSenderId: "316535009311",
  appId: "1:316535009311:web:975f6b2b89604447c0e52a"
};

// Initialize Firebase safely
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Global Auth Check
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is logged in:", user.email);
    } else {
        console.log("No user logged in.");
    }
});
