chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(["geminiApiKey"],(result)=>{
        if(!result.geminiApiKey){
            chrome.tabs.create({url: "options.html"});
        } 
    })
    console.log("Extension installed");
});

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_PANEL" });
});

// Handle messages from the side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "CLOSE_PANEL") {
        // Forward the message to the content script of the current tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "CLOSE_PANEL" });
            }
        });
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === "GET_ARTICLE_TEXT") {
        // Forward the request to the content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "GET_ARTICLE_TEXT" }, (response) => {
                    sendResponse(response);
                });
            }
        });
        return true; // Keep the message channel open for the asynchronous response
    }
});
