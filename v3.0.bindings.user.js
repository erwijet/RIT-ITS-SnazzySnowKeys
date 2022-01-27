// ==UserScript==
// @name         SNow Bindings (3.0) (stable)
// @namespace    help.rit.edu
// @version      3.0
// @description  add helpful custom keybindings that can add snippets that can be expanded with key patterns, as well as hotkey actions
// @author       Tyler Holewinski (tshhelp)
// @match        https://help.rit.edu/*
// @match        https://ritstage.service-now.com/*
// @icon         https://www.google.com/s2/favicons?domain=service-now.com
// @require  	   https://raw.githubusercontent.com/zurb/tribute/master/dist/tribute.min.js
// @resource     TRIBUTE_CSS https://raw.githubusercontent.com/zurb/tribute/master/dist/tribute.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
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
        while (target.value[ptr] != ' ' && target.value[ptr] != '\n' && ptr > 0) ptr--;

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

        if (!deleteLength) {
            if (target.value.length <= snippet.trigger.length) {
                deleteLength = target.value.length;
            } else {
                let ptr = target.selectionStart;
                while (target.value[ptr] != ' ' && target.value[ptr] != '\n') ptr--;
                deleteLength = (target.selectionStart - 1) - ptr;
                console.log(deleteLength);
            }
        }

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
    wrap: (snippet) => {
        let { args } = { ...snippet };
        for (let key of Object.keys(args)) {
            if (typeof args[key] == 'function')
                args[key] = args[key]();
        }

        const lastWord = Util.getWordBehindCaret(snippet);
        let { varName, expansion } = args;

        Actions.expand({
            trigger: { ...snippet }.trigger,
            args: {
                deleteLength: snippet.trigger.length + lastWord.length + 1, // plus 1 to account for space between last word and trigger
                expansion: expansion.replaceAll(varName, lastWord)
            }
        });
    }
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
                'ID verified over zoom\nstudent id + external email, bday, zip',
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
        trigger: '\\direc',
        action: Actions.newtab,
        desc: () => {
            const expr = Util.getWordBehindCaret({ trigger: '\\direc' });
            return `Opens the RIT Directory page & attempts to match "${expr}"`;
        },
        args: {
            url: () => {
                const expr = Util.getWordBehindCaret({ trigger: '\\direc' });
                const BASE_URL = 'https://duckduckgo.com/?q=!ducky+rit+directory+';
                return BASE_URL + expr;
            }
        }
    },
    {
        trigger: '\\dup',
        desc: "Duplicate the current tab",
        action: Actions.newtab,
        args: {
            url: window.location.href,
        },
    },
    {
        trigger: '\\okb',
        action: Actions.newtab,
        args: {
            url: () => {
                const kb = Util.getWordBehindCaret({ trigger: '\\okb' });
                return `https://help.rit.edu/kb_view.do?sysparm_article=${kb}`;
            },
        }
    },
    {
        trigger: '\\lkb',
        action: Actions.wrap,
        args: {
            varName: "@__kb",
            expansion: () => '[@__kb](https://help.rit.edu/kb_view.do?sysparm_article=@__kb)'
        },
    },
    {
        trigger: '\\lekb',
        action: Actions.wrap,
        args: {
            varName: '@__kb',
            expansion: () => 'escalating per [@__kb](https://help.rit.edu/kb_view.do?sysparm_article=@__kb)'
        }
    },
    {
        trigger: '\\sg',
        action: Actions.newtab,
        desc: () => {
            const query = Util.getWordBehindCaret({ trigger: '\\sg' });
            return `Search "${query}" in ServiceNow`;
        },
        args: {
            url: () => {
                const query = Util.getWordBehindCaret({ trigger: '\\sg' });
                return `https://help.rit.edu/nav_to.do?uri=/$sn_global_search_results.do?sysparm_search=${query}`;
            },
        },
    },
    {
        trigger: "\\ltn",
        action: Actions.wrap,
        args: {
            varName: '@__tn',
            expansion: 'see [@__tn](https://help.rit.edu/text_search_exact_match.do?sysparm_search=@__tn)'
        }
    },
    {
        trigger: "\\claws",
        action: Actions.newtab,
        desc: () => {
            const query = Util.getWordBehindCaret({ trigger: "\\claws" });
            return `Perform a CLAWS username search for "${query}"`;
        },
        args: {
            url: () => {
                const query = Util.getWordBehindCaret({ trigger: "\\claws" });
                return `https://claws.rit.edu/users/useredit.php?ACTION=GET&USERNAME=${query}`;
            }
        }
    },
    {
        trigger: "\\?",
        action: Actions.newtab,
        desc: "View all avalible snippets/commands",
        args: {
            url: "https://github.com/erwijet/RIT-ITS-SnazzySnowKeys"
        }
    },
    {
        trigger: "\\sign",
        action: Actions.expand,
        args: {
            expansion: "\nIf you have any further questions, please feel free to reach out to the Service Center by giving us a call at (585) 475-5000 or by starting a live chat at [help.rit.edu](https://help.rit.edu)\n\nHave a lovely day,\nRIT Service Center"
        }
    }
];

const maxTriggerLen = Math.max(...SNIPPETS.map((e) => e.trigger?.length ?? 0));
const elemsInited = [];
const keystrokeHistory = [];

function keystrokeHistoryAppend(char) {
    keystrokeHistory.push(char);
    if (keystrokeHistory.length > maxTriggerLen) {
        keystrokeHistory.shift(); // remove oldest element
    }
}

function doc_keyUp(e) {
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

function getWrapSnippetDesc(snippet) {
    if (snippet.action !== Actions.wrap) {
        alert('call to getWrapSnippetDesc with a non-wrap snippet');
        return '(No Description)';
    }

    let { args } = { ...snippet };
    for (let key of Object.keys(args)) {
        if (typeof args[key] == 'function')
            args[key] = args[key]();
    }

    const lastWord = Util.getWordBehindCaret(snippet);
    let { varName, expansion } = args;

    return `<em>${expansion.replaceAll(varName, '<strong>' + lastWord + '</strong>')}</em>`;
}

function getActionType(action) {
    if (action === Actions.expand)
        return 'Expansion';
    else if (action === Actions.wrap)
        return 'Text Wrapping'
    else return 'Action'
}

// init Tribute if ActiveElement is not configed
function doc_mouseup(e) {
    const curElem = Util.getActiveElement();
    if (!curElem) return; //

    const ALLOWED_IDS = [
        'activity-stream-work_notes-textarea',
        'activity-stream-comments-textarea',
        'sc_task.request_item.comments',
        'sc_task.work_notes',
        'incident.comments',
        'new_call.u_special_instructions',
        'incident.work_notes'
    ];

    if (!ALLOWED_IDS.includes(curElem.id) || elemsInited.includes(curElem.id)) return; // invalid ID or already inited

    elemsInited.push(curElem.id);

    const tribute = new Tribute({
        trigger: "\\",
        menuItemLimit: SNIPPETS.length,
        values: SNIPPETS.map(snippet => ({
            snippet,
            // if the snippet is expandable, then allow fuzzy searching by trigger OR by expansion text (t.y. Seth)
            key: snippet.trigger + ((snippet.action == Actions.expand || snippet.action == Actions.wrap) ? (" " + snippet.args.expansion) : ""),
            value: snippet.trigger
        })),
        menuItemTemplate: item => {
            let { trigger, action, args, desc } = item.original.snippet;
            if (typeof desc === 'undefined') {
                if (action === Actions.wrap)
                    desc = getWrapSnippetDesc(item.original.snippet);
                else if (action == Actions.expand) {
                    desc = args.expansion;
                }
            }

            return `<strong>${trigger}</strong>&nbsp&nbsp<tt>${getActionType(action)}</tt><br /><em>${typeof desc == 'function' ? desc() : (desc ?? '(No Description)')}</em>`
        },
        selectTemplate: item => {
            const { snippet } = item.original;
            snippet.action(snippet);
            return '';
        }
    });

    Util.getActiveElement().classList.add('mentionable');
    tribute.attach(Util.getActiveElement());
}

(function () {
    GM_addStyle(GM_getResourceText("TRIBUTE_CSS"));
    document.addEventListener('keyup', doc_keyUp, false);
    document.addEventListener('mouseup', doc_mouseup);
})();
