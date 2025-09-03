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
                    const plainSummary = stripMarkdown(summary);
                    
                    if (summaryType === "custom") {
                        // For bullet points, use innerHTML and preserve line breaks
                        resultDiv.innerHTML = plainSummary.replace(/\n/g, '<br>');
                    } else {
                        resultDiv.textContent = plainSummary;
                    }
                } catch (e) {
                    resultDiv.innerHTML = "Failed to summarize article.";
                }
function stripMarkdown(md) {
    if (!md) return '';
    
    // Preserve bullet points and numbered lists if summary type is "custom"
    if (document.getElementById("summary-type").value === "custom") {
        return md
            // Convert markdown bullet points to HTML bullet points
            .replace(/^\s*[-*+]\s+/gm, '• ')
            // Convert markdown numbered lists to formatted numbered lists
            .replace(/^\s*(\d+)\.\s+/gm, '$1. ')
            // Remove emphasis formatting (bold/italic)
            .replace(/([*_]{1,3})(\S.*?\S)\1/g, '$2')
            .replace(/`{1,3}[^`]*`{1,3}/g, '')
            .replace(/~~(.*?)~~/g, '$1')
            .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
            .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
            .replace(/#+\s*(.*)/g, '$1')
            .replace(/>\s?/g, '')
            .trim();
    } else {
        // Original behavior for other summary types
        return md
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/^\s*\d+\.\s+/gm, '') 
            .replace(/([*_]{1,3})(\S.*?\S)\1/g, '$2')
            .replace(/`{1,3}[^`]*`{1,3}/g, '')
            .replace(/~~(.*?)~~/g, '$1')
            .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
            .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
            .replace(/#+\s*(.*)/g, '$1')
            .replace(/>\s?/g, '')
            .replace(/\r?\n{2,}/g, '\n') 
            .replace(/\r?\n/g, '\n')
            .trim();
    }
}
            });
        });
    });
});


async function getGeminiSummary(articleText, summaryType, apiKey) {
    const url =  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    let prompt;
    if (summaryType === "custom") {
        prompt = `Summarize the following article in a clear, organized format with bullet points. Use • or numbers (1., 2., etc.) at the beginning of each point. Make each point distinct and start on a new line:\n\n${articleText}`;
    } else {
        prompt = `Summarize the following article in a ${summaryType} way:\n\n${articleText}`;
    }
    
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
    // Use innerText which preserves the displayed formatting including bullet points
    const text = resultDiv.innerText;
    if (text && text.trim() !== "" && text !== "Select a type and click Summarize...") {
        navigator.clipboard.writeText(text);
        const btn = document.getElementById("copy-button");
        const oldText = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = oldText; }, 1200);
    }
});