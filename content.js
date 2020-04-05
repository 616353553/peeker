chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(request) {
        if (request.msg == "getHtmlContent") {
            port.postMessage({content: document.documentElement.innerHTML});
        }
    });
});

// browser.runtime.onMessage.addListener((message) => {
//     postMessage({content: document.documentElement.innerHTML});
// });

document.addEventListener("dblclick", () => {
    chrome.runtime.sendMessage(
        {
            action: "upload", 
            content: document.documentElement.innerHTML
        }, 
        null);
});