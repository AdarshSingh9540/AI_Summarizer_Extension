chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(["geminiApiKey"],(result)=>{
        if(!result.geminiApiKey){
            chrome.tabs.create({url: "options.html"});
        } 
    })
    console.log("Extension installed");
});

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_PANEL" });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "CLOSE_PANEL") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "CLOSE_PANEL" });
            }
        });
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === "GET_ARTICLE_TEXT") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "GET_ARTICLE_TEXT" }, (response) => {
                    sendResponse(response);
                });
            }
        });
        return true;
    }
});
