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

const taskListContainer = document.getElementById('taskList');

// Firestore එකේ තියෙන දත්ත සජීවීව (Real-time) කියවීම
db.collection("tasks").orderBy("createdAt", "desc").onSnapshot((querySnapshot) => {
    taskListContainer.innerHTML = ""; // පරණ ලැයිස්තුව හිස් කිරීම

    if (querySnapshot.empty) {
        taskListContainer.innerHTML = `<p style="color: #888; text-align: center;">නව හදිසි අවශ්‍යතා සෙමින් පවතී...</p>`;
        return;
    }

    querySnapshot.forEach((doc) => {
        const task = doc.data();
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        
        taskCard.innerHTML = `
            <div class="task-header">
                <h3>🔔 ${task.title}</h3>
                <span class="urgency-badge" style="background: ${task.urgency === 'වහාම අවශ්‍යයි' ? '#ff4d4d' : '#f39c12'}">${task.urgency}</span>
            </div>
            <p style="color: #555; margin-bottom: 10px;"><strong>විස්තර:</strong> ${task.description}</p>
            <p><strong>කස්ටමර්:</strong> ${task.customerName}</p>
            <p><strong>දුරකථනය:</strong> <a href="tel:${task.customerPhone}">${task.customerPhone}</a></p>
            <p><strong>ස්ථානය:</strong> <a href="${task.location}" target="_blank" style="color: #3498db; font-weight:bold;">Google Map එකෙන් බලන්න 📍</a></p>
            
            <div class="task-header" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
                <span class="budget-tag">රු. ${task.budget}</span>
                <button class="btn-accept" onclick="alert('ඔබ මේ වැඩේ බාරගත්තා! කස්ටමර්ගේ දුරකථන අංකයට ඇමතුමක් ලබාගන්න.')">වැඩේ බාරගන්න (Accept)</button>
            </div>
        `;
        
        taskListContainer.appendChild(taskCard);
    });
});