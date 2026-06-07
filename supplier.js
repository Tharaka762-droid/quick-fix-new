// 🔑 Global Firebase Configuration (100% Accurate API Key with --)
const firebaseConfig = {
  apiKey: "AIzaSyD29G6zoTABg1YybqIWdKzCq_v--pA0ofI",
  authDomain: "quickfix-new.firebaseapp.com",
  projectId: "quickfix-new",
  storageBucket: "quickfix-new.firebasestorage.app",
  messagingSenderId: "316535009311",
  appId: "1:316535009311:web:975f6b2b89604447c0e52a"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Supplier/Rider Page Logic
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "auth.html";
    } else {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().role !== "supplier") {
                alert("Unauthorized access!");
                window.location.href = "auth.html";
            }
        });
    }
});
