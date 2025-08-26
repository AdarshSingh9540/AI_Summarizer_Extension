document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
        if (geminiApiKey) document.getElementById("api-key").value = geminiApiKey;
    });

    document.getElementById("save-button").addEventListener("click", () => {
        const apiKey = document.getElementById("api-key").value;
        if (!apiKey) return;
        chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
            const msg = document.getElementById("success-message");
            msg.classList.add("active");
            setTimeout(() => msg.classList.remove("active"), 2000);
        });
    });
});