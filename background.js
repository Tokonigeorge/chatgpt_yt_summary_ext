chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.includes('youtube.com/watch')) {
        const queryParams = tab.url.split('?')[1]
        const urlParams = new URLSearchParams(queryParams);

        //send a message to the content script
        chrome.tabs.sendMessage(tabId, {
            type: 'NEW',
            videoId: urlParams.get('v')
        });
     }
 })
