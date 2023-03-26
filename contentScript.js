(() => {
    let ytTopRow = '';  let ytSecondary = ''
    let currentVideo = ''
      let finalSummary = ''

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
        //add a timeout or debounce once it is clicked once
             summaryBtn.addEventListener('click', (e) => {
                getTranscriptLang()
            })
        }

        if (!summarySectionExists) {
            const summarySection = document.createElement('div')
            const summaryText = document.createTextNode("Summarize");
            // const summary = document.createElement('p')

            summarySection.className = 'summary-section'
            summarySection.appendChild(summaryText)
            // summarySection.appendChild(summary)
            // summary.innerText = finalSummary

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
        
        await getTranscript(langOptions?.filter(lang => lang.language === mainLang)[0].link)
    }

    const getTranscript = async (link) => {
        const rawTranscript = await getRawTranscript(link);
        const p = rawTranscript?.map((item) => { return item.text; })?.join(' ').replace(/[\n\r\s\t]+/g, ' ')
        //if video length/transcript length  is greater than 25 mins/20000, double the chunk size
        let chunk_size
        if (p.length > 20000) chunk_size = 4000
        else chunk_size = 4000
        const arr = chunkSubstr(p, chunk_size)
        let summary = []
        for (let i = 0; i < arr.length; i++ ) {
            prompt = i === 0 ? "Summarize this:" + arr[i] : "Summarize this in addition to the previous summary prompt" + arr[i]
            
            const r = await getSummary(prompt)
            summary.push(r)
        }

       let joined = summary.join(',')
        if (summary.length > 1) {
            finalSummary = await getSummary(joined)
        }
        else {
            finalSummary = summary[0]
        }
         const summarySection = document.querySelector('.summary-section')
            const finalSummaryEl = document.createElement('p')

            summarySection.appendChild(finalSummaryEl)
            finalSummaryEl.innerText = finalSummary

        return finalSummary
        
    }
    const getRawTranscript = async (link) => {
    // Get Transcript
    const tsPage = await fetch(link);

    const tsXml = await tsPage.text().then(r=>{return r})

    // Parse Transcript
    const parseTs = parseHTML(tsXml);
    const tsNodes = parseTs.childNodes[1].childNodes;
    const timeStampedTranscipt =  Array.from(tsNodes).map(i => {
        return {
        start: i.getAttribute("start"),
        duration: i.getAttribute("dur"),
        text: i.textContent
        };
    });
    return timeStampedTranscipt
    }

    const parseHTML=(html)=> {
    var t = document.createElement('template');
        t.innerHTML = html;
    return t.content;
    }
    const OPENAI_API_KEY = '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'
    
//     const getSummary = async (prompt, fc) => {
//      var xhr = new XMLHttpRequest();
//     xhr.open("POST", "https://api.openai.com/v1/completions");
//     xhr.setRequestHeader("Accept", "application/json");
//     xhr.setRequestHeader("Content-Type", "application/json");
//         xhr.setRequestHeader("Authorization", "Bearer " + OPENAI_API_KEY)
//          var data = {
//         model: "text-davinci-003",
//         prompt: "Summarize the following text:" + prompt,
//         max_tokens: 2048,
//         // user: "1",
//         temperature:  0.5,
//         frequency_penalty: 0.0, 
//         presence_penalty: 0.0,  
//         // stop: ["#", ";"]      
//     }
//         const body = JSON.stringify(
//  data
//         );
//          let res = ''
//         xhr.onload = () => {
   
//             if (xhr.readyState == 4 && xhr.status == 200) {
//                 res += JSON.parse(xhr.responseText).choices[0].text
//                 return fc(res)
//   } else {
//     console.log(`Error: ${xhr.status}`);
//   }
// };
//         xhr.send(body);
//     }

    const getSummary = async (prompt) => {
         var data = {
        model: "text-davinci-003",
        prompt: "Summarize the following text:" + prompt.replace(/\\n/g, '').replace(/\n/g, ''),
        max_tokens: 2048,
        // user: "1",
        temperature:  0.5,
        frequency_penalty: 0.0, 
        presence_penalty: 0.0,  
        // stop: ["#", ";"]      
    }
        const body = JSON.stringify(
 data
        );
        let ans = await fetch( "https://api.openai.com/v1/completions", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': "application/json",
                "Authorization": "Bearer " + OPENAI_API_KEY
            },
            body: body
        })
             .then(response => {
                 return response.json().then(r => r.choices[0].text)
             })
            .catch(error => console.log('Error:', error));
       
        return ans
    }
    
    function chunkSubstr(str, size) {
  const numChunks = Math.ceil(str.length / size)
  const chunks = new Array(numChunks)

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size)
  }

  return chunks
}

}
)();