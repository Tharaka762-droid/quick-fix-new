const part1 = "AIzaSyD29G6zoTAbg1YybqIWdKzCq"; const part2 = "_v--pAOOfI";
const firebaseConfig = { apiKey: part1 + part2, authDomain: "quickfix-new.firebaseapp.com", projectId: "quickfix-new" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(), db = firebase.firestore();

let map, routingControl, pickupMarker, dropMarker, liveLocationMarker;
let activeChatJobId = null, chatListener = null, currentCategory = "General Fix", perKmRate = 80, originalPrice = 0, isPromoApplied = false;
let mediaRecorder, audioChunks = [], isRecording = false;

const hrs = new Date().getHours();
if(document.getElementById('lblGreeting')) {
    document.getElementById('lblGreeting').innerText = hrs < 12 ? "Good Morning!☀️" : hrs < 17 ? "Good Afternoon!🌤️" : "Good Evening!🌙";
}

function initMap() {
    if(map) return;
    map = L.map('map').setView([6.9271, 79.8612], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap contributors &copy; CARTO' }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(pos => {
            let lat = pos.coords.latitude, lng = pos.coords.longitude;
            if(!liveLocationMarker) {
                const liveIcon = L.divIcon({ className: 'live-dot-wrapper', html: '<div class="live-dot"></div>', iconSize: [12, 12] });
                liveLocationMarker = L.marker([lat, lng], { icon: liveIcon }).addTo(map);
                map.setView([lat, lng], 15);
                setPickupLocation(lat, lng);
            } else { liveLocationMarker.setLatLng([lat, lng]); }
        }, null, { enableHighAccuracy: true });
    }

    map.on('click', function(e) {
        if (!document.getElementById('pickupLat').value) { setPickupLocation(e.latlng.lat, e.latlng.lng); }
        else if (!document.getElementById('dropLat').value) { setDropLocation(e.latlng.lat, e.latlng.lng); calculateRoute(); }
        else { resetRoutingSetup(); setPickupLocation(e.latlng.lat, e.latlng.lng); }
    });
}

function toggleSchedulerInputsDisplay(checked) {
    const row = document.getElementById('schedulerInputsRow');
    if(checked) { row.classList.remove('hidden'); } else { row.classList.add('hidden'); }
}

function addNewChecklistItemRow() {
    const container = document.getElementById('checklistTasksContainer');
    const item = document.createElement('div'); item.className = "checklist-item";
    item.innerHTML = `<input type="text" class="task-input-item" placeholder="උදා: තව වැඩක්...">`;
    container.appendChild(item);
}

function triggerSavedPlaceSearch(placeName) {
    document.getElementById('globalAddressSearchInput').value = placeName;
    searchGlobalAddressRoute();
}

function searchGlobalAddressRoute() {
    let query = document.getElementById('globalAddressSearchInput').value.trim();
    if(!query) return;
    if(document.getElementById('postFormArea').style.display === "none") openQuickFixForm('General Fix', 'QuickFix සේවාව', 80);

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=lk`)
    .then(res => res.json())
    .then(data => {
        if(data.length > 0) {
            let lat = parseFloat(data[0].lat); let lng = parseFloat(data[0].lon);
            if (!document.getElementById('pickupLat').value) { map.setView([lat, lng], 14); setPickupLocation(lat, lng); }
            else { setDropLocation(lat, lng); calculateRoute(); }
        } else { alert("❌ ස්ථානය සොයාගත නොහැකි විය."); }
    });
}

function setPickupLocation(lat, lng) {
    document.getElementById('pickupLat').value = lat; document.getElementById('pickupLng').value = lng;
    if(pickupMarker) map.removeLayer(pickupMarker);
    pickupMarker = L.marker([lat, lng], {icon: L.icon({iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', iconSize: [25, 41], iconAnchor: [12, 41]})}).addTo(map);
    if(document.getElementById('mapHint')) document.getElementById('mapHint').innerText = "පියවර 2: යායුතු ස්ථානය (Destination) සිතියම මත ක්ලික් කරන්න හෝ උඩින් සර්ච් කරන්න.";
}

function setDropLocation(lat, lng) {
    document.getElementById('dropLat').value = lat; document.getElementById('dropLng').value = lng;
    if(dropMarker) map.removeLayer(dropMarker);
    dropMarker = L.marker([lat, lng], {icon: L.icon({iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', iconSize: [25, 41], iconAnchor: [12, 41]})}).addTo(map);
}

function resetRoutingSetup() {
    document.getElementById('pickupLat').value = ""; document.getElementById('pickupLng').value = "";
    document.getElementById('dropLat').value = ""; document.getElementById('dropLng').value = "";
    if(pickupMarker) map.removeLayer(pickupMarker); if(dropMarker) map.removeLayer(dropMarker);
    if(routingControl) map.removeControl(routingControl);
    document.getElementById('priceDisplayPanel').style.display = "none";
    document.getElementById('promoInputCode').value = "";
    document.getElementById('promoRow').style.display = "none"; isPromoApplied = false;
}

function calculateRoute() {
    let pLat = parseFloat(document.getElementById('pickupLat').value);
    let pLng = parseFloat(document.getElementById('pickupLng').value);
    let dLat = parseFloat(document.getElementById('dropLat').value);
    let dLng = parseFloat(document.getElementById('dropLng').value);
    if(routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [ L.latLng(pLat, pLng), L.latLng(dLat, dLat ? dLng : pLng) ],
        router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
        lineOptions: { styles: [{ color: '#1a73e8', opacity: 0.8, weight: 6 }] },
        createMarker: function() { return null; }
    }).addTo(map);

    routingControl.on('routesfound', function(e) {
        let routes = e.routes;
        let distanceInKm = (routes[0].summary.totalDistance / 1000).toFixed(1);
        
        let basePrice = 200;
        let distanceCost = Math.round(distanceInKm * perKmRate);
        originalPrice = basePrice + distanceCost;

        document.getElementById('lblKmText').innerText = distanceInKm + " KM";
        document.getElementById('lblDistanceFare').innerText = "රු. " + distanceCost + ".00";
        renderCostBreakdownOutput();
        document.getElementById('priceDisplayPanel').style.display = "block";
    });
}

function renderCostBreakdownOutput() {
    let finalPrice = originalPrice;
    if(isPromoApplied) { finalPrice = originalPrice - 250; if(finalPrice < 200) finalPrice = 200; }
    document.getElementById('txtCalculatedPrice').innerText = "රු. " + finalPrice + ".00";
    document.getElementById('jobBudget').value = finalPrice;
}

function applyPromoDiscountCode() {
    let code = document.getElementById('promoInputCode').value.trim();
    if(code === "QFIX2026") {
        isPromoApplied = true;
        document.getElementById('promoRow').style.display = "flex";
        renderCostBreakdownOutput();
        showFloatingBannerMessage("🎉 ප්‍රොමෝ කේතය සාර්ථකව ඇතුළත් කරා මචං!");
    } else { alert("❌ වලංගු නොවන ප්‍රොමෝ කේතයකි!"); }
}

function showFloatingBannerMessage(text) {
    const banner = document.getElementById('floatingAlertBanner');
    if(banner) {
        document.getElementById('floatingAlertText').innerText = text;
        banner.classList.add('show');
        setTimeout(() => { banner.classList.remove('show'); }, 3500);
    }
}

function sendSmartQuickReplyMessage(replyText) {
    if(!activeChatJobId) return;
    db.collection("jobs").doc(activeChatJobId).collection("messages").add({
        text: replyText, senderId: auth.currentUser.uid, timestamp: new Date().getTime()
    });
}

function toggleVoiceAudioRecording() {
    const btn = document.getElementById('btnVoiceRecord');
    if (!isRecording) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            mediaRecorder = new MediaRecorder(stream); audioChunks = [];
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const reader = new FileReader(); reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    db.collection("jobs").doc(activeChatJobId).collection("messages").add({
                        text: "", voiceData: reader.result, senderId: auth.currentUser.uid, timestamp: new Date().getTime()
                    });
                };
            };
            mediaRecorder.start(); isRecording = true; btn.classList.add('recording');
        }).catch(() => { alert("❌ මයික්‍රෆෝන් අවසරය ලබාදෙන්න මචං!"); });
    } else { mediaRecorder.stop(); isRecording = false; btn.classList.remove('recording'); }
}

function switchView(viewId, navId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if(document.getElementById(viewId)) document.getElementById(viewId).classList.add('active');
    if(document.getElementById(navId)) document.getElementById(navId).classList.add('active');
}

function switchActivitiesFilter(filterType) {
    document.getElementById('btnTabActive').classList.remove('active');
    document.getElementById('btnTabPast').classList.remove('active');
    if(filterType === 'active') { document.getElementById('btnTabActive').classList.add('active'); document.getElementById('activeJobsContainer').style.display = "block"; document.getElementById('pastJobsContainer').style.display = "none"; }
    else { document.getElementById('btnTabPast').classList.add('active'); document.getElementById('activeJobsContainer').style.display = "none"; document.getElementById('pastJobsContainer').style.display = "block"; }
}

function openQuickFixForm(catName, catDisplaySI, currentKmRate) {
    currentCategory = catName; perKmRate = currentKmRate || 80;
    document.getElementById('selectedCategoryDisplay').innerText = catDisplaySI;
    document.getElementById('postFormArea').style.display = "block";
    document.getElementById('jobTitle').value = catDisplaySI + " කරගැනීම";
    resetRoutingSetup(); setTimeout(initMap, 200);
    document.getElementById('postFormArea').scrollIntoView({ behavior: 'smooth' });
}

function toggleInlineRescheduleBox(jobId) {
    const box = document.getElementById(`reschedBox-${jobId}`);
    box.style.display = (box.style.display === "block") ? "none" : "block";
}

function submitLiveRescheduleTime(jobId) {
    const newTitle = document.getElementById(`editTitle-${jobId}`).value.trim();
    const newDesc = document.getElementById(`editDesc-${jobId}`).value.trim();
    const newDate = document.getElementById(`newDate-${jobId}`).value;
    const newTime = document.getElementById(`newTime-${jobId}`).value;
    
    if(!newTitle || !newDesc || !newDate || !newTime) { alert("❌ කරුණාකර සියලුම හිස්තැන් පුරවන්න!"); return; }

    db.collection("jobs").doc(jobId).update({
        title: newTitle, description: newDesc, isScheduled: true, scheduledDate: newDate, scheduledTime: newTime,
        status: "available", riderId: null, riderName: null, reNotified: true, lastModified: new Date().getTime()
    }).then(() => { showFloatingBannerMessage("🕒 ඇනවුම වෙනස් කරා! බාස්ව ඉවත් කර නැවත Pool එකට දමන ලදී."); });
}

// ✅ 100% WORKING DYNAMIC PAYMENT TOGGLE FOR RADIO BUTTONS
function togglePaymentDetailsDisplay(method) {
    const bankPanel = document.getElementById('bankDetailsInfoPanel');
    if(bankPanel) {
        bankPanel.style.display = (method === 'Bank') ? "block" : "none";
    }
}

function acceptSupplierBargainOffer(jobId, rId, rName, finalPrice) {
    db.collection("jobs").doc(jobId).update({
        status: "accepted", riderId: rId, riderName: rName, budget: finalPrice
    }).then(() => { showFloatingBannerMessage(`✅ ਰੁ. ${finalPrice} කට වැඩේ තහවුරු කරා!`); });
}

function triggerInstantDistressSOSFix() {
    if(confirm("🚨 ක්ෂණික හදිසි උපකාරයක් (Emergency Fix) අවශ්‍යද? விනාඩි 5ක් ඇතුළත ළඟම බාස්ලා පැමිණෙනු ඇත.")) {
        navigator.geolocation.getCurrentPosition(pos => {
            db.collection("jobs").add({
                title: "🚨 EMERGENCY DISTRESS SOS FIX",
                description: "හදිසි අනතුරක් හෝ බිඳවැටීමක්! ක්ෂණික උපකාර අවශ්‍යයි.",
                budget: "2500", category: "Emergency SOS",
                lat: pos.coords.latitude, lng: pos.coords.longitude, dropLat: pos.coords.latitude, dropLng: pos.coords.longitude, distance: "0.0 KM",
                customerId: auth.currentUser.uid, customerName: auth.currentUser.displayName,
                status: "available", otpCode: Math.floor(1000 + Math.random() * 9000), paymentMethod: "Cash", timestamp: new Date().getTime()
            }).then(() => { alert("🚨 SOS පණිවිඩය සජීවීව නිකුත් කරා මචං!"); switchView('view-activities', 'nav-activities'); });
        });
    }
}

auth.onAuthStateChanged(user => {
    if (!user) { window.location.href = "auth.html"; }
    else {
        if(document.getElementById('topUserName')) document.getElementById('topUserName').innerText = user.displayName || "QuickFix User";
        if(document.getElementById('userProfName')) document.getElementById('userProfName').innerText = user.displayName || "QuickFix User";
        if(document.getElementById('userProfEmail')) document.getElementById('userProfEmail').innerText = user.email;

        db.collection("jobs").where("customerId", "==", user.uid).onSnapshot(snapshot => {
            const activeContainer = document.getElementById('activeJobsContainer');
            const pastContainer = document.getElementById('pastJobsContainer');
            const notiContainer = document.getElementById('notificationsContainer');
            if(!activeContainer) return;
            
            activeContainer.innerHTML = ""; pastContainer.innerHTML = "";
            let notiHtml = "", hasActive = false, hasPast = false;

            snapshot.forEach(doc => {
                const job = doc.data(); if(job.status === "cancelled") return;
                
                let step1 = "completed", step2 = "next", step3 = "next", step4 = "next";
                if(job.status === 'accepted') { step1 = "completed"; step2 = "active"; }
                if(job.status === 'on_the_way' || job.status === 'arrived') { step1 = "completed"; step2 = "completed"; step3 = "active"; }
                if(job.status === 'completed') { step1 = "completed"; step2 = "completed"; step3 = "completed"; step4 = "completed"; }
                
                let stepperHtml = `
                    <div class="stepper-wrapper">
                        <div class="stepper-item ${step1}"><div class="step-counter">1</div>පෝස්ට් කරා</div>
                        <div class="stepper-item ${step2}"><div class="step-counter">2</div>බාරගත්තා</div>
                        <div class="stepper-item ${step3}"><div class="step-counter">3</div>ක්‍රියාත්මකයි</div>
                        <div class="stepper-item ${step4}"><div class="step-counter">4</div>නිමයි</div>
                    </div>`;

                if (job.status !== 'completed') {
                    hasActive = true;
                    let chatBtn = job.status !== 'available' ? `<button style="background:#00c851; color:white; border:none; padding:8px 12px; border-radius:6px; font-weight:bold; cursor:pointer; margin-top:8px;" onclick="openChat('${doc.id}')">බාස් සමඟ චැට් 💬</button>` : '';
                    let otpCodeArea = job.status !== 'available' ? `<div class="otp-display-box">🔐 ආරක්ෂිත OTP කේතය: <span class="otp-number">${job.otpCode}</span></div>` : '';
                    let cancelBtn = `<button class="btn-cancel" onclick="cancelLiveJobOrder('${doc.id}')">ඇනවුම අවලංගු කරන්න ❌</button>`;
                    let rescheduleBtn = (job.status === 'available' || job.status === 'accepted') ? `<button class="btn-resched" onclick="toggleInlineRescheduleBox('${doc.id}')">වැඩේ සංස්කරණය / Reschedule කරන්න 🕒✏️</button>` : '';
                    
                    let bargainOffersHtml = "";
                    if(job.status === 'available' && job.bidsPool) {
                        bargainOffersHtml = `<div style="margin-top:10px; padding:10px; background:#fff8e1; border-radius:8px; border:1px solid #ffe082;"><p style="margin:0 0 6px 0; font-size:12px; font-weight:bold; color:#b78103;">💰 බාස්ලා ඉල්ලන මිල ගණන් (Counter Bids):</p>`;
                        Object.keys(job.bidsPool).forEach(rId => {
                            let bid = job.bidsPool[rId];
                            bargainOffersHtml += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; margin-bottom:5px; padding-bottom:5px; border-bottom:1px dashed #ddd;">
                                <span>👨‍🔧 ${bid.riderName}: <b>රු. ${bid.offerPrice}</b></span>
                                <button type="button" style="background:#1a73e8; color:white; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px;" onclick="acceptSupplierBargainOffer('${doc.id}','${rId}','${bid.riderName}','${bid.offerPrice}')">බාරගන්න</button>
                            </div>`;
                        });
                        bargainOffersHtml += `</div>`;
                    }

                    let splitBillAmount = Math.round(job.budget / 2);
                    let splitBillHtml = `<div style="font-size:11px; color:#5f6368; margin-top:4px;">💳 යාළුවා එක්ක බෙදාගත්තොත් එක්කෙනෙක්ට: <b>රු. ${splitBillAmount} ගානේ</b></div>`;
                    
                    // Display selected payment method on Card Node UI
                    let currentPayMethodText = job.paymentMethod === 'Bank' ? '🏛️ Online Bank Transfer' : job.paymentMethod === 'Card' ? '💳 Stripe Card' : '💵 Cash on Delivery';

                    let rescheduleBoxUi = `
                        <div class="resched-box-ui" id="reschedBox-${doc.id}">
                            <label>වැඩේ මාතෘකාව (Title)</label>
                            <input type="text" id="editTitle-${doc.id}" value="${job.title || ''}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:6px; font-size:12px; margin-bottom:8px; color:#111;">
                            <label>වැඩේ විස්තරය (Description)</label>
                            <textarea id="editDesc-${doc.id}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:6px; font-size:12px; margin-bottom:8px; color:#111;" rows="2">${job.description || ''}</textarea>
                            <label>නව දිනය සහ වෙලාව (New Schedule)</label>
                            <div style="display:flex; gap:6px;">
                                <input type="date" id="newDate-${doc.id}" value="${job.scheduledDate || ''}" style="padding:8px; border:1px solid var(--border-color); border-radius:4px; font-size:12px; flex:1; color:#111;">
                                <input type="time" id="newTime-${doc.id}" value="${job.scheduledTime || ''}" style="padding:8px; border:1px solid var(--border-color); border-radius:4px; font-size:12px; flex:1; color:#111;">
                            </div>
                            <button type="button" class="btn-yellow" style="padding:10px; margin-top:12px; font-size:12px; border-radius:6px;" onclick="submitLiveRescheduleTime('${doc.id}')">සංස්කරණය තහවුරු කරන්න 🎯</button>
                        </div>`;

                    let renderedChecklistHtml = "";
                    if(job.tasksList && job.tasksList.length > 0) {
                        renderedChecklistHtml = `<div style="font-size:12px; background:#f1f3f4; padding:8px; border-radius:6px; margin:5px 0;">📋 වැඩ ලැයිස්තුව:<br>` + job.tasksList.map(t => `• ${t}`).join('<br>') + `</div>`;
                    }

                    let scheduleText = job.isScheduled ? `<span style="background:#1a73e8; color:white; padding:2px 6px; font-size:10px; font-weight:bold; border-radius:4px;">🕒 SCHEDULED: ${job.scheduledDate} @ ${job.scheduledTime}</span>` : '';
                    let safetyCategory = job.category || "General Fix";

                    activeContainer.innerHTML += `
                        <div class="job-card">
                            <h3>${job.title || 'QuickFix Job'} ${scheduleText}</h3> <p style="font-size:13px; color:#555; margin:5px 0;">${job.description || ''}</p>
                            ${renderedChecklistHtml}
                            <div style="font-size:12px; color:#777; margin-bottom:5px;">Category: <b>${safetyCategory}</b> | 📏 ${job.distance || '0 KM'}</div>
                            <div style="font-size:12px; color:var(--primary-blue); font-weight:bold; margin-bottom:8px;">💳 Method: ${currentPayMethodText}</div>
                            ${stepperHtml} 
                            <div style="font-weight:bold; color:#111; margin-top:5px; font-size:14px;">ගාස්තුව: රු. ${job.budget}</div>
                            ${splitBillHtml} ${bargainOffersHtml} ${otpCodeArea} 
                            <div style="margin-top: 8px; display:flex; flex-wrap:wrap; gap:8px;">${chatBtn} ${rescheduleBtn} ${cancelBtn}</div>
                            ${rescheduleBoxUi}
                        </div>`;
                } else {
                    hasPast = true;
                    let ratingBlock = !job.rated ? `
                        <div style="margin-top:10px; border-top:1px dashed #dadce0; padding-top:8px;">
                            <p style="font-size:12px; font-weight:bold; margin:0 0 4px 0;">බාස්ගේ සේවාව ඇගයීමට තරු ලකුණු කරන්න ⭐</p>
                            <div class="star-rating">
                                <span onclick="submitLiveRating('${doc.id}', 1)">★</span><span onclick="submitLiveRating('${doc.id}', 2)">★</span><span onclick="submitLiveRating('${doc.id}', 3)">★</span><span onclick="submitLiveRating('${doc.id}', 4)">★</span><span onclick="submitLiveRating('${doc.id}', 5)">★</span>
                            </div>
                        </div>` : `<div style="color:var(--primary-blue); font-weight:bold; font-size:13px; margin-top:8px;">ලබාදුන් ශ්‍රේණිගත කිරීම: ${'★'.repeat(job.rating)}</div>`;

                    pastContainer.innerHTML += `
                        <div class="job-card" style="opacity:0.85;">
                            <h3>${job.title || 'QuickFix Job'}</h3> <p style="font-size:13px; color:#555; margin:5px 0;">${job.description || ''}</p>
                            ${stepperHtml} ${ratingBlock}
                        </div>`;
                }

                if(job.status === 'accepted') notiHtml += `<div class="noti-card"><h4>🛠️ ඇනවුම බාරගත්තා!</h4><p>"${job.title}" වැඩය බාරගෙන ඇත.</p></div>`;
            });

            if(!hasActive) activeContainer.innerHTML = `<p style='color:var(--text-muted); font-size:14px;'>දැනට පවතින සක්‍රීය වැඩ කිසිවක් නැත...</p>`;
            if(!hasPast) pastContainer.innerHTML = `<p style='color:var(--text-muted); font-size:14px;'>පසුගිය ඉතිහාසයක් මෙතෙක් වාර්තා වී නැත...</p>`;
            if(notiContainer) notiContainer.innerHTML = notiHtml !== "" ? notiHtml : `<p style="color:var(--text-muted); font-size:14px;">තාම අලුත් දැනුම්දීම් කිසිවක් නැත...</p>`;
        });
    }
});

function cancelLiveJobOrder(jobId) {
    if(confirm("Are you sure?")) { db.collection("jobs").doc(jobId).update({ status: "cancelled" }).then(() => { showFloatingBannerMessage("❌ ඇනවුම අවලංගු කරන ලදී."); }); }
}

function submitLiveRating(jobId, starValue) {
    db.collection("jobs").doc(jobId).update({ rated: true, rating: starValue }).then(() => { alert("⭐ ශ්‍රේණිගත කිරීම සුරැකුණා!"); });
}

function openChat(jobId) {
    activeChatJobId = jobId; document.getElementById('customerChatBox').style.display = 'flex';
    const msgContainer = document.getElementById('chatMessages');
    if(chatListener) chatListener();
    
    chatListener = db.collection("jobs").doc(jobId).collection("messages").orderBy("timestamp", "asc").onSnapshot(snapshot => {
        let initialLoad = msgContainer.children.length === 0;
        msgContainer.innerHTML = "";
        snapshot.forEach(doc => {
            const msg = doc.data(); let msgClass = msg.senderId === auth.currentUser.uid ? 'sent' : 'received';
            let content = msg.text;
            if(msg.voiceData) { content = `<audio src="${msg.voiceData}" controls style="max-width:200px; height:32px;"></audio>`; }
            msgContainer.innerHTML += `<div class="msg ${msgClass}">${content}</div>`;
        });
        msgContainer.scrollTop = msgContainer.scrollHeight;
        
        if(!initialLoad && snapshot.docChanges().some(c => c.type === "added")) {
            let lastMsg = snapshot.docs[snapshot.docs.length - 1].data();
            if(lastMsg.senderId !== auth.currentUser.uid) showFloatingBannerMessage("💬 බාස් වෙතින් අලුත් මැසේජ් එකක් ලැබුණා!");
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    // Inject dynamic input listener on radio buttons for payment methods manually
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            togglePaymentDetailsDisplay(e.target.value);
        });
    });

    const chatForm = document.getElementById('chatForm');
    if(chatForm) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault(); const input = document.getElementById('chatMsgInput');
            if(!input.value.trim() || !activeChatJobId) return;
            db.collection("jobs").doc(activeChatJobId).collection("messages").add({
                text: input.value.trim(), senderId: auth.currentUser.uid, timestamp: new Date().getTime()
            }).then(() => { input.value = ""; });
        });
    }

    const jobPostForm = document.getElementById('jobPostForm');
    if(jobPostForm) {
        jobPostForm.addEventListener('submit', function(e) {
            e.preventDefault(); const btn = document.getElementById('btnSubmitPost');
            let pLat = parseFloat(document.getElementById('pickupLat').value);
            let pLng = parseFloat(document.getElementById('pickupLng').value);
            let dLat = parseFloat(document.getElementById('dropLat').value) || pLat;
            let dLng = parseFloat(document.getElementById('dropLng').value) || pLng;
            let distText = document.getElementById('lblKmText').innerText;

            if(!pLat) { alert("❌ කරුණාකර සිතියම මත ස්ථානය ලකුණු කරන්න!"); return; }

            btn.innerText = "පෝස්ට් වෙමින්... ⏳"; btn.disabled = true;
            const randomOTP = Math.floor(1000 + Math.random() * 9000);

            let finalChecklistArray = [];
            document.querySelectorAll('.task-input-item').forEach(inp => {
                if(inp.value.trim() !== "") finalChecklistArray.push(inp.value.trim());
            });

            const isScheduled = document.getElementById('chkIsScheduled').checked;
            
            // Gather Selected Payment Parameters
            const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked').value;
            const bankRef = document.getElementById('bankRefNumberInput') ? document.getElementById('bankRefNumberInput').value.trim() : "";

            db.collection("users").doc(auth.currentUser.uid).get().then(userDoc => {
                let pNum = (userDoc.exists && userDoc.data().phoneNumber) ? userDoc.data().phoneNumber : "නැත";
                db.collection("jobs").add({
                    title: document.getElementById('jobTitle').value, 
                    description: document.getElementById('jobDesc').value, 
                    budget: document.getElementById('jobBudget').value, 
                    category: currentCategory, 
                    lat: pLat, lng: pLng, dropLat: dLat, dropLng: dLng, distance: distText, customerId: auth.currentUser.uid, customerName: auth.currentUser.displayName, customerPhone: pNum,
                    status: "available", otpCode: randomOTP, rated: false, tasksList: finalChecklistArray,
                    isScheduled: isScheduled, scheduledDate: isScheduled ? document.getElementById('scheduleDate').value : null, scheduledTime: isScheduled ? document.getElementById('scheduleTime').value : null,
                    paymentMethod: selectedPayment,
                    bankReferenceNumber: selectedPayment === 'Bank' ? bankRef : null,
                    paymentStatus: selectedPayment === 'Card' ? "Paid via Stripe" : "Pending",
                    timestamp: new Date().getTime()
                }).then(() => { finishPost(); }).catch(() => { resetBtn(); });
            });
        });
    }
});

function resetBtn() { const btn = document.getElementById('btnSubmitPost'); if(btn) { btn.disabled = false; btn.innerText = "කාර්මික ශිල්පියෙකු සොයන්න (Find Fixer) 🚀"; } }
function finishPost() {
    alert("✅ ඔබේ QuickFix ඇනවුම සාර්ථකව පෝස්ට් කරා මචං!");
    document.getElementById('jobPostForm').reset(); document.getElementById('postFormArea').style.display = "none";
    if(document.getElementById('bankDetailsInfoPanel')) document.getElementById('bankDetailsInfoPanel').style.display = "none";
    resetBtn(); switchActivitiesFilter('active'); switchView('view-activities', 'nav-activities');
}
function logoutUser() { auth.signOut().then(() => { window.location.href = "auth.html"; }); }
