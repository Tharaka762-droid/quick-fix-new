import initializeApp from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js";
import firebase from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js";

// ඔයාගේ අලුත්ම සැබෑ Firebase Config එක
const firebaseConfig = {
  apiKey: "AIzaSyD29G6zoTABg1YybqIWdKzCq_v--pA0oFI",
  authDomain: "quickfix-new.firebaseapp.com",
  projectId: "quickfix-new",
  storageBucket: "quickfix-new.firebasestorage.app",
  messagingSenderId: "316535009311",
  appId: "1:316535009311:web:975f6b2b89604447c0e52a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.getElementById('quickfixTaskForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const urgency = document.getElementById('urgency').value;
    const budget = document.getElementById('budget').value;
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const googleMapLink = `https://maps.google.com/?q=${lat},${lng}`;

            // Firestore එකේ "tasks" කියන එකට ලයිව්ම දත්ත දානවා
            db.collection("tasks").add({
                title: title,
                description: desc,
                urgency: urgency,
                budget: budget,
                customerName: name,
                customerPhone: phone,
                location: googleMapLink,
                status: "pending",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                alert("🚀 සාර්ථකයි! ඔබේ හදිසි අවශ්‍යතාවය පද්ධතියට ඇතුලත් වුණා. සපයන්නෙකු වහාම සම්බන්ධ වනු ඇත.");
                document.getElementById('quickfixTaskForm').reset();
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
                alert("දෝෂයක් සිදුවුණා: " + error.message);
            });

        }, function(error) {
            alert("කරුණාකර සජීවී ස්ථානය (Location) ලබාගැනීමට අවසර ලබාදෙන්න.");
        });
    } else {
        alert("ඔබේ බ්‍රවුසර් එක මඟින් ලොකේෂන් ලබාගත නොහැක.");
    }
});