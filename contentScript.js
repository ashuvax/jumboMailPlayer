// זיהוי אם אנחנו בדף הנכון של JumboMail
(function () {
    // וודא שהדף הוא דף gallery של JumboMail
    const currentUrl = window.location.href;
    const encryptedMailId = currentUrl.match(/gallery\/([A-Za-z0-9=]+)/);

    if (!encryptedMailId) {
        return; // לא בדף המתאים
    }

    // יצירת כפתור חדש
    const button = document.createElement('button');
    button.textContent = 'פתח בתוסף JumboMail';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '1000';
    button.style.padding = '10px';
    button.style.backgroundColor = '#007bff';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    button.onclick = () => {
        // פתיחת כרטיסייה חדשה עם התוסף והעברת ה-encryptedMailId
        chrome.runtime.sendMessage({
            action: 'openExtension',
            encryptedMailId: encryptedMailId[1]
        });
    };

    // הוספת הכפתור לגוף הדף
    document.body.appendChild(button);
})();
