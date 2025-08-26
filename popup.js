document.getElementById('summarize-button').addEventListener("click",()=>{
   const res = document.getElementById("result");
   res.textContent = "Summarizing...";

   chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
       const currentTab = tabs[0];
       chrome.tabs.sendMessage(currentTab.id, {action: "GET_ARTICLE_TEXT"}, (response) => {
           const articleText = response.articleText;
           res.textContent = articleText;
       });
   });
});