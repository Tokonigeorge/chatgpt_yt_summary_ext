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
                getTranscriptLang()
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

    const getTranscriptLang = async () => {
        const mainLang = "English";
        //fetch page html 
        const ytpage = await fetch("https://www.youtube.com/watch?v=" + currentVideo);
        const pageHtml = await ytpage.text()
        const splitHtml = pageHtml.split('"captions":')

        //if no captions found
        if (splitHtml.length < 2) {
            //todo: put something for no transcript avaliable
            return;
        }

        const captions = splitHtml[1].split(',"videoDetails')[0].replace('\n', '')
        const captionTracks = JSON.parse(captions).playerCaptionsTracklistRenderer.captionTracks
        const languages = captionTracks?.map(i => { return i.name.simpleText; })

        //todo: take out first sort
        languages.sort((x,y)=>{ return x.includes(mainLang) ? -1 : y.includes(mainLang) ? 1 : 0; });
        languages.sort((x,y)=>{ return x == mainLang? -1 : y == mainLang? 1 : 0; });

        const langOptions = languages?.map((name, index) => {
            return {
            language: name,
            link: captionTracks.find(i => i.name.simpleText === name).baseUrl
            }
        })
        
        await getTranscript(langOptions?.filter(lang => lang.name === mainLang)?.link)

    }

    async function getTranscript(link) {
        const rawTranscript = await getRawTranscript(link);
        return rawTranscript?.map((item) => { return item.text; })?.join(' ');
    }

    async function getRawTranscript(link) {
    // Get Transcript
    const tsPage = await fetch(link); 
    const tsXml= await tsPage.text();

    // Parse Transcript
    const parseTs = parseHTML(tsXml);
    const tsNodes = parseTs.childNodes[1].childNodes;

    const timeStampedTranscipt =  tsNodes?.map(i => {
        return {
        start: i.getAttribute("start"),
        duration: i.getAttribute("dur"),
        text: i.textContent
        };
    });
        
    return timeStampedTranscipt
    }

    function parseHTML(html) {
    var t = document.createElement('template');
        t.innerHTML = html;
    return t.content;
    }

}
)();