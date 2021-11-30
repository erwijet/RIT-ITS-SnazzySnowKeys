// ==UserScript==
// @name         SNow Bindings (2.2) (stable)
// @namespace    help.rit.edu
// @version      2.2
// @description  add helpful custom keybindings that can add snippets thatk be expanded with key patterns, as well as hotkeys
// @author       Tyler Holewinski (tshhelp)
// @match        https://help.rit.edu/*
// @match        https://ritstage.service-now.com/*
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

        // jump past any spaces between cursor and when trigger was typed (sometimes there is an additional space if user is typing quickly)

        while (target.value[ptr] == ' ') ptr--;

        // jump past the length of the trigger
        ptr -= snippet.trigger.length;

        // jump past any spaces between last word and the trigger (ex. LASTWORD \trigger)
        //                                                        (            ^        )
        while (target.value[ptr] == ' ') ptr--;

        // any character should now be added to the "last word" until we run out of characters or encouter whitespace
        while (target.value[ptr] != ' ' && target.value[ptr] != '\n' && ptr >= 0) word = target.value[ptr--] + word;

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

    static getTicketNumber() {
        return document.querySelector('#sys_displayValue').value;
    }
}

const Actions = {
    expand: (snippet) => {
        // make sure we don't actually modify SNIPPETS object
        let { deleteLength, expansion } = { ...snippet }?.args;

        // deleteLength and expansion can either be explicit numbers, or functions to evaluate to a number at expand-time
        // if they are functions, evalute them here...
        if (typeof deleteLength == 'function')
            deleteLength = deleteLength();
        if (typeof expansion == 'function')
            expansion = expansion();

        // assert a valid input is focused
        const target = Util.getActiveElement();
        if (!target) return;


        const curText = target.value;

        const newText =
            target.value.substring(0, target.selectionStart - (deleteLength ?? snippet.trigger.length)) +
            expansion +
            target.value.substring(target.selectionStart);

        target.value = newText;
    },
    newtab: (snippet) => {
        const { trigger, args } = { ...snippet };
        let { url } = args ?? { url: () => { alert("no url specified!"); return "" } }; // lol. I know its a lot but its late and I think it's fancy

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
        trigger: '\\thx',
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
        trigger: '\\tn',
        action: Actions.expand,
        args: {
            expansion: () => Util.getTicketNumber()
        }
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
    },
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
