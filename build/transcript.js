import { transcriptFailed, summaryFailed, loading } from "../contentScript";

const mainLang = "English";
let finalSummary = "";

export const getTranscriptLink = async () => {
    return
  //fetch page html
  const ytpage = await fetch("https://www.youtube.com/watch?v=" + currentVideo);
  const pageHtml = await ytpage.text();
  const splitHtml = pageHtml.split('"captions":');

  //if no captions found
  if (splitHtml.length < 2) {
    transcriptFailed = true;
    return;
  }

  const captions = splitHtml[1].split(',"videoDetails')[0].replace("\n", "");
  const captionTracks =
    JSON.parse(captions).playerCaptionsTracklistRenderer.captionTracks;
  const languages = Array.from(captionTracks).map((i) => {
    return i.name.simpleText;
  });

  languages.sort((x, y) => {
    return x == mainLang ? -1 : y == mainLang ? 1 : 0;
  });

  const langOptions = languages?.map((name) => {
    return {
      language: name,
      link: captionTracks.find((i) => i.name.simpleText === name).baseUrl,
    };
  });

  const selectedLang = langOptions?.filter(
    (lang) => lang.language === mainLang
  );
  transcriptFailed = selectedLang.length < 1;

  if (transcriptFailed) return;
  await getTranscript(selectedLang[0].link);
};

const getTranscript = async (link) => {
  const rawTranscript = await getRawTranscript(link).catch((err) => {
    transcriptFailed = true;
    return;
  });
  if (transcriptFailed) return;

  const transcriptText = rawTranscript
    ?.map((item) => {
      return item.text;
    })
    ?.join(" ")
    .replace(/[\n\r\s\t]+/g, " ");

  //double the chunk size if transcript length > 20000

  let chunk_size;
  if (transcriptText.length > 20000) chunk_size = 4000;
  else chunk_size = 2000;

  const chunkedTranscript = chunkString(transcriptText, chunk_size);

  await getFinalSummary(chunkedTranscript);
};

const getFinalSummary = async (transcript) => {
  let summaries = [];

  for (let i = 0; i < transcript.length; i++) {
    prompt =
      i === 0
        ? "Summarize the following text precisely as a section of a transcript: " +
          transcript[i]
        : "Summarize this in addition to the previous summary prompt: " +
          transcript[i];

    const summaryChunks = await getSummary(prompt);
    summary.push(summaryChunks);
  }

  const joinedSummaryChunks = summary.join(",");

  if (summaries.length > 1) {
    finalSummary = await getSummary(
      "Get the final summary of these summarized sections: " +
        joinedSummaryChunks
    );
  } else if (summaries.length < 1) {
    summaryFailed = true;
  } else {
    finalSummary = summaries[0];
  }

  if (finalSummary && !summaryFailed) {
    const summarySection = document.querySelector(".summary-section");
    const finalSummaryEl = document.createElement("p");

    summarySection.appendChild(finalSummaryEl);
    finalSummaryEl.innerText = finalSummary;
    loading = false
  }

  return finalSummary;
};

const getRawTranscript = async (link) => {
  //fetch tanscript
  const tsPage = await fetch(link);

  const tsHtml = await tsPage.text().then((_html) => {
    return _html;
  });

  // Parse Transcript
  const parseTs = parseHTML(tsHtml);
  const tsNodes = parseTs.childNodes[1].childNodes;

  const timeStampedTranscipt = Array.from(tsNodes).map((i) => {
    return {
      start: i.getAttribute("start"),
      duration: i.getAttribute("dur"),
      text: i.textContent,
    };
  });

  return timeStampedTranscipt;
};

const getSummary = async (prompt) => {
  let request = {
    model: "text-davinci-003",
    prompt: prompt.replace(/\\n/g, "").replace(/\n/g, "") + " ",
    max_tokens: 2048,
    // user: "1",
    temperature: 0.5,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    // stop: ["#", ";"]
  };

  const body = JSON.stringify(request);

  let fetchedSummary = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + OPENAI_API_KEY,
    },
    body: body,
  })
    .then((response) => {
      return response.json().then((res) => res.choices[0].text);
    })
    .catch((error) => console.log("Error:", error));

  return fetchedSummary;
};

const chunkString = (str, size) => {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }

  return chunks;
};

const parseHTML = (html) => {
  var t = document.createElement("template");
  t.innerHTML = html;
  return t.content;
};
