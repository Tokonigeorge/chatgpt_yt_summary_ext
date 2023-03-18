 
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) run(tab);
});

chrome.tabs.onActivated.addListener(info => {
  chrome.tabs.get(info.tabId, run);
});

const run = (tab) => { 
  if (tab.url && tab.url.includes('youtube.com/watch')) {
        const queryParams = tab.url.split('?')[1]
        const urlParams = new URLSearchParams(queryParams);

        //send a message to the content script
        chrome.tabs.sendMessage(tab.id, {
            type: 'NEW',
            videoId: urlParams.get('v')
        })
      .catch((error)=> console.log(error));
     }
}

