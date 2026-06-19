<!DOCTYPE html>
<html lang="si">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QuickFix - Ultimate Customer App</title>
    
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
    <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>

    <style>
        :root {
            --primary-blue: #1a73e8; --hover-blue: #1557b0; --bg-main: #f8f9fa; --panel-bg: #ffffff; 
            --text-main: #202124; --text-muted: #5f6368; --border-color: #dadce0; --success: #00c851;
        }
        body { font-family: 'Segoe UI', -apple-system, sans-serif; background-color: var(--bg-main); color: var(--text-main); margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        
        /* 🔔 FLOATING REAL-TIME ALERT BANNER */
        .floating-alert { position: fixed; top: -100px; left: 50%; transform: translateX(-50%); background: #202124; color: white; padding: 14px 24px; border-radius: 30px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 10px; z-index: 10000; font-weight: 600; font-size: 13px; transition: top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .floating-alert.show { top: 20px; }
        .floating-alert .alert-dot { width: 8px; height: 8px; background: #ffcc00; border-radius: 50%; animation: pulse 1.5s infinite; }

        /* 👑 PREMIUM HEADER & SAVED PLACES */
        .top-header { background: var(--primary-blue); padding: 20px; border-bottom-left-radius: 24px; border-bottom-right-radius: 24px; box-shadow: 0 4px 12px rgba(26, 115, 232, 0.15); }
        .header-user { display: flex; justify-content: space-between; align-items: center; }
        .user-info h3 { margin: 0; font-size: 19px; font-weight: 700; color: white; }
        .user-info p { margin: 2px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.8); }
        .header-avatar { width: 45px; height: 45px; border-radius: 50%; border: 2px solid white; object-fit: cover; background: white; }
        
        .search-container { background: white; border-radius: 12px; padding: 10px 15px; margin-top: 15px; display: flex; align-items: center; border: 1px solid var(--border-color); }
        .search-container input { border: none; outline: none; width: 100%; font-size: 14px; margin-left: 10px; }
        .search-btn { background: var(--primary-blue); color: white; border: none; padding: 7px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px; }
        
        .saved-places-bar { display: flex; gap: 8px; margin-top: 12px; justify-content: flex-start; overflow-x: auto; padding-bottom: 2px; }
        .saved-places-bar::-webkit-scrollbar { display: none; }
        .saved-place-chip { background: rgba(255, 255, 255, 0.2); color: white; border: none; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; white-space: nowrap; }

        .app-body { flex-grow: 1; padding: 20px; overflow-y: auto; padding-bottom: 90px; }
        .view-section { display: none; }
        .view-section.active { display: block; }

        .category-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px; }
        .category-card { background: var(--panel-bg); border-radius: 16px; padding: 18px 10px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); cursor: pointer; border: 1px solid var(--border-color); transition: 0.2s; }
        .category-card:hover { transform: translateY(-2px); border-color: var(--primary-blue); box-shadow: 0 6px 15px rgba(26, 115, 232, 0.1); }
        .category-icon { font-size: 28px; }
        .category-name { font-size: 14px; font-weight: bold; display: block; }
        .category-desc { font-size: 11px; color: var(--text-muted); }

        .form-card { background: white; padding: 25px 20px; border-radius: 16px; border: 1px solid var(--border-color); }
        .form-group { margin-bottom: 18px; text-align: left; }
        .form-group label { display: block; font-weight: bold; margin-bottom: 6px; font-size: 13px; color: var(--text-main); }
        .form-group input, .form-group textarea { width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; box-sizing: border-box; outline: none; background: #fff; font-family: inherit; }
        
        .checklist-item { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .checklist-item input[type="text"] { flex-grow: 1; padding: 8px; font-size: 13px; }
        .btn-add-task { background: none; border: 1px dashed var(--primary-blue); color: var(--primary-blue); padding: 8px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; width: 100%; margin-top: 5px; }

        .schedule-toggle-bar { display: flex; align-items: center; justify-content: space-between; background: #f1f3f4; padding: 10px 14px; border-radius: 8px; margin-bottom: 15px; font-size: 13px; font-weight: bold; }
        .schedule-inputs { display: flex; gap: 10px; margin-top: 10px; }
        .schedule-inputs input { padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 12px; flex: 1; }

        #map { width: 100%; height: 260px; border-radius: 12px; margin-top: 5px; border: 1px solid var(--border-color); z-index: 1; }
        .map-instruction { font-size: 12px; color: var(--primary-blue); font-weight: bold; margin: 5px 0; text-align: left; }
        
        .pricing-panel { background: #f8f9fa; border: 1px solid var(--border-color); padding: 16px; border-radius: 12px; margin-bottom: 15px; display: none; text-align: left; }
        .breakdown-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
        .breakdown-row.total { font-size: 15px; font-weight: bold; color: #1967d2; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px; }
        
        .promo-group { display: flex; gap: 8px; margin-top: 12px; }
        .promo-input { flex-grow: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; outline: none; font-size: 12px; }
        .promo-btn { background: #202124; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; }

        .btn-yellow { background: var(--primary-blue); color: white; padding: 14px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; font-size: 15px; }
        .btn-cancel { background: #ff4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 8px; font-size: 12px; }
        
        /* 🕒 RESCHEDULE LIVE INTERFACE CARD */
        .btn-resched { background: #fff; color: var(--primary-blue); border: 1px solid var(--primary-blue); padding: 8px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 8px; font-size: 12px; }
        .resched-box-ui { background: #f1f3f4; padding: 10px; border-radius: 8px; margin-top: 10px; border: 1px solid var(--border-color); display: none; }

        .job-card { background: white; border: 1px solid var(--border-color); padding: 18px; border-radius: 12px; margin-bottom: 12px; position: relative; text-align: left; }
        .job-card h3 { margin: 0 0 5px 0; font-size: 16px; }

        .stepper-wrapper { display: flex; justify-content: space-between; margin: 15px 0 10px 0; padding: 0; position: relative; }
        .stepper-item { position: relative; display: flex; flex-direction: column; align-items: center; flex: 1; font-size: 10px; font-weight: bold; color: #aaa; text-align: center; }
        .stepper-item::before { position: absolute; content: ""; border-bottom: 2px solid #ccc; width: 100%; top: 8px; left: -50%; z-index: 1; }
        .stepper-item:first-child::before { content: none; }
        .step-counter { position: relative; z-index: 5; display: flex; justify-content: center; align-items: center; width: 18px; height: 18px; border-radius: 50%; background: #ccc; margin-bottom: 4px; }
        .stepper-item.completed { color: var(--success); }
        .stepper-item.completed .step-counter { background-color: var(--success); color: white; }
        .stepper-item.active { color: var(--primary-blue); }
        .stepper-item.active .step-counter { background-color: var(--primary-blue); color: white; }

        .otp-display-box { background: #e8f0fe; border: 1px solid #b4d2ff; padding: 10px 14px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; font-weight: bold; font-size: 13px; color: var(--primary-blue); margin-top: 10px; }
        .otp-number { background: var(--primary-blue); padding: 2px 8px; border-radius: 4px; font-size: 14px; color: white; }

        .filter-tab-bar { display: flex; gap: 10px; margin-bottom: 15px; }
        .filter-btn { flex: 1; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; background: #e8eaed; color: var(--text-muted); }
        .filter-btn.active { background: var(--primary-blue); color: white; border-color: var(--primary-blue); }

        .star-rating span { font-size: 24px; cursor: pointer; color: #ccc; }
        .star-rating span.active { color: #fbbc05; }
        .noti-card { background: white; padding: 15px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid var(--primary-blue); text-align: left; }
        
        .chat-container { background: white; border: 1px solid var(--border-color); border-radius: 12px; margin-top: 15px; display: none; flex-direction: column; height: 360px; overflow: hidden; }
        .chat-header { background: var(--text-main); color: white; padding: 12px; font-weight: bold; display: flex; justify-content: space-between; }
        .chat-messages { flex-grow: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
        .msg { padding: 8px 12px; border-radius: 12px; max-width: 75%; font-size: 13px; }
        .msg.sent { background: var(--primary-blue); color: white; align-self: flex-end; }
        .msg.received { background: #f1f3f4; color: var(--text-dark); align-self: flex-start; }
        
        .chat-quick-replies { display: flex; gap: 6px; padding: 8px; background: #f8f9fa; border-top: 1px solid var(--border-color); overflow-x: auto; }
        .quick-reply-chip { background: white; border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 16px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; color: var(--text-main); }
        
        .chat-input-area { display: flex; border-top: 1px solid var(--border-color); align-items: center; background: #fff; }
        .chat-input-area input { flex-grow: 1; border: none; padding: 14px; outline: none; font-size: 14px; }
        .chat-input-area button { background: var(--primary-blue); color: white; border: none; padding: 14px 20px; font-weight: bold; cursor: pointer; }
        .voice-btn { background: none; border: none; font-size: 18px; cursor: pointer; padding: 0 10px; color: #5f6368; }
        .voice-btn.recording { color: #ff4444; animation: pulse 1s infinite; }

        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; height: 65px; background: white; border-top: 1px solid var(--border-color); display: flex; justify-content: space-around; align-items: center; z-index: 999; }
        .nav-item { text-align: center; color: var(--text-muted); cursor: pointer; font-weight: bold; font-size: 11px; width: 25%; }
        .nav-item span { display: block; font-size: 22px; margin-bottom: 2px; color: var(--text-muted); }
        .nav-item.active { color: var(--primary-blue); }
        .nav-item.active span { color: var(--primary-blue); }
        
        .live-dot { background: #1a73e8; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 6px rgba(26, 115, 232, 0.3); }

        @keyframes pulse { 0% { transform: scale(0.9); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.5; } 100% { transform: scale(0.9); opacity: 1; } }
    </style>
</head>
<body>

    <div id="floatingAlertBanner" class="floating-alert">
        <div class="alert-dot"></div>
        <span id="floatingAlertText">නව පණිවිඩයක් ලැබුණා!</span>
    </div>

    <div class="top-header">
        <div class="header-user">
            <div class="user-info">
                <p id="lblGreeting">Good Evening!</p>
                <h3 id="topUserName">Loading...</h3>
            </div>
            <img id="topUserAvatar" class="header-avatar" src="https://www.w3schools.com/howto/img_avatar.png" alt="User Avatar">
        </div>
        
        <div class="search-container">
            <span>🔍</span>
            <input type="text" id="globalAddressSearchInput" placeholder="යායුතු නගරය මෙතන ගසා සර්ච් කරන්න...">
            <button class="search-btn" onclick="searchGlobalAddressRoute()">Search</button>
        </div>

        <div class="saved-places-bar">
            <button class="saved-place-chip" onclick="triggerSavedPlaceSearch('Sri Palee Campus, Horana')">🎓 Sri Palee Campus</button>
            <button class="saved-place-chip" onclick="triggerSavedPlaceSearch('Beruwala Harbor')">⚓ Beruwala</button>
            <button class="saved-place-chip" onclick="triggerSavedPlaceSearch('Colombo Fort')">🏢 Colombo Fort</button>
        </div>
    </div>

    <div class="app-body">
        
        <div id="view-home" class="view-section active">
            <h4 style="margin: 10px 0 15px 0; color: #555; font-size: 14px;">🛠️ සේවාවන් තෝරන්න (Select Service)</h4>
            
            <div class="category-grid">
                <div class="category-card" onclick="openQuickFixForm('Electrical', 'ලයිට් වැඩ / විදුලි කාර්මික ශිල්පී', 80)">
                    <span class="category-icon">⚡</span>
                    <div class="category-name-wrapper"><span class="category-name">Electrical</span><span class="category-desc">ලයිට්, වයිරින්, AC</span></div>
                </div>
                <div class="category-card" onclick="openQuickFixForm('Mechanical', 'යාන්ත්‍රික වැඩ / Mechanical බාස්', 90)">
                    <span class="category-icon">👨‍🔧</span>
                    <div class="category-name-wrapper"><span class="category-name">Mechanical</span><span class="category-desc">වාහන, බයික් රෙපෙයාර්</span></div>
                </div>
                <div class="category-card" onclick="openQuickFixForm('Plumbing', 'නල වැඩ / ප්ලම්බර් බාස්', 75)">
                    <span class="category-icon">🚰</span>
                    <div class="category-name-wrapper"><span class="category-name">Plumbing</span><span class="category-desc">බට ලීක්, ටැංකි, පයිප්ප</span></div>
                </div>
                <div class="category-card" onclick="openQuickFixForm('Electronics', 'ඉලෙක්ට්‍රොනික උපකරණ රෙපෙයාර්', 70)">
                    <span class="category-icon">📺</span>
                    <div class="category-name-wrapper"><span class="category-name">Electronics</span><span class="category-desc">TV, ෆ්‍රිජ්, පෑන්, ෆෝන්</span></div>
                </div>
                <div class="category-card" onclick="openQuickFixForm('Carpentry', 'වඩු වැඩ / වඩු බාස්', 85)">
                    <span class="category-icon">🪚</span>
                    <div class="category-name-wrapper"><span class="category-name">Carpentry</span><span class="category-desc">දොරවල්, අල්මාරි, ගෘහභාණ්ඩ</span></div>
                </div>
                <div class="category-card" onclick="openQuickFixForm('Masonry & Painting', 'පින්තාරු සහ පෙදරේරු වැඩ', 80)">
                    <span class="category-icon">🎨</span>
                    <div class="category-name-wrapper"><span class="category-name">Painting</span><span class="category-desc">තීන්ත, මේසන්, ටයිල්</span></div>
                </div>
                <div class="category-card" onclick="openQuickFixForm('Transport', 'ප්‍රවාහන / Delivery / රයිඩ්', 120)">
                    <span class="category-icon">🚚</span>
                    <div class="category-name-wrapper"><span class="category-name">Transport</span><span class="category-desc">ත්‍රිවීල්, බයික්, ට්‍රක්</span></div>
                </div>
                <div class="category-card" onclick="openQuickFixForm('Other Fixes', 'වෙනත් ඕනෑම Fix වැඩක්', 60)">
                    <span class="category-icon">🛠️</span>
                    <div class="category-name-wrapper"><span class="category-name">Other Fixes</span><span class="category-desc">වත්ත සුදුවැඩ, පිරිසිදු කිරීම්</span></div>
                </div>
            </div>

            <div id="postFormArea" style="display: none; margin-top: 25px;">
                <h4 style="margin: 0 0 10px 0; color: #111;">🎯 අලුත් <span id="selectedCategoryDisplay" style="color: var(--primary-blue);">...</span> වැඩක් දාන්න</h4>
                <div class="form-card">
                    <form id="jobPostForm">
                        <div class="form-group">
                            <label>වැඩේ කෙටි හැඳින්වීම (Title)</label>
                            <input type="text" id="jobTitle" required>
                        </div>
                        
                        <div class="schedule-toggle-bar">
                            <span>🕒 පසුවට ඇනවුම් කරන්න (Schedule booking?)</span>
                            <input type="checkbox" id="chkIsScheduled" onchange="toggleSchedulerInputsDisplay(this.checked)">
                        </div>
                        <div id="schedulerInputsRow" class="schedule-inputs hidden">
                            <input type="date" id="scheduleDate">
                            <input type="time" id="scheduleTime">
                        </div>

                        <div class="form-group">
                            <label>වැඩේ සහ ලෙඩේ විස්තරය (Describe the issue)</label>
                            <textarea id="jobDesc" rows="3" placeholder="කරගන්න ඕන වැඩේ ගැන විස්තරයක් ලියන්න..." required></textarea>
                        </div>
                        
                        <div class="form-group" style="border-top:1px dashed #ccc; padding-top:12px;">
                            <label>🛠️ කරන්න ඕන වැඩ ලැයිස්තුව (Multi-item Checklist)</label>
                            <div id="checklistTasksContainer">
                                <div class="checklist-item"><input type="text" class="task-input-item" placeholder="උදා: සාලේ ලයිට් එක මාරු කිරීම"></div>
                            </div>
                            <button type="button" class="btn-add-task" onclick="addNewChecklistItemRow()">[+] තව වැඩක් එකතු කරන්න</button>
                        </div>
                        
                        <div class="form-group">
                            <label>ස්ථාන ලකුණු කරන්න (Set Pickup & Destination) 📍</label>
                            <div class="map-instruction" id="mapHint">සිතියම මත ක්ලික් කර ඔබ ඉන්න තැන (🟢 Pickup) ලකුණු කරන්න.</div>
                            <div id="map"></div>
                            <input type="hidden" id="pickupLat"><input type="hidden" id="pickupLng">
                            <input type="hidden" id="dropLat"><input type="hidden" id="dropLng">
                        </div>

                        <div class="pricing-panel" id="priceDisplayPanel">
                            <div class="breakdown-row"><span>Base Fare (ආරම්භක පිරිවැය):</span> <span>රු. 200.00</span></div>
                            <div class="breakdown-row"><span>Distance Fare (📏 <span id="lblKmText">0.0 KM</span>):</span> <span id="lblDistanceFare">රු. 0.00</span></div>
                            <div class="breakdown-row" id="promoRow" style="display:none; color:var(--success);"><span>Promo Discount (වට්ටම 🎁):</span> <span>- රු. 250.00</span></div>
                            <div class="breakdown-row total"><span>Total Payable (ඇස්තමේන්තුගත මුදල):</span> <span id="txtCalculatedPrice">රු. 0.00</span></div>
                            
                            <div class="promo-group">
                                <input type="text" id="promoInputCode" class="promo-input" placeholder="Promo Code (QFIX2026)">
                                <button type="button" class="promo-btn" onclick="applyPromoDiscountCode()">Apply</button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>ඔබ දෙන උපරිම ගාස්තුව (Budget - LKR)</label>
                            <input type="number" id="jobBudget" placeholder="රු. 1500" required>
                        </div>
                        <button type="submit" id="btnSubmitPost" class="btn-yellow">කාර්මික ශිල්පියෙකු සොයන්න (Find Fixer) 🚀</button>
                    </form>
                </div>
            </div>
        </div>

        <div id="view-activities" class="view-section">
            <div class="filter-tab-bar">
                <button id="btnTabActive" class="filter-btn active" onclick="switchActivitiesFilter('active')">පවතින වැඩ (Active)</button>
                <button id="btnTabPast" class="filter-btn" onclick="switchActivitiesFilter('past')">පසුගිය ඉතිහාසය (History)</button>
            </div>
            
            <div id="activeJobsContainer"></div>
            <div id="pastJobsContainer" style="display: none;"></div>

            <div id="customerChatBox" class="chat-container">
                <div class="chat-header">💬 බාස් සමඟ සජීවී චැට් එක <span style="cursor:pointer;" onclick="document.getElementById('customerChatBox').style.display='none'">✖</span></div>
                <div id="chatMessages" class="chat-messages"></div>
                
                <div class="chat-quick-replies">
                    <div class="quick-reply-chip" onclick="sendSmartQuickReplyMessage('මම ලොකේෂන් එකේ ඉන්නවා 👍')">මම ලොකේෂන් එකේ ඉන්නවා 👍</div>
                    <div class="quick-reply-chip" onclick="sendSmartQuickReplyMessage('වැඩේට ඔක්කොම කීයක් වෙයිද? 💰')">වැඩේට කීයක් වෙයිද? 💰</div>
                    <div class="quick-reply-chip" onclick="sendSmartQuickReplyMessage('හරි මචං, මම බලාගෙන ඉන්නවා ⏳')">මම බලාගෙන ඉන්නවා ⏳</div>
                </div>

                <form id="chatForm" class="chat-input-area">
                    <button type="button" id="btnVoiceRecord" class="voice-btn" onclick="toggleVoiceAudioRecording()">🎤</button>
                    <input type="text" id="chatMsgInput" placeholder="මැසේජ් එකක් ලියන්න..." required autocomplete="off">
                    <button type="submit">යවන්න</button>
                </form>
            </div>
        </div>

        <div id="view-notifications" class="view-section">
            <h2 style="font-size: 20px; margin-bottom: 15px; text-align: left;">දැනුම්දීම් (Notifications)</h2>
            <div id="notificationsContainer"><p style="color:var(--text-muted); font-size:14px; text-align:left;">තාම අලුත් Notifications කිසිවක් නැත...</p></div>
        </div>

        <div id="view-account" class="view-section">
            <h2 style="font-size: 20px; text-align: left;">මගේ ගිණුම (Account)</h2>
            <div class="form-card" style="text-align: center;">
                <img id="userProfAvatar" style="width:100px; height:100px; border-radius:50%; border:3px solid var(--primary-blue); object-fit: cover;" src="https://www.w3schools.com/howto/img_avatar.png" alt="Avatar">
                <h3 id="userProfName" style="margin:10px 0 2px 0;">...</h3>
                <p id="userProfEmail" style="color:var(--text-muted); margin:0 0 15px 0;">...</p>
                <button class="btn-yellow" style="background:#ff4444; color:white;" onclick="logoutUser()">Log Out (ගිණුමෙන් ඉවත් වන්න)</button>
            </div>
        </div>

    </div>

    <div class="bottom-nav">
        <div id="nav-home" class="nav-item active" onclick="switchView('view-home', 'nav-home')"><span>🏠</span>Home</div>
        <div id="nav-activities" class="nav-item" onclick="switchView('view-activities', 'nav-activities')"><span>📋</span>Activities</div>
        <div id="nav-notifications" class="nav-item" onclick="switchView('view-notifications', 'nav-notifications')"><span>🔔</span>Notification</div>
        <div id="nav-account" class="nav-item" onclick="switchView('view-account', 'nav-account')"><span>👤</span>Account</div>
    </div>

    <script>
        const part1 = "AIzaSyD29G6zoTAbg1YybqIWdKzCq"; const part2 = "_v--pAOOfI";
        const firebaseConfig = { apiKey: part1 + part2, authDomain: "quickfix-new.firebaseapp.com", projectId: "quickfix-new" };
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth(), db = firebase.firestore();

        let map, routingControl, pickupMarker, dropMarker, liveLocationMarker;
        let activeChatJobId = null, chatListener = null, currentCategory = "General", perKmRate = 80, originalPrice = 0, isPromoApplied = false;
        let mediaRecorder, audioChunks = [], isRecording = false;

        const hrs = new Date().getHours();
        document.getElementById('lblGreeting').innerText = hrs < 12 ? "Good Morning!☀️" : hrs < 17 ? "Good Afternoon!🌤️" : "Good Evening!🌙";

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
                    } else {
                        liveLocationMarker.setLatLng([lat, lng]);
                    }
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
            const item = document.createElement('div');
            item.className = "checklist-item";
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
            if(document.getElementById('postFormArea').style.display === "none") openQuickFixForm('General', 'QuickFix සේවාව', 80);

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
            document.getElementById('mapHint').innerText = "පියවර 2: යායුතු ස්ථානය (Destination) සිතියම මත ක්ලික් කරන්න හෝ උඩින් සර්ච් කරන්න.";
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
            document.getElementById('floatingAlertText').innerText = text;
            banner.classList.add('show');
            setTimeout(() => { banner.classList.remove('show'); }, 3500);
        }

        function sendSmartQuickReplyMessage(replyText) {
            if(!activeChatJobId) return;
            db.collection("jobs").doc(activeChatJobId).collection("messages").add({
                text: replyText, senderId: auth.currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp()
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
                                text: "", voiceData: reader.result, senderId: auth.currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp()
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
            document.getElementById(viewId).classList.add('active');
            document.getElementById(navId).classList.add('active');
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

        // 🕒 LIVE RESCHEDULE ACTION CONTROLLER
        function toggleInlineRescheduleBox(jobId) {
            const box = document.getElementById(`reschedBox-${jobId}`);
            if(box.style.display === "block") { box.style.display = "none"; }
            else { box.style.display = "block"; }
        }

        function submitLiveRescheduleTime(jobId) {
            const newDate = document.getElementById(`newDate-${jobId}`).value;
            const newTime = document.getElementById(`newTime-${jobId}`).value;
            
            if(!newDate || !newTime) { alert("❌ කරුණාකර වලංගු දිනයක් සහ වෙලාවක් තෝරන්න!"); return; }

            db.collection("jobs").doc(jobId).update({
                isScheduled: true,
                scheduledDate: newDate,
                scheduledTime: newTime
            }).then(() => {
                showFloatingBannerMessage("🕒 ඇනවුම සාර්ථකව Reschedule කරන ලදී!");
            });
        }

        auth.onAuthStateChanged(user => {
            if (!user) { window.location.href = "auth.html"; }
            else {
                document.getElementById('topUserName').innerText = user.displayName || "QuickFix User";
                document.getElementById('userProfName').innerText = user.displayName || "QuickFix User";
                document.getElementById('userProfEmail').innerText = user.email;

                db.collection("jobs").where("customerId", "==", user.uid).onSnapshot(snapshot => {
                    const activeContainer = document.getElementById('activeJobsContainer');
                    const pastContainer = document.getElementById('pastJobsContainer');
                    const notiContainer = document.getElementById('notificationsContainer');
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
                            
                            // 🕒 REAL-TIME IN-LINE RESCHEDULE INJECTION BUTTON
                            let rescheduleBtn = job.status === 'available' ? `<button class="btn-resched" onclick="toggleInlineRescheduleBox('${doc.id}')">දිනය/වෙලාව වෙනස් කරන්න (Reschedule) 🕒</button>` : '';
                            
                            let rescheduleBoxUi = `
                                <div class="resched-box-ui" id="reschedBox-${doc.id}">
                                    <p style="margin:0 0 6px 0; font-size:11px; font-weight:bold; color:var(--primary-blue);">අලුත් දිනය සහ වෙලාව තෝරන්න:</p>
                                    <div style="display:flex; gap:6px;">
                                        <input type="date" id="newDate-${doc.id}" style="padding:6px; border:1px solid var(--border-color); border-radius:4px; font-size:11px; flex:1;">
                                        <input type="time" id="newTime-${doc.id}" style="padding:6px; border:1px solid var(--border-color); border-radius:4px; font-size:11px; flex:1;">
                                    </div>
                                    <button class="btn-yellow" style="padding:8px; margin-top:8px; font-size:11px; border-radius:4px;" onclick="submitLiveRescheduleTime('${doc.id}')">Schedule එක අප්ඩේට් කරන්න 🎯</button>
                                </div>`;

                            let renderedChecklistHtml = "";
                            if(job.tasksList && job.tasksList.length > 0) {
                                renderedChecklistHtml = `<div style="font-size:12px; background:#f1f3f4; padding:8px; border-radius:6px; margin:5px 0;">📋 වැඩ ලැයිස්තුව:<br>` + job.tasksList.map(t => `• ${t}`).join('<br>') + `</div>`;
                            }

                            let scheduleText = job.isScheduled ? `<span style="background:#1a73e8; color:white; padding:2px 6px; font-size:10px; font-weight:bold; border-radius:4px;">🕒 SCHEDULED: ${job.scheduledDate} @ ${job.scheduledTime}</span>` : '';

                            activeContainer.innerHTML += `
                                <div class="job-card">
                                    <h3>${job.title} ${scheduleText}</h3> <p style="font-size:13px; color:#555; margin:5px 0;">${job.description}</p>
                                    ${renderedChecklistHtml}
                                    <div style="font-size:12px; color:#777; margin-bottom:5px;">Category: <b>${job.category}</b> | 📏 ${job.distance || '0 KM'}</div>
                                    ${stepperHtml} <div style="font-weight:bold; color:#111; margin-top:5px; font-size:14px;">ගාස්තුව: ਰු. ${job.budget}</div>
                                    ${otpCodeArea} 
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
                                    <h3>${job.title}</h3> <p style="font-size:13px; color:#555; margin:5px 0;">${job.description}</p>
                                    ${stepperHtml} ${ratingBlock}
                                </div>`;
                        }

                        if(job.status === 'accepted') notiHtml += `<div class="noti-card"><h4>🛠️ ඇනවුම බාරගත්තා!</h4><p>"${job.title}" වැඩය බාරගෙන ඇත.</p></div>`;
                    });

                    if(!hasActive) activeContainer.innerHTML = `<p style='color:var(--text-muted); font-size:14px;'>දැනට පවතින සක්‍රීය වැඩ කිසිවක් නැත...</p>`;
                    if(!hasPast) pastContainer.innerHTML = `<p style='color:var(--text-muted); font-size:14px;'>පසුගිය ඉතිහාසයක් මෙතෙක් වාර්තා වී නැත...</p>`;
                    notiContainer.innerHTML = notiHtml !== "" ? notiHtml : `<p style="color:var(--text-muted); font-size:14px;">තාම අලුත් දැනුම්දීම් කිසිවක් නැත...</p>`;
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

        document.getElementById('chatForm').addEventListener('submit', function(e) {
            e.preventDefault(); const input = document.getElementById('chatMsgInput');
            if(!input.value.trim() || !activeChatJobId) return;
            db.collection("jobs").doc(activeChatJobId).collection("messages").add({
                text: input.value.trim(), senderId: auth.currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => { input.value = ""; });
        });

        document.getElementById('jobPostForm').addEventListener('submit', function(e) {
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

            db.collection("users").doc(auth.currentUser.uid).get().then(userDoc => {
                let pNum = (userDoc.exists && userDoc.data().phoneNumber) ? userDoc.data().phoneNumber : "නැත";
                db.collection("jobs").add({
                    title: document.getElementById('jobTitle').value, description: document.getElementById('jobDesc').value, budget: document.getElementById('jobBudget').value, category: currentCategory,
                    lat: pLat, lng: pLng, dropLat: dLat, dropLng: dLng, distance: distText, customerId: auth.currentUser.uid, customerName: auth.currentUser.displayName, customerPhone: pNum,
                    status: "available", otpCode: randomOTP, rated: false, tasksList: finalChecklistArray,
                    isScheduled: isScheduled, scheduledDate: isScheduled ? document.getElementById('scheduleDate').value : null, scheduledTime: isScheduled ? document.getElementById('scheduleTime').value : null,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => { finishPost(); }).catch(() => { resetBtn(); });
            });
        });

        function resetBtn() { const btn = document.getElementById('btnSubmitPost'); btn.disabled = false; btn.innerText = "කාර්මික ශිල්පියෙකු සොයන්න (Find Fixer) 🚀"; }
        function finishPost() {
            alert("✅ ඔබේ QuickFix ඇනවුම සාර්ථකව පෝස්ට් කරා මචං!");
            document.getElementById('jobPostForm').reset(); document.getElementById('postFormArea').style.display = "none";
            resetBtn(); switchActivitiesFilter('active'); switchView('view-activities', 'nav-activities');
        }
        function logoutUser() { auth.signOut().then(() => { window.location.href = "auth.html"; }); }
    </script>
</body>
</html>
