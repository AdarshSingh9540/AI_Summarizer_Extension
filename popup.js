document.getElementById('summarize-button').addEventListener("click",()=>{
    const resultDiv = document.getElementById("result");
    const summaryType = document.getElementById("summary-type")?.value || "short";
    resultDiv.innerHTML = '<div class="loader"></div>';

    chrome.storage.sync.get(['geminiApiKey'], ({ geminiApiKey }) => {
        if (!geminiApiKey) {
            resultDiv.innerHTML = "Gemini API Key is not set.";
            return;
        }
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            chrome.tabs.sendMessage(currentTab.id, { action: "GET_ARTICLE_TEXT" }, async (response) => {
                const articleText = response?.articleText;
                if (!articleText) {
                    resultDiv.innerHTML = "Failed to retrieve article text.";
                    return;
                }
                try {
                    const summary = await getGeminiSummary(articleText, summaryType, geminiApiKey);
                    resultDiv.textContent = summary;
                } catch (e) {
                    resultDiv.innerHTML = "Failed to summarize article.";
                }
            });
        });
    });
});


async function getGeminiSummary(articleText, summaryType, apiKey) {
    const url =  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = `Summarize the following article in a ${summaryType} way:\n\n${articleText}`;
    const body = {
        contents: [{ parts: [{ text: prompt }] }]
    };
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No summary returned.";
}


document.getElementById("copy-button").addEventListener("click", () => {
    const resultDiv = document.getElementById("result");
    const text = resultDiv.innerText;
    if (text && text.trim() !== "" && text !== "Select a type and click Summarize...") {
        navigator.clipboard.writeText(text);
        const btn = document.getElementById("copy-button");
        const oldText = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = oldText; }, 1200);
    }
});