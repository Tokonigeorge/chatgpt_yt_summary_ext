(() => {
    let ytTopRow = '';  let ytSecondary = ''
    let currentVideo = ''

    //listen to the message sent by the background script
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, value, videoId } = obj
        
        if (type === 'NEW') {
            currentVideo = videoId;
            newVideoLoaded()
        }
    });

    const newVideoLoaded = async () => {
        const summaryBtnExists = document.getElementsByClassName('summary-btn')[0]
        const summarySectionExists = document.getElementsByClassName('summary-section')[0]
        
        if (!summaryBtnExists) {
            const summaryBtn = document.createElement("div");
            const summaryText = document.createTextNode("Summarize");
            const summaryIcon = document.createElement("img");
            
            summaryIcon.src = chrome.runtime.getURL('assets/btn-icon.png')
            
            summaryBtn.className = 'summary-btn'
            summaryBtn.appendChild(summaryText)
            summaryBtn.appendChild(summaryIcon)

            ytTopRow = document.querySelector('#menu #top-level-buttons-computed')
            ytTopRow?.appendChild(summaryBtn)
        
             summaryBtn.addEventListener('click', (e) => {
                console.log('I clicked')
            })
        }

        if (!summarySectionExists) {
            const summarySection = document.createElement('div')
            const summaryText = document.createTextNode("Summarize");
            summarySection.className = 'summary-section'
            summarySection.appendChild(summaryText)

            ytSecondary = document.querySelector('#secondary')
            ytSecondary?.prepend(summarySection)
        }
        
    }


}
)();