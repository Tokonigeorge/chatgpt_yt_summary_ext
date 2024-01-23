 'use strict';

import { setElOnPage } from './build/elements'

 export let transcriptFailed = false
 export let summaryFailed = false
 export let loading = false

(() => {

    let currentVideo = ''

    //listen to the message sent by the background script
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, value, videoId } = obj
        
        if (type === 'NEW') {
            currentVideo = videoId;
            setElOnPage()
        }
    });
    

}
)();

