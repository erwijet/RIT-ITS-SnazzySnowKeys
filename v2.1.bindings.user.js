// ==UserScript==
// @name         SNow Bindings v2.1 (unstable)
// @namespace    help.rit.edu
// @version      2.2
// @description  add helpful custom keybindings that can add snippets thatk be expanded with key patterns, as well as hotkeys
// @author       Tyler Holewinski (tshhelp)
// @match        https://help.rit.edu/*
// @match        https://ritstage.service-now.com/*
// @match        https://help.rit.edu/now/workspace/agent/*
// @downloadURL  https://github.com/erwijet/RIT-ITS-SnazzySnowKeys/raw/master/v2.1.bindings.user.js
// @updateURL    https://github.com/erwijet/RIT-ITS-SnazzySnowKeys/raw/master/v2.1.bindings.user.js
// @icon         https://www.google.com/s2/favicons?domain=service-now.com
// @grant        none
// ==/UserScript==

class Util {
    static getWordBehindCaret(snippet) {
        const target = Util.getActiveElement();
        if (!target) {
            alert('call to getWordBehindCaret returning none (no focus)');
            return '';
        }

        let word = '';
        let ptr = target.selectionStart - 1;

        while (target.value[ptr] == ' ') {
            console.log('pointing at ' + target.value[ptr] + ', @' + ptr, 'matches space... advancing');
            ptr--;
        }

        console.log('pointing at ' + target.value[ptr] + ', @' + ptr, 'no match to space... continuing');

        ptr -= snippet.trigger.length;

        console.log('pointing at ' + target.value[ptr] + ', @' + ptr, 'jumped past trigger... continuing');

        while (target.value[ptr] == ' ') {
            console.log('pointing at ' + target.value[ptr] + ', @' + ptr, 'matches space... advancing');
            ptr--;
        }

        console.log('pointing at ' + target.value[ptr] + ', @' + ptr, 'no match to space... continuing');

        while (target.value[ptr] != ' ' && target.value[ptr] != '\n' && ptr >= 0) {
            console.log('pointing at ' + target.value[ptr] + ', @' + ptr, 'no match to space... adding to lastWord', 'lastWord: ' + word);
            word = target.value[ptr--] + word;
            console.log('last word: ', word);
        }

        return word;
    }

    static getActiveElement(document) {
        document = document || window.document;

        if (
            document.body === document.activeElement ||
            document.activeElement.tagName == 'IFRAME'
        ) {
            const iframes = document.getElementsByTagName('iframe');
            for (let i = 0; i < iframes.length; i++) {
                const focused = Util.getActiveElement(
                    iframes[i].contentWindow.document
                );
                if (focused !== false) {
                    return focused;
                }
            }
        } else {
            return document.activeElement;
        }
    }

    static getCharsFromCursorToEndOfLastWord(snippet, includeTrigger) {
        const target = Util.getActiveElement();
        if (!target) return 0;

        let len = includeTrigger ? snippet.trigger.length : 0;
        let ptr = target.selectionStart - 1;

        while (target.value[ptr] == ' ') {
            ptr--;
            len++;
        }

        ptr -= snippet.trigger.length;

        while (target.value[ptr] == ' ') {
            ptr--;
            len++;
        }

        while (
            target.value[ptr] != ' ' &&
            target.value[ptr] != '\n' &&
            ptr >= 0
        ) {
            ptr--;
            len++;
        }

        return len;
    }
}

const Actions = {
    expand: (snippet) => {
        // make sure we don't actually modify SNIPPETS object
        let { deleteLength, expansion } = { ...snippet }?.args;


        if (typeof deleteLength == 'function')
            deleteLength = deleteLength();
        if (typeof expansion == 'function')
            expansion = expansion();

        const target = Util.getActiveElement();
        if (!target) return;

        target.value =
            target.value.substring(0, target.selectionStart - (deleteLength ?? snippet.trigger.length)) +
            expansion +
            target.value.substring(target.selectionStart);
    },
    newtab: (snippet) => {
        const { trigger, args } = { ...snippet };
        let { url } = args;

        if (typeof url == 'function')
            url = url();

        Actions.expand({ trigger, args: { expansion: '' } }); // expand to nothing (i.e. delete trigger text)
        window.open(url, '_blank');
    },
};

const SNIPPETS = [
    {
        trigger: '\\close',
        action: Actions.expand,
        args: {
            expansion:
                'If you have any further questions, please feel free to reach out to the Service Center by giving us a call at (585) 475-5000 or by starting a live chat at help.rit.edu\n\nHave a lovely day,\nRIT Service Center',
        },
    },
    {
        trigger: '\\have',
        action: Actions.expand,
        args: {
            expansion: 'Have a lovely day,\nRIT Service Center',
        },
    },
    {
        trigger: '\\hi',
        action: Actions.expand,
        args: {
            expansion:
                'Hello!\n\nThank you so much for reaching out to the Service Center.',
        },
    },
    {
        trigger: '\\num',
        action: Actions.expand,
        args: {
            expansion: '(585) 475-5000',
        },
    },
    {
        trigger: '\\g',
        action: Actions.expand,
        args: {
            expansion: 'give us a call',
        },
    },
    {
        trigger: '\\vi',
        action: Actions.expand,
        args: {
            expansion: 'verify your identity',
        },
    },
    {
        trigger: '\\t',
        action: Actions.expand,
        args: {
            expansion: 'Thanks!\nRIT Service Center',
        },
    },
    {
        trigger: '\\ep',
        action: Actions.expand,
        args: {
            expansion: 'escalating per',
        },
    },
    {
        trigger: '\\codes',
        action: Actions.expand,
        args: {
            expansion:
                'expand ID verified over zoom\nstudent id + external email, bday, zip',
        },
    },
    {
        trigger: '\\ol',
        action: Actions.newtab,
        args: {
            url: window.location.href,
        },
    },
    {
        trigger: '\\lkb',
        action: Actions.expand,
        args: {
            deleteLength: () => Util.getCharsFromCursorToEndOfLastWord({ trigger: '\\lkb' }, true),
            expansion: () => {
                const kb = Util.getWordBehindCaret({ trigger: '\\lkb' });
                return `[${kb}](https://help.rit.edu/kb_view.do?sysparm_article=${kb})`;
            },
        },
    },
    {
        trigger: '\\lekb',
        action: Actions.expand,
        args: {
            deleteLength: () => Util.getCharsFromCursorToEndOfLastWord({ trigger: '\\lekb' }, true ),
            expansion: () => {
                const kb = Util.getWordBehindCaret({ trigger: '\\lekb' });
                return `escalating per [${kb}](https://help.rit.edu/kb_view.do?sysparm_article=${kb})`;
            }
        }
    },
    {
        trigger: '\\sg',
        action: Actions.newtab,
        args: {
            url: () => {
                const query = Util.getWordBehindCaret({ trigger: '\\sg' });
                return `https://help.rit.edu/nav_to.do?uri=/$sn_global_search_results.do?sysparm_search=${query}`;
            },
        },
    }
];

const maxTriggerLen = Math.max(...SNIPPETS.map((e) => e.trigger?.length ?? 0));
const keystrokeHistory = [];

function keystrokeHistoryAppend(char) {
    keystrokeHistory.push(char);
    if (keystrokeHistory.length > maxTriggerLen) {
        keystrokeHistory.shift(); // remove oldest element
    }
}

function doc_keyUp(e) {
    keystrokeHistoryAppend(e.key);

    for (let snippet of SNIPPETS) {
        if (
            keystrokeHistory
                .reduce((acc, e) => acc + e, '')
                .includes(snippet.trigger)
        ) {
            snippet.action(snippet);
            keystrokeHistory.clear();
            return;
        }
    }
}

(function () {
    document.addEventListener('keyup', doc_keyUp, false);
})();
