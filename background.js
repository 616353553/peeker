var folderId = null;
var pageNumber = 0;
var userToken = null;
var userEmail = null;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "startPeeking") {
        if (folderId === null) {
            createFolder(data => {
                folderId = data.folderId;
                sendResponse({"userEmail": userEmail, "userToken": userToken, "folderId": folderId});
            });
        } else {
            sendResponse({"userEmail": userEmail, "userToken": userToken, "folderId": folderId});
        }
    } else if (request.action === "endPeeking") {
        folderId = null;
        pageNumber = 0;
        sendResponse({"userEmail": userEmail, "userToken": userToken, "folderId": folderId});
    } else if (request.action === "upload") {
        upload(request.content);
    } else if (request.action === "createFolder") {
        createFolder(data => {
            folderId = data.folderId;
            sendResponse({"folderId": folderId});
        });
    } else if (request.action === "login") {
        login(data => {
            userToken = data.userToken;
            userEmail = data.userEmail;
            sendResponse({"userEmail": userEmail, "userToken": userToken, "folderId": folderId});
        });
    } else if (request.action === "logout") {
        logout(() => {
            sendResponse({"userEmail": userEmail, "userToken": userToken, "folderId": folderId});
        });
    } else if (request.action === "checkAuthStatus") {
        let loggedIn = userEmail !== null && userToken !== null;
        sendResponse({"loggedIn": loggedIn});
    } else if (request.action === "getAll") {
        sendResponse({"userEmail": userEmail, "userToken": userToken, "folderId": folderId});
    }

    // "return true" prevents channel from being closed
    return true;
});

// When "activated-tab" switches to an exsiting tab, load content.js if necessary
chrome.tabs.onActivated.addListener(activeInfo => {
    let tabId = activeInfo.tabId;

    chrome.tabs.sendMessage(tabId, {action: "checkContentStatus"}, response => {
        if(chrome.runtime.lastError) {
            chrome.tabs.executeScript(tabId, {file: "content.js"}, (result) => {
                // handle errors
                if(chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                }
            });
        }
    });
});

/**
 * Generate a random string as boundary for muti-part 
 * uploading, the boundary must not appear in the given content
 * @param {string} content 
 * @returns {string}
 */
function generateUniqueBoundary(content) {
    let boundary;
    while (true) {
        boundary = Math.random().toString(36).substr(2);
        if (!content.includes(boundary)) {
            return boundary;
        }
    }
}

/**
 * Remove all "<script> html tags" from given content
 * @param {string} content 
 * @returns {string}
 */
function removeAllScriptTags(content) {
    return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/g, "");
}

/**
 * Upload given content to Google Drive
 */
function uploadContent(content, userToken, folderId, fileName, callback) {
    let boundary = generateUniqueBoundary(content);
    let delimiter = "\r\n--" + boundary + "\r\n";
    let closeDelimiter = "\r\n--" + boundary + "--";

    let metadata = {
        "title": fileName,
        "parents": [
            {
                "kind": "drive#parentReference",
                "id": folderId
            }
        ]
    };
    
    let requestBody = 
        delimiter + 
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/html\r\n\r\n' +
        content +
        closeDelimiter;

    // instantiate http request
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart", true);
    xhr.setRequestHeader("Authorization", `Bearer ${userToken}`);
    xhr.setRequestHeader("Content-Type", `multipart/related; boundary="${boundary}"`);

    // Call a function when the state changes
    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE) {
            callback(this.status);
        }
    }
    xhr.send(requestBody);
}

/**
 * Upload the given content as .html file to Google Drive 
 * @param {string} content
 */
function upload(content) {
    if (folderId === null) {
        console.log("Failed to upload file: folder id missing");
    } else if (userToken === null) {
        console.log("Failed to upload file: user token missing");
    } else if (pageNumber === null) {
        console.log("Failed to upload file: page number missing");
    } else if (content !== null && content !== undefined) {
        let fileName = "page_" + pageNumber + ".html";
        content = removeAllScriptTags(content);
        uploadContent(content, userToken, folderId, fileName, function(status) {
            if (status === 200) { 
                // Request succeed
                console.log(`Succeed to upload file: status ${status}`);
                pageNumber += 1;
            } else { 
                // Request failed
                console.log(`Failed to upload file: status ${status}`);
            }
        });
    }
}

/**
 * Create a folder on Google Drive
 * @param {string} userToken 
 * @param {string} folderName
 * @param {function} callback 
 */
function createFolder(callback) {
    if (userToken === null) {
        callback({"folderId": null});
    } else {
        let folderName = generateFolderName();
        var metadata = {
            'title' : folderName,
            'mimeType' : 'application/vnd.google-apps.folder',
        };
        // instantiate http request
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "https://www.googleapis.com/drive/v2/files", true);
        xhr.setRequestHeader("Authorization", "Bearer " + userToken);
        xhr.setRequestHeader("Content-Type", "application/json");
        
        // Call a function when the state changes
        xhr.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE) {
                if (this.status === 200) {
                    let responseBody = JSON.parse(this.responseText);
                    callback({"folderId": responseBody.id});
                } else {
                    callback({"folderId": null});
                }
            }
        }
        xhr.send(JSON.stringify(metadata));
    }
}


/**
 * Generate a string as folder name based on current time
 * @returns {string}
 */
function generateFolderName() {
    let current = new Date();
    let year = current.getFullYear();
    let month = current.getMonth() + 1;
    let date = current.getDate();
    let hour = current.getHours();
    let minute = current.getMinutes();
    let second = current.getSeconds();
    return `question_${year}-${month}-${date}-${hour}-${minute}-${second}`;
}

/**
 * Login user, retrieve user token, user email
 * @param {function} callback 
 */
function login(callback) {
    chrome.identity.getAuthToken({interactive: true}, function(token) {
        if (token !== undefined && token !== null) {
            chrome.identity.getProfileUserInfo(info => { // get user email
                if (info === undefined || info === null) {
                    callback({"userToken": null, "userEmail": null});
                } else {
                    callback({"userToken": token, "userEmail": info.email});
                }
            });
        } else {
            callback({"userToken": null, "userEmail": null});
        }
    });
}

/**
 * Log out
 * @param {function} callback
 */
function logout(callback) {
    folderId = null;
    pageNumber = 0;
    userToken = null;
    userEmail = null;
    callback();
}