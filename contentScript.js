let filesData = {}; // משתנה גלובלי לאחסון כל נתוני הקבצים
let currentIndex = 0; // משתנה גלובלי לאחסון האינדקס הנוכחי
let mailId = ''; // משתנה גלובלי לאחסון המזהה של המייל
let modalLoad = false; // משתנה גלובלי לאחסון האם המודל נטען

const closeModal = () => {
    const modal = document.getElementById('mediaModal');
    if (!modal) return;
    modal.style.display = 'none';
    const mediaContainer = document.getElementById('mediaContainer');
    if (!mediaContainer) return;
    mediaContainer.innerHTML = '';
    modalLoad = false;
}

// Close the modal if clicking outside of the modal content
window.onclick = function (event) {
    const modal = document.getElementById('mediaModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Function to save volume to LocalStorage
const saveVolume = (volume) => {
    localStorage.setItem('mediaVolume', volume);
}

// Function to get volume from LocalStorage
const getVolume = () => {
    return localStorage.getItem('mediaVolume') || 1; // Default volume is 1 (100%)
}
// Add event listeners for keyboard navigation
window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
        playNext();
    } else if (event.key === 'ArrowLeft') {
        playPrev();
    }
});

function playNext() {
    let nextIndex = currentIndex + 1;
    while (nextIndex < Object.keys(filesData).length) {
        const nextFileId = Object.keys(filesData)[nextIndex];
        const nextFile = filesData[nextFileId];
        if (nextFile.Type === 'Audio' || nextFile.Type === 'Video') {
            if (nextFile.Type === 'Audio') {
                showModal('Audio', nextFile.PreviewSrc, nextFile.Name);
            } else if (nextFile.Type === 'Video') {
                fetchVideoLink(nextFileId).then((videoUrl) => {
                    if (videoUrl) {
                        showModal('Video', videoUrl, nextFile.Name);
                    }
                });
            }
            currentIndex = nextIndex; // Update current index
            break;
        }
        nextIndex++;
    }
}

function playPrev() {
    let prevIndex = currentIndex - 1;
    while (prevIndex >= 0) {
        const prevFileId = Object.keys(filesData)[prevIndex];
        const prevFile = filesData[prevFileId];
        if (prevFile.Type === 'Audio' || prevFile.Type === 'Video') {
            if (prevFile.Type === 'Audio') {
                showModal('Audio', prevFile.PreviewSrc, prevFile.Name);
            } else if (prevFile.Type === 'Video') {
                fetchVideoLink(prevFileId).then((videoUrl) => {
                    if (videoUrl) {
                        showModal('Video', videoUrl, prevFile.Name);
                    }
                });
            }
            currentIndex = prevIndex; // Update current index
            break;
        }
        prevIndex--;
    }
}

function hasNext() {
    for (let i = currentIndex + 1; i < Object.keys(filesData).length; i++) {
        const nextFileId = Object.keys(filesData)[i];
        const nextFile = filesData[nextFileId];
        if (nextFile.Type === 'Audio' || nextFile.Type === 'Video') {
            return true;
        }
    }
    return false;
}

function hasPrev() {
    for (let i = currentIndex - 1; i >= 0; i--) {
        const prevFileId = Object.keys(filesData)[i];
        const prevFile = filesData[prevFileId];
        if (prevFile.Type === 'Audio' || prevFile.Type === 'Video') {
            return true;
        }
    }
    return false;
}

const createModal = () => {
    // add modal container html, style and event listeners
    const modal = document.createElement('div');
    modal.id = 'mediaModal';
    modal.classList.add('modal');
    modal.style.display = 'none';
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');
    const close = document.createElement('span');
    close.classList.add('close');
    close.id = 'closeModal';
    close.textContent = '×';
    modalContent.appendChild(close);
    const mediaTitle = document.createElement('div');
    mediaTitle.id = 'mediaTitle';
    mediaTitle.classList.add('media-title');
    modalContent.appendChild(mediaTitle);
    const mediaContainer = document.createElement('div');
    mediaContainer.id = 'mediaContainer';
    modalContent.appendChild(mediaContainer);
    close.onclick = () => {
        closeModal();
    };
    const prevButton = document.createElement('button');
    prevButton.id = 'prevButton';
    prevButton.textContent = 'הקודם';
    modalContent.appendChild(prevButton);
    const nextButton = document.createElement('button');
    nextButton.id = 'nextButton';
    nextButton.textContent = 'הבא';
    modalContent.appendChild(nextButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const style = document.createElement('style');
    style.textContent = `
        .modal-content button {
            padding: 10px 20px;
            cursor: pointer;
        }
        
        /* Modal styles */
        .modal {
            display: none; /* Hidden by default */
            position: fixed; /* Stay in place */
            z-index: 1000; /* Sit on top */
            left: 50%; /* Center the modal */
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%; /* Full width */
            height: 100%; /* Full height */
            background-color: rgba(0, 0, 0, 0.5); /* Black w/ opacity */
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background-color: #fefefe;
            border: 1px solid #888;
            width: 80%; /* Default width */
            height: auto; /* Adjust height */
            border-radius: 8px;
            text-align: center; /* Center text */
            padding: 20px;
            position: relative;
            max-width: 600px; /* Maximum width for content */
        }

        .modal-content video {
            max-width: 80%;
        }

        .media-title {
            direction: rtl;
            font-size: 18px;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .close {
            color: #aaa;
            position: absolute;
            right: 20px;
            top: 20px;
            font-size: 28px;
            font-weight: bold;
        }

        .close:hover,
        .close:focus {
            color: black;
            text-decoration: none;
            cursor: pointer;
        }

        #prevButton,
        #nextButton {
            padding: 10px 15px;
            margin: 10px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
}

const showModal = (type, src, fileName) => {
    const modal = document.getElementById('mediaModal');
    // add fake mouse enter event
    modal.dispatchEvent(new Event('mouseenter'));
    const mediaContainer = document.getElementById('mediaContainer');
    const mediaTitle = document.getElementById('mediaTitle');
    const nextButton = document.getElementById('nextButton');
    const prevButton = document.getElementById('prevButton');

    // Clear any previous content
    mediaContainer.innerHTML = '';
    mediaTitle.textContent = fileName;

    let mediaElement;
    if (type === 'Audio') {
        mediaElement = document.createElement('audio');
        mediaElement.controls = true;
        mediaElement.autoplay = true; // Enable autoplay
        mediaElement.src = src;
    } else if (type === 'Video') {
        mediaElement = document.createElement('video');
        mediaElement.controls = true;
        mediaElement.autoplay = true; // Enable autoplay
        mediaElement.src = src;
    } else {
        alert('סוג מדיה לא נתמך.');
        return;
    }

    // Set the volume from LocalStorage
    mediaElement.volume = getVolume();

    // Save the volume when it changes
    mediaElement.onvolumechange = () => {
        saveVolume(mediaElement.volume);
    };

    mediaElement.onended = playNext; // Attach the playNext function when media ends

    mediaContainer.appendChild(mediaElement);
    modal.style.display = 'flex'; // Show the modal

    // Set click events for next and previous buttons
    nextButton.onclick = playNext;
    prevButton.onclick = playPrev;

    // Enable or disable buttons based on the current index
    nextButton.disabled = !hasNext();
    prevButton.disabled = !hasPrev();
}

async function fetchVideoLink(fileId) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'fetchVideoLink',
            body: {
                "folderPathId": null,
                "encryptedMailId": mailId,
                "fileList": fileId,
                "downloadType": "multi",
                "password": null,
                "isCollection": false,
                "culture": "en",
                "isProxySuccess": true,
                "uid": null
            }
        });

        if (response.error) {
            throw new Error(response.error);
        }

        return response.link;
    } catch (error) {
        console.error('שגיאה בקבלת קישור הווידאו:', error);
        return null;
    }
}

// זיהוי אם אנחנו בדף הנכון של JumboMail
(function () {
    // וודא שהדף הוא דף gallery של JumboMail
    const currentUrl = window.location.href;
    const encryptedMailId = currentUrl.match(/gallery\/([A-Za-z0-9=]+)/);

    if (!encryptedMailId) {
        return; // לא בדף המתאים
    }

    mailId = encryptedMailId[1];

    const fetchFiles = async () => {
        // בדיקה אם כבר קיימים נתוני קבצים
        if (Object.keys(filesData).length > 0) {
            return true;
        }

        try {
            // Send message to background.js to fetch files
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'fetchFiles',
                    body: {
                        "encryptedMailId": mailId,
                        "page": 1,
                        "perPage": 100,
                        "sortAsc": true,
                        "sortBy": "Name",
                        "folderId": null,
                        "password": null,
                        "search": "",
                        "contributorsFilter": [],
                        "foldersStructured": false
                    }
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            if (response.error) {
                throw new Error(response.error);
            }

            filesData = response.files; // Store files data globally
            return true;
        } catch (error) {
            console.error('שגיאה בקבלת הקבצים:', error);
            alert('אירעה שגיאה בעת קבלת הקבצים. אנא נסה שוב מאוחר יותר.');
        }
    }

    // פונקציה להוספת כפתור "Play"
    function addPlayButton() {
        const actionGroup = document.querySelector(".mail-actions-container");
        if (actionGroup) {
            const playButtonWrapper = document.createElement('button');
            playButtonWrapper.classList.add('jm-button', 'round-icon-button');
            playButtonWrapper.title = 'play all';
            const playButton = document.createElement('img');
            playButton.src = "https://resources.jumbomail.me/assets/icons/play.svg";
            playButton.classList.add('jm-icon', 'xl-icon', 'gray-icon', 'clickable-icon');
            playButtonWrapper.appendChild(playButton);
            playButtonWrapper.onclick = async () => {

                if (modalLoad) return;
                modalLoad = true;
                await fetchFiles();
                let currentFile = null;
                let i = currentIndex;
                for (i; i < Object.keys(filesData).length; i++) {
                    const file = filesData[Object.keys(filesData)[i]];
                    if (file.Type === 'Audio' || file.Type === 'Video') {
                        currentIndex = i;
                        currentFile = file;
                        break;
                    }
                }
                if (!currentFile) {
                    alert('לא נמצאו קבצי מדיה.');
                    return;
                }
                if (currentFile.Type === 'Audio') {
                    showModal(currentFile.Type, currentFile.PreviewSrc, currentFile.Name);
                } else if (currentFile.Type === 'Video') {
                    fetchVideoLink(Object.keys(filesData)[currentIndex]).then((videoUrl) => {
                        if (videoUrl) {
                            showModal('Video', videoUrl, currentFile.Name);
                        } else {
                            alert('לא ניתן להוריד את הוידאו.');
                        }
                    });
                }
                showModal(currentFile.Type, currentFile.PreviewSrc, currentFile.Name);
            }
            actionGroup.appendChild(playButtonWrapper);
        }
    }
    createModal();

    // יצירת MutationObserver כדי להמתין להוספת הסלקטור לדף
    const observer = new MutationObserver((mutations, obs) => {
        const actionGroup = document.querySelector(".mail-actions-container");
        if (actionGroup) {
            addPlayButton();
            obs.disconnect(); // הפסקת המעקב לאחר מציאת הסלקטור
        }
    });

    // הגדרת ה-MutationObserver למעקב אחר שינויים ב-body
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();