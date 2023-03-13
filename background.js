chrome.tabs.onUpdated.addListener((tabId, tab) => {
    console.log(tab, tab.url)
    if (tab.url && tab.url.includes('youtube.come/watch')) {
        const queryParams = tab.url.split('?')[1]
        const urlParams = new URLSearchParams(queryParams);

        console.log(urlParams, 'paramss')
        //send a message to the content script
        chromw.tabs.sendMessage(tabId, {
            type: 'NEW',
            videoId: urlParams.get('v')
        });
     }
 })
