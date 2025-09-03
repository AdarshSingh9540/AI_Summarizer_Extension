function getArticleText() {
    const article = document.querySelector("article");
    if (article) return article.innerText;

    const paragraphs = Array.from(document.querySelectorAll("p"));
    return paragraphs.map(p => p.innerText).join("\n");
}

// Create and handle side panel
let sidePanel = null;
let isVisible = false;

function createSidePanel() {
    // Check if panel already exists
    if (sidePanel) {
        toggleSidePanel();
        return;
    }

    // Create side panel container
    sidePanel = document.createElement('div');
    sidePanel.id = 'ai-summarizer-panel';
    sidePanel.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 380px;
        height: 100vh;
        z-index: 2147483647;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
    `;

    // Create the iframe
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        background: white;
    `;
    iframe.src = chrome.runtime.getURL('sidepanel.html');
    sidePanel.appendChild(iframe);

    // Add the panel to the body
    document.body.appendChild(sidePanel);
    
    // Show the panel
    setTimeout(() => {
        sidePanel.style.transform = 'translateX(0)';
        isVisible = true;
    }, 50);
}

function toggleSidePanel() {
    if (!sidePanel) return;
    
    if (isVisible) {
        sidePanel.style.transform = 'translateX(100%)';
        isVisible = false;
    } else {
        sidePanel.style.transform = 'translateX(0)';
        isVisible = true;
    }
}

function removeSidePanel() {
    if (!sidePanel) return;
    
    sidePanel.style.transform = 'translateX(100%)';
    setTimeout(() => {
        if (sidePanel && sidePanel.parentNode) {
            sidePanel.parentNode.removeChild(sidePanel);
            sidePanel = null;
            isVisible = false;
        }
    }, 300);
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_ARTICLE_TEXT") {
        const articleText = getArticleText();
        sendResponse({ articleText });
        return true;
    }
    
    if (request.action === "TOGGLE_PANEL") {
        createSidePanel();
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === "CLOSE_PANEL") {
        removeSidePanel();
        sendResponse({ success: true });
        return true;
    }
});