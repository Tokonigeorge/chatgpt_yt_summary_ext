(() => {
    let youtubeLeftControls, letYoutubePlayer;
    let currentVideo = ''

    //listen to the message sent by the background script
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, value, videoId } = obj
        
        if (type === 'NEW') {
            currentVideo = videoId;
            newVideoLoaded()
        }
    })

}
)();