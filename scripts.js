let filesData = {}; // משתנה גלובלי לאחסון כל נתוני הקבצים
let currentIndex = 0; // משתנה גלובלי לאחסון האינדקס הנוכחי

document.addEventListener('DOMContentLoaded', function () {
    // הסתר את ה-modal כברירת מחדל
    document.getElementById('mediaModal').style.display = 'none';

    // בדוק אם יש encryptedMailId ב-URL
    const urlParams = new URLSearchParams(window.location.search);
    const encryptedMailId = urlParams.get('id');

    if (encryptedMailId) {
        // אם נמצא, השתמש בו כדי לקבל קבצים אוטומטית
        document.getElementById('linkInput').value = `https://www.jumbomail.me/l/en/gallery/${encryptedMailId}`;
        fetchFiles();
    }

    // הוספת אירועים לכפתורים
    document.getElementById('fetchFilesButton').addEventListener('click', fetchFiles);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('prevButton').addEventListener('click', playPrev);
    document.getElementById('nextButton').addEventListener('click', playNext);
});


async function fetchFiles() {
    const link = document.getElementById('linkInput').value;
    const encryptedMailId = extractEncryptedMailId(link);

    if (!encryptedMailId) {
        alert('קישור לא תקין. אנא הכנס קישור תקין של JumboMail.');
        return;
    }

    try {
        // Send message to background.js to fetch files
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'fetchFiles',
                body: {
                    "encryptedMailId": encryptedMailId,
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
        displayFiles();
    } catch (error) {
        console.error('שגיאה בקבלת הקבצים:', error);
        alert('אירעה שגיאה בעת קבלת הקבצים. אנא נסה שוב מאוחר יותר.');
    }
}


function extractEncryptedMailId(link) {
    const regex = /gallery\/([A-Za-z0-9=]+)/;
    const match = link.match(regex);
    return match ? match[1] : null;
}

function displayFiles() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    if (!filesData || Object.keys(filesData).length === 0) {
        fileList.innerHTML = '<p>לא נמצאו קבצים.</p>';
        return;
    }

    const filesArray = Object.keys(filesData);

    filesArray.forEach((fileId, index) => {
        const file = filesData[fileId];

        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.textContent = file.Name;

        if (file.Type === 'Audio') {
            const audioButton = document.createElement('button');
            audioButton.textContent = `נגן אודיו`;
            audioButton.onclick = () => {
                if (file.PreviewSrc) {
                    currentIndex = index; // Set current index
                    showModal('Audio', file.PreviewSrc, file.Name);
                } else {
                    alert('תצוגה מקדימה לא זמינה עבור קובץ האודיו.');
                }
            };
            fileItem.appendChild(audioButton);
        } else if (file.Type === 'Video') {
            const videoButton = document.createElement('button');
            videoButton.textContent = `נגן וידאו`;
            videoButton.onclick = async () => {
                const videoUrl = await fetchVideoLink(fileId);
                if (videoUrl) {
                    currentIndex = index; // Set current index
                    showModal('Video', videoUrl, file.Name);
                } else {
                    alert('שגיאה בקבלת קישור הווידאו.');
                }
            };
            fileItem.appendChild(videoButton);
        } else {
            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'הורד';
            downloadButton.onclick = () => downloadFile(fileId);
            fileItem.appendChild(downloadButton);
        }

        fileList.appendChild(fileItem);
    });
}

function showModal(type, src, fileName) {
    const modal = document.getElementById('mediaModal');
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
        modal.classList.remove('modal-fullscreen'); // Remove fullscreen for audio
    } else if (type === 'Video') {
        mediaElement = document.createElement('video');
        mediaElement.controls = true;
        mediaElement.autoplay = true; // Enable autoplay
        mediaElement.src = src;
        mediaElement.style.width = '100%';
        modal.classList.add('modal-fullscreen'); // Set fullscreen for video
    }

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

function closeModal() {
    const modal = document.getElementById('mediaModal');
    modal.style.display = 'none';
    document.getElementById('mediaContainer').innerHTML = '';
}

// Close the modal if clicking outside of the modal content
window.onclick = function (event) {
    const modal = document.getElementById('mediaModal');
    if (event.target === modal) {
        closeModal();
    }
}

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

async function fetchVideoLink(fileId) {
    const encryptedMailId = extractEncryptedMailId(document.getElementById('linkInput').value);

    if (!encryptedMailId) {
        alert('קישור לא תקין. אנא הכנס קישור תקין של JumboMail.');
        return null;
    }

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'fetchVideoLink',
            body: {
                "folderPathId": null,
                "encryptedMailId": encryptedMailId,
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

async function downloadFile(fileId) {
    const encryptedMailId = extractEncryptedMailId(document.getElementById('linkInput').value);

    if (!encryptedMailId) {
        alert('קישור לא תקין. אנא הכנס קישור תקין של JumboMail.');
        return;
    }

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'downloadFile',
            body: {
                "folderPathId": null,
                "encryptedMailId": encryptedMailId,
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

        window.open(response.link, '_blank');
    } catch (error) {
        console.error('שגיאה בהורדת הקובץ:', error);
        alert('אירעה שגיאה בעת הורדת הקובץ. אנא נסה שוב מאוחר יותר.');
    }
}
