import { getTranscriptLink } from "./transcript";
import { transcriptFailed, summaryFailed, loading } from "../contentScript";

let summaryBtnClick = false;
let ytactionBtn = "";
let ytSecondary = "";

export const createAndAppendEl = (elName, appendTo, className, value, url) => {
  const elCreated = document.createElement(elName);
  if (appendTo) {
    appendTo.appendChild(elCreated);
  }
  if (className) [(elCreated.className = className)];
  if (value) {
    elCreated.innerText = value;
  }
  if (url) {
    elCreated.src = chrome.runtime.getURL(url);
  }
  return elCreated;
};

export const setElOnPage = async () => {
  loading = true;
  const summaryBtnExists = document.getElementsByClassName("summary-btn")[0];
  const summarySectionExists =
    document.getElementsByClassName("summary-section")[0];

  if (!summaryBtnExists) {
    const summaryBtn = document.createElement("div");
    const summaryText = document.createTextNode("Summarize");
    const summaryIcon = document.createElement("img");

    summaryIcon.src = chrome.runtime.getURL("assets/btn-icon.png");

    summaryBtn.className = "summary-btn";
    summaryBtn.appendChild(summaryText);
    summaryBtn.appendChild(summaryIcon);

    ytactionBtn = document.querySelector(
      "#actions #top-level-buttons-computed"
    );
    ytactionBtn?.appendChild(summaryBtn);

    if (!summaryBtnClick) {
      summaryBtn.addEventListener("click", (e) => {
        getTranscriptLink();
        summaryBtnClick = true;
      });
    }
  }

  if (!summarySectionExists) {
    const summarySection = createAndAppendEl("div", "", "summary-section");
    const topSection = createAndAppendEl("div", summarySection, "top-section");
    createAndAppendEl("p", topSection, "", "Summarize");
    createAndAppendEl("img", topSection, "", "", "assets/settings-icon.svg");

    if (loading && !transcriptFailed && !summaryFailed) {
      createAndAppendEl("div", topSection, "dot-pulse", "");
    }

    if (transcriptFailed || summaryFailed) {
    }

    ytSecondary = document.querySelector("#secondary");
    ytSecondary?.prepend(summarySection);
  }
};
