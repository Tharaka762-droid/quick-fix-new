// index.html එකේ තියෙන Form එක අපේ කෝඩ් එකට සම්බන්ධ කරගැනීම
document.getElementById('quickfixTaskForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Form එක Submit වෙද්දී පේජ් එක Refresh වීම වැළැක්වීම

    // Form එකේ තියෙන දත්ත ටික Variables වලට ගැනීම
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const urgency = document.getElementById('urgency').value;
    const budget = document.getElementById('budget').value;
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;

    // බ්‍රවුසර් එකේ GPS (Geolocation) වැඩ කරනවාද කියා බැලීම
    if (navigator.geolocation) {
        // කස්ටමර්ගේ සජීවී ලොකේෂන් එක ලබාගැනීම
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // සප්ලයර්ට කෙලින්ම බලන්න පුළුවන් Google Map ලින්ක් එක හැදීම
            const googleMapLink = `https://www.google.com/maps?q=${lat},${lng}`;

            // දැනට අපි මේ දත්ත ටික බ්‍රවුසර් එකේ Alert එකක් විදිහට පෙන්වමු
            // (ඊළඟ පියවරේදී මේවා Firebase ඩේටාබේස් එකට යවනවා)
            alert(`සාර්ථකයි! ඔබේ ඇණවුම පද්ධතියට ඇතුලත් වුණා.\n\nනම: ${name}\nවැඩේ: ${title}\nලොකේෂන් ලින්ක්: ${googleMapLink}`);
            
            console.log("Task Data:", { title, desc, urgency, budget, name, phone, googleMapLink });

        }, function(error) {
            // කස්ටමර් ලොකේෂන් permission දුන්නේ නැත්නම් වෙන දේ
            alert("කරුණාකර සජීවී ස්ථානය (Location) ලබාගැනීමට අවසර (Allow) ලබාදෙන්න.");
        });
    } else {
        alert("ඔබේ බ්‍රවුසර් එක මඟින් ලොකේෂන් ලබාගත නොහැක.");
    }
});