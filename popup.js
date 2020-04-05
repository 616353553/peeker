var userToken;
var userEmail;
var folderId;

document.addEventListener("DOMContentLoaded", function() {
    chrome.runtime.sendMessage({"action": "getAll"}, result => {
        updateUI(result.userEmail, result.userToken, result.folderId);
    })

    $("#authButton").click(function() {
        $("#authButton").prop('disabled', true);
        chrome.runtime.sendMessage({"action": "checkAuthStatus"}, result => {
            if (result.loggedIn) {
                chrome.runtime.sendMessage({"action": "logout"}, response => {
                    updateUI(response.userEmail, response.userToken, response.folderId);
                    $("#authButton").prop('disabled', false);
                })
            } else {
                chrome.runtime.sendMessage({"action": "login"}, response => {
                    updateUI(response.userEmail, response.userToken, response.folderId);
                    $("#authButton").prop('disabled', false);
                })
            }
        })
    });

    $("#actionButton").click(function() {
        $("#actionButton").prop('disabled', true);
        chrome.runtime.sendMessage({"action": "getAll"}, result => {
            if (result.folderId === null) {
                chrome.runtime.sendMessage({"action": "startPeeking"}, response => {
                    updateUI(response.userEmail, response.userToken, response.folderId);
                    $("#actionButton").prop('disabled', false);
                });
            } else {
                chrome.runtime.sendMessage({"action": "endPeeking"}, response => {
                    updateUI(response.userEmail, response.userToken, response.folderId);
                    $("#actionButton").prop('disabled', false);
                });
            }
        });
    });
}, false);


function updateUI(userEmail, userToken, folderId) {
    if (userEmail !== null && userToken !== null) {
        if (folderId !== null) {
            updateMessage(`Uploaing to folder '${folderId}', <b>please make sure the folder is visible to everyone</b>`, "blue");
            $("#identity").html(`Logged in as ${userEmail}`);
            $("#authButton").html("Log out");
            $("#actionButton").html("End Peeking");
            $("#actionButton").show();
        } else {
            updateMessage("", "blue");
            $("#identity").html(`Logged in as ${userEmail}`);
            $("#authButton").html("Log out");
            $("#actionButton").html("Start Peeking");
            $("#actionButton").show();
        }
    } else {
        updateMessage("Welcome to Peeker v1.0, please log in", "blue");
        $("#identity").html("");
        $("#authButton").html("Log in");
        $("#actionButton").html("Start Peeking");
        $("#actionButton").hide();
    }
}

/**
 * Update message to user with text and color
 * @param {string} text 
 * @param {string} color 
 */
function updateMessage(text, color) {
    $("#message").html(text);
    $("#message").css("color", color);
}
