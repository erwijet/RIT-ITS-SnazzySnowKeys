// ==UserScript==
// @name         SNow Bindings
// @namespace    help.rit.edu
// @version      1.1
// @description  add helpful custom keybindings that can add snippets thatk be expanded with key patterns, as well as hotkeys
// @author       Tyler Holewinski (tshhelp)
// @match        https://help.rit.edu/*
// @icon         https://www.google.com/s2/favicons?domain=service-now.com
// @grant        none
// ==/UserScript==

const ActionVerbs = [
    {
        indicator: 'newtab',
        run: ([caller, url, ..._]) => window.open(url, '_blank'),
    },
    {
        indicator: 'expand',
        run: ([caller, ...text]) => {
            const str = text.reduce((acc, elem, i) => acc += elem + elem + (i < text.length - 1) ? ' ' : '');

            // pass data to delput to handle actual expansion
            for (let actionVerb of ActionVerbs) {
                if (actionVerb == 'delput')
                    actionVerb.run(caller, caller.trigger, text);
            }
    }
    {
        indicator: 'delput',
        run: ([caller, deleted, expanded, ..._]) => {
            const target = getActiveElement();
            const newText = target.value.substring(0, target.selectionStart - deleted.length) + expanded + target.value.substring(target.selectionStart);
            target.value = newText;
        }
    }
];

const PLACEHOLDERS = [
    {
        indicator: '<current_url>',
        resolve: (snippet) => window.location.href,
    },
    {
        indicator: '<trigger>',
        resolve: (snippet) => snippet.trigger
    },
    {
        indicator: '<last_word>',
        resolve: (snippet) => {
            const target = getActiveElement();
        }
    },
    {
        indicator: '<selection>',
        resolve: (snippet) => {
            const target = getActiveElement();
            return target.value.substring(target.selectionStart, target.selectionEnd - target.seletionStart);
        }
    }
];

const BINDINGS = [
    {
        trigger: '\\close',
        result: 'expand If you have any further questions, please feel free to reach out to the Service Center by giving us a call at (585) 475-5000 or by starting a live chat at help.rit.edu\n\nHave a lovely day,\nRIT Service Center',
    },
    {
        trigger: '\\have',
        result: 'expand Have a lovely day,\nRIT Service Center',
    },
    {
        trigger: '\\hi',
        result: 'expand Hello!\n\nThank you so much for reaching out to the Service Center.',
    },
    {
        trigger: '\\num',
        result: 'expand (585) 475-5000',
    },
    {
        trigger: '\\g',
        result: 'expand give us a call',
    },
    {
        trigger: '\\vi',
        result: 'expand verify your identity',
    },
    {
        trigger: '\\t',
        result: 'expand Thanks!\nRIT Service Center',
    },
    {
        trigger: '\\e',
        result: 'expand escalating per',
    },
    {
        trigger: '\\codes',
        result: 'expand ID verified over zoom\nstudent id + external email, bday, zip',
    },
    {
        trigger: '\\ol',
        result: 'newtab <current_url>',
    },
    {
        trigger: '\\lkb',
        result: 'deleteandwrite <trigger><last_word> (<last_word>)[https://help.rit.edu/kb_view.do?sysparm_article=<last_word>]'
    },
    {
        trigger: '\\sg',
        result: 'newtab https://help.rit.edu/nav_to.do?uri=/$sn_global_search_results.do?sysparm_search=<clipboard>',
    },
];

const maxTriggerLen = Math.max(...BINDINGS.map((e) => e.trigger?.length ?? 0));
const keystrokeHistory = [];

var getActiveElement = function (document) {
    document = document || window.document;

    if (
        document.body === document.activeElement ||
        document.activeElement.tagName == 'IFRAME'
    ) {
        const iframes = document.getElementsByTagName('iframe');
        for (let i = 0; i < iframes.length; i++) {
            const focused = getActiveElement(iframes[i].contentWindow.document);
            if (focused !== false) {
                return focused;
            }
        }
    } else {
        return document.activeElement;
    }
};

function keystrokeHistoryAppend(char) {
    keystrokeHistory.push(char);
    if (keystrokeHistory.length > maxTriggerLen) {
        keystrokeHistory.shift(); // remove oldest element
    }
}

function validateBindingsObject() {
    for (let binding of BINDINGS) {
        if (
            !Object.values(BindingType).includes(binding.type) ||
            !binding.trigger ||
            !binding.result
        ) {
            const err =
                'USERSCRIPT ERROR: the following binding is invalid: ' +
                JSON.stringify(binding);

            alert(err);
            throw err;
        }
    }
}

async function hydrateBinding(binding) {
    const hydrated = { ...binding };
    for (let placeholder of PLACEHOLDERS) {
        if (hydrated.result.includes(placeholder.indicator))
            hydrated.result = hydrated.result.replace(
                placeholder.indicator,
                await placeholder.resolve(hydrated)
            );
    }

    return hydrated;
}

async function resolveBinding(binding) {
    binding = await hydrateBinding(binding);
    const [ verbIndicator, args ] = binding.result.split(' ');
    for (let verb of ActionVerbs) {
            if (verb.indicator == verbIndicator) {
                verb.run([ binding, ...args]);
                return;
            }
        }
    }
}

function doc_keyUp(e) {
    keystrokeHistoryAppend(e.key);

    for (let binding of BINDINGS) {
        if (
            keystrokeHistory
                .reduce((acc, e) => acc + e, '')
                .includes(binding.trigger)
        ) {
            resolveBinding(binding);
            keystrokeHistory.clear();
            return;
        }
    }
}

(function () {
    validateBindingsObject();
    document.addEventListener('keyup', doc_keyUp, false);
})();
