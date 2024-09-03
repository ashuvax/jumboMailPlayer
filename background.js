chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: 'popup.html' });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openExtension') {
        // שנה את ה-URL של הכרטיסייה הנוכחית לתוסף שלך עם ה-encryptedMailId
        chrome.tabs.update(sender.tab.id, { url: chrome.runtime.getURL('popup.html') + '?id=' + request.encryptedMailId });
        return;
    }
    if (request.action === 'fetchFiles') {
        fetch('https://api.jumbomail.me/Mails/ReactGetMailFiles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request.body)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch files');
                }
                return response.json();
            })
            .then(data => {
                sendResponse({ files: data.files });
            })
            .catch(error => {
                console.error('Error fetching files:', error);
                sendResponse({ error: 'Error fetching files' });
            });

        return true;  // Return true here to indicate async response will be sent
    }

    if (request.action === 'fetchVideoLink') {
        fetch('https://api.jumbomail.me/mails/ReactGetDownloadLink', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request.body)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch video link');
                }
                return response.text();
            })
            .then(data => {
                sendResponse({ link: data.trim().replace(/^"|"$/g, '') });
            })
            .catch(error => {
                console.error('Error fetching video link:', error);
                sendResponse({ error: 'Error fetching video link' });
            });

        return true;  // Return true here to indicate async response will be sent
    }
});


