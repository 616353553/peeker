document.addEventListener("dblclick", () => {
    chrome.runtime.sendMessage(
        {
            action: "upload", 
            content: document.documentElement.innerHTML
        }, 
        null);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkContentStatus") {
        sendResponse({"loaded": true});
    }
});