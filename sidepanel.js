async function getGeminiSummary(articleText, summaryType, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  let prompt;
  switch (summaryType) {
    case "custom":
      prompt = `Summarize the following article in a clear, organized format with bullet points. 
Create a list with 5-7 main points that capture the essential information.
Use • or numbers (1., 2., etc.) at the beginning of each point. 
Make each point distinct and start on a new line.
Each bullet point should be concise but informative (1-2 sentences).
Focus on the most important facts, insights, and takeaways.

Article text:
${articleText}`;
      break;
    case "brief":
      prompt = `Provide a brief, concise summary of the following article in 3-4 sentences.
Focus only on the most essential information.
Avoid unnecessary details and maintain a neutral tone.

Article text:
${articleText}`;
      break;
    case "detailed":
      prompt = `Create a comprehensive summary of the following article.
Include all major points, key arguments, and important data.
Organize the summary in a logical flow similar to the original article.
Maintain the original context and relationships between ideas.
The summary should be detailed enough to serve as a substitute for reading the full article.

Article text:
${articleText}`;
      break;
    default:
      prompt = `Summarize the following article in a clear, concise way:

Article text:
${articleText}`;
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

function stripMarkdown(md) {
  if (!md) return '';
  
  if (document.getElementById("summary-type").value === "custom") {
    // Convert markdown bullet lists to HTML lists
    let html = md;
    
    // Look for bullet point patterns and convert to HTML list
    let hasBullets = /^\s*[-*+]\s+/m.test(html) || /^\s*\d+\.\s+/m.test(html);
    
    if (hasBullets) {
      // Start with a UL
      let result = '<ul>';
      
      // Split by lines
      const lines = html.split('\n');
      
      lines.forEach(line => {
        // Check if this line is a bullet point
        if (/^\s*[-*+]\s+/.test(line)) {
          const content = line.replace(/^\s*[-*+]\s+/, '');
          result += `<li>${content}</li>`;
        } else if (/^\s*\d+\.\s+/.test(line)) {
          const content = line.replace(/^\s*\d+\.\s+/, '');
          result += `<li>${content}</li>`;
        } else if (line.trim() !== '') {
          // Regular line
          result += line;
        }
      });
      
      result += '</ul>';
      return result;
    } else {
      return md
        .replace(/([*_]{1,3})(\S.*?\S)\1/g, '$2')
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        .replace(/~~(.*?)~~/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
        .replace(/#+\s*(.*)/g, '$1')
        .replace(/>\s?/g, '')
        .trim();
    }
  } else {
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

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('close-panel').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "CLOSE_PANEL" });
  });

  // Tab switching functionality
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      tab.classList.add('active');
      
      const tabType = tab.getAttribute('data-tab');
      if (tabType === 'article') {
        document.getElementById('summary-type').value = 'brief';
      } else if (tabType === 'custom') {
        document.getElementById('summary-type').value = 'custom';
      }
    });
  });

  document.getElementById('summarize-button').addEventListener('click', () => {
    const resultDiv = document.getElementById('result');
    const summaryType = document.getElementById('summary-type').value;
    resultDiv.innerHTML = '<div class="loader"></div>';

    chrome.storage.sync.get(['geminiApiKey'], ({ geminiApiKey }) => {
      if (!geminiApiKey) {
        resultDiv.innerHTML = '<div class="status-message status-warning">Gemini API Key is not set. Please configure it in the extension options.</div>';
        return;
      }

      chrome.runtime.sendMessage({ action: "GET_ARTICLE_TEXT" }, async (response) => {
        const articleText = response?.articleText;
        
        if (!articleText) {
          resultDiv.innerHTML = '<div class="status-message status-error">Failed to retrieve article text.</div>';
          return;
        }
        
        try {
          const summary = await getGeminiSummary(articleText, summaryType, geminiApiKey);
          const processedSummary = stripMarkdown(summary);
          
          if (summaryType === "custom") {
            resultDiv.innerHTML = processedSummary;
          } else {
            // For regular text, create paragraphs with proper spacing
            const paragraphs = processedSummary.split('\n\n');
            resultDiv.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
          }
        } catch (e) {
          resultDiv.innerHTML = '<div class="status-message status-error">Failed to summarize article.</div>';
        }
      });
    });
  });

  document.getElementById('copy-button').addEventListener('click', () => {
    const resultDiv = document.getElementById('result');
    const text = resultDiv.innerText;
    
    if (text && text.trim() !== "" && text !== "Select a type and click Summarize...") {
      navigator.clipboard.writeText(text);
      const btn = document.getElementById('copy-button');
      const oldText = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = oldText; }, 1200);
    }
  });
});
