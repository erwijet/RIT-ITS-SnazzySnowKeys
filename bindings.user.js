// ==UserScript==
// @name         SNow Snippets
// @namespace    help.rit.edu
// @version      1.2
// @description  add helpful snippets that can be expanded with key patterns
// @author       Tyler Holewinski (tshhelp)
// @match        https://help.rit.edu/*
// @icon         https://www.google.com/s2/favicons?domain=service-now.com
// @updateURL    https://github.com/erwijet/RIT-ITS-SnazzySnowKeys/raw/master/bindings.user.js
// @downloadURL  https://github.com/erwijet/RIT-ITS-SnazzySnowKeys/raw/master/bindings.user.js
// @grant        none
// ==/UserScript==

// Author Contact:
// email: tsh6656@rit.edu
// linkedin: linkedin.com/in/tylerholewinski
// github: github.com/erwijet

// Motivation:
// Often times when writing reponses to tickets, there are specific sections of text you repeat over and over,
// yet, you may not want to create a template because you only want to quickly insert a sentence and don't want
// leave the keyboard. This is where Snippets shine. In the object SNIPPETS, you can defined a set of text expansions
// that will automatically trigger whenever the trigger expansion is typed. For example, typing \iyhafq would
// insert "If you have any further questions, please feel free to reach out to the Service Center by giving us a call at (585) 475-5000 or by starting a live chat at help.rit.edu"
// It will, also of course, delete the trigger text.

// Please understand:
// This user script works by recording a brief number of your last keystrokes. The number of keystrokes stored is equal to the longest possible trigger in the SNIPPETS object.
// of course, these keystrokes aren't sent anywhere or used at all outside this script for the above purposes, but it is worth nothing the behavior.

// Technical Explination:
// this script regsiters a listener to the keyup event on the document object. Each time a key is pressed it is added to a list of keypresses. The list will auto-remove the oldest
// element if the size of the list is greater than the longest possible trigger. Each snippet object is tested against the history of key presses to see if a trigger has been matched.
// If it has, the current element is selected by recursivly iterating through the iframes on the page. The text of the current element is set to delete the last n characters where n
// is the length of the snippet trigger, and then to append the trigegr expansion text. Once this process is complete, no more triggers will be tested until another key is called.
// The history array of keystrokes is also wiped every time a snippet is triggered.

// Array of snippets:
// feel free to edit these to include your own :D
// object verification will occur on page load
const SNIPPETS = [
    {
        trigger: "\\close",
        expansion: "If you have any further questions, please feel free to reach out to the Service Center by giving us a call at (585) 475-5000 or by starting a live chat at help.rit.edu\n\nHave a lovely day,\nRIT Service Center"
    },
    {
        trigger: "\\qwe",
        expansion: "If you have any further questions, please feel free to reach out to the Service Center by giving us a call at (585) 475-5000 or by starting a live chat at help.rit.edu"
    },
    {
        trigger: "\\have",
        expansion: "Have a lovely day,\nRIT Service Center"
    },
    {
        trigger: "\\hel",
        expansion: "Hello!\n\nThank you so much for reaching out to the Service Center"
    },
    {
        trigger: "\\num",
        expansion: "(585) 475-5000"
    },
    {
        trigger: "\\g",
        expansion: "give us a call"
    },
    {
        trigger: "\\vi",
        expansion: "verify your identity"
    },
    {
        trigger: "\\t",
        expansion: "Thanks!\nRIT Service Center"
    },
    {
        trigger: "\\e",
        expansion: "escalating per"
    },
    {
        trigger: "\\codes",
        expansion: "ID verified over zoom\nstudent id + external email, bday, zip"
    }
];

// ==BEGIN== //

const maxTriggerLen = Math.max(...SNIPPETS.map(e => e.trigger?.length ?? 0));
const keystrokeHistory = [];

var getActiveElement = function( document ){
     document = document || window.document;

     if( document.body === document.activeElement
        || document.activeElement.tagName == 'IFRAME' ){
         const iframes = document.getElementsByTagName('iframe');
         for (let i = 0; i < iframes.length; i++) {
             const focused = getActiveElement(iframes[i].contentWindow.document);
             if (focused !== false) {
                 return focused;
             }
         }
     }

    else {
        return document.activeElement;
    }
};

function keystrokeHistoryAppend(char) {
    keystrokeHistory.push(char);
    if (keystrokeHistory.length > maxTriggerLen) {
        keystrokeHistory.shift(); // remove oldest element off
    }
}

function validateSnippetObject() {
    let valid = true;
    SNIPPETS.forEach(snippet => {
        if (!snippet.trigger || !snippet.expansion) {
            valid = false;
            alert("USERSCRIPT ERROR: the following snippet is invalid: " + JSON.stringify(snippet));
            throw new Error("USERSCRIPT ERROR: the following snippet is invalid: " + JSON.stringify(snippet));
        }
    });
    return valid;
}

function performSnippet(snippet) {
    const target = getActiveElement();

    let ptr = target.selectionStart;
    while (target.value[ptr] == ' ')
        if (--ptr < 0) return;

    const newText = target.value.substring(0, ptr - snippet.trigger.length) + snippet.expansion + target.value.substring(ptr);

    target.value = newText;
}

function doc_keyUp(e) {
    keystrokeHistoryAppend(e.key);

    for (let snippet of SNIPPETS) {
        if (keystrokeHistory.reduce((acc, e) => acc + e, '').includes(snippet.trigger)) {
            performSnippet(snippet);
            keystrokeHistory.clear();
            return;
        }
    }
}

(function() {
    if (!validateSnippetObject()) return;
    document.addEventListener('keyup', doc_keyUp, false);
})();
