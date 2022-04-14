// ==UserScript==
// @name         SNow Bindings 3.* (unstable)
// @namespace    help.rit.edu
// @version      3.1
// @description  add helpful custom keybindings that can add snippets that can be expanded with key patterns, as well as hotkey actions
// @author       Tyler Holewinski (tshhelp)
// @match        https://help.rit.edu/*
// @match        https://ritstage.service-now.com/*
// @icon         https://www.google.com/s2/favicons?domain=service-now.com
// @require  	 https://raw.githubusercontent.com/zurb/tribute/master/dist/tribute.min.js
// @resource     TRIBUTE_CSS https://raw.githubusercontent.com/zurb/tribute/master/dist/tribute.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

/* global Tribute */
/* global GlideModal */

/* eslint curly: "off" */

// NOTE: any refs to __tmus or __tmus_snowbindings3 (tampermonkey userscript) are prefixed as such to indicate their source of origin
// any DOM / globalThis modifications should follow this convention. however it is also used as a tampermonkey value store indicator

const USERSNIPPETS_KEY = '__tmus_snowbindings3-1_user_snippets';
const SNIPPET_REGEX = /^([a-zA-Z]|_)+$/;

// true if script is loaded in the Agent Workspace
const isAW = window.location.href.includes('now/workspace');

let g_tribute;

class Util {

    static getActiveElement(document) {
        if (isAW)
            return Util._getActiveElement_agentworkspace(document);
        else
            return Util._getActiveElement_standard(document);
    }

    /**
     * this method should only be called by Util.getActiveElement/1
    */
    static _getActiveElement_standard(document) {
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

    /**
     * this method should only be called by Util.getActiveElement/1
    */
    static _getActiveElement_agentworkspace(root) {
        root ||= window.document;
        const activeEl = root.activeElement;

        if (!activeEl) {
            return null;
        }

        if (activeEl.shadowRoot) {
            return Util.getActiveElement(activeEl.shadowRoot);
        } else {
            return activeEl;
        }
    }

    static getTicketNumber() {
        return document.querySelector('#sys_displayValue').value;
    }

    // SERVICE NOW UTILITIES

    static async snow_getRecordByNumber(number) {
        return new Promise((resolve, reject) => {
            const recordType = number.substr(0, 3) == 'INC' ? 'incident' : 'sc_task';
            const ticketGr = new GlideRecord(recordType);

            ticketGr.addQuery('number', number); // lookup current ticket
            ticketGr.query(ticketGrRes => {
                if (ticketGrRes.next()) { // check query result has data
                    resolve(ticketGrRes);
                } else {
                    alert('yikes! could not find a user for this ticket :/');
                    reject(ticketGrRes);
                }
            });
        });
    }

    static async snow_getSysIdByNumber(number) {
        const record = await Util.snow_getRecordByNumber(number);
        return record.getValue('sys_id');
    }
}

const USERSNIPPETS_DEFAULTS = {
    close: 'If you have any further questions, please feel free to reach out to the Service Center by giving us a call at (585) 475-5000 or by starting a live chat at [help.rit.edu](https://help.rit.edu).\n\nHave a lovely day,\nRIT Service Center',
    have: 'Have a lovely day,\nRIT Service Center',
    hi: 'Hello!\n\nThank you so much for reaching out to the Service Center.',
    num: '(585) 475-5000',
    g: 'give us a call',
    vi: 'verify your identity',
    thx: 'Thanks!\nRIT Service Center',
    ep: 'escalating per',
    codes: 'ID verified over zoom\nstudent id + external email, bday, zip',
}

/**
 * these are non-user-editable snippets that provide functionality by executing code when invoked.
*/
const SNIPPETS = [
    {
        trigger: '\\tn',
        desc: Util.getTicketNumber(),
        onExpand: () => Util.getTicketNumber()
    },
    {
        trigger: '\\direc',
        nParams: 2,
        paramNames: "{name}",
        desc: "If provided, searches the RIT directory for the given names. Otherwise just opens the directory",
        onExpand: (self, ...params) => {
            const BASE_URL = 'https://duckduckgo.com/?q=!ducky+rit+directory+';
            window.open(BASE_URL + params.reduce((acc, cur) => ( acc += (cur ?? "") ), ""));
            return '';
        }
    },
    {
        trigger: '\\dup',
        desc: "Duplicates the current tab",
        onExpand: () => {
            window.open(window.location.href);
            return '';
        }
    },
    {
        trigger: '\\okb',
        nParams: 1,
        paramNames: "{kb number}",
        desc: "Opens {kb number} in a new tab",
        onExpand: (self, ...params) => {
            const [ kb ] = params;
            if (!!kb) window.open(`https://help.rit.edu/kb_view.do?sysparm_article=${kb}`);
            return '';
        }
    },
    {
        trigger: "\\ekb",
        nParams: 1,
        paramNames: "{kb number}",
        desc: "Links {kb number} as a escalation reference",
        onExpand: (self, ...params) => {
            const [ kb ] = [ ...params ];
            return `escalating per [${kb}](https://help.rit.edu/kb_view.do?sysparm_article=${kb})`;
        }
    },
    {
        trigger: '\\sg',
        nParams: 1,
        paramNames: "{search}",
        desc: "Searches {search} globally in SNow",
        onExpand: (self, ...[ query = "<unspecified>" ]) => {
            window.open(`https://help.rit.edu/nav_to.do?uri=/$sn_global_search_results.do?sysparm_search=${query}`);
            return '';
        }
    },
    {
        trigger: "\\sn",
        nParams: 1,
        paramNames: "{ticket number}",
        desc: "Links the SNow {ticket number}",
        onExpand: (self, ...[ tn = "<unspecified>" ]) => `see [${tn}](https://help.rit.edu/text_search_exact_match.do?sysparm_search=${tn})`
    },
    {
        trigger: "\\claws",
        nParams: 1,
        paramNames: "{username}",
        desc: "Runs a CLAWS search for {username} in a new tab",
        onExpand: (self, ...[ username = null ]) => {
            window.open(`https://claws.rit.edu/users/useredit.php?ACTION=GET&USERNAME=${username}`);
            return '';
        }
    },
    {
        trigger: "\\?",
        desc: "Launch help information about SnowSnippets",
        onExpand: () => {
            window.open('https://github.com/erwijet/RIT-ITS-SnazzySnowKeys');
            return '';
        }
    },
    {
        trigger: "\\sign",
        nParams: 1,
        paramNames: "{name}",
        desc: "Inserts a signature block containing {name}",
        onExpand: (self, ...[ name = null ]) => {
            if (!!name)
                name = name.substr(0, 1).toUpperCase() + name.substr(1).toLowerCase()
            return `If you have any further questions, please feel free to reach out to the Service Center by giving us a call at (585) 475-5000 or by starting a live chat at [help.rit.edu](https://help.rit.edu)\n\nHave a lovely day,${!!name ? '\n' + name : ''}\nRIT Service Center`
        }
    },
    {
        trigger: "\\kb",
        desc: "links the {kb number} with the optional link text of {name}",
        paramName: "{kb number} {name}",
        nParams: 5,
        onExpand: (self, ...params) => {
            const [ kb, ...nameComponents ] = [ ...params ];
            const name = nameComponents.length > 0 ? nameComponents.reduce((acc, cur) => (acc += (cur + ' ')), '') : null;
            return `[${name || kb}](https://help.rit.edu/kb_view.do?sysparm_article=${kb})`;
        }
    },
    {
        trigger: "\\dev",
        desc: "don't use this unless your name is tyler :P",
        nParams: 1,
        onExpand: (self, ...params) => {
            let res;
            const [ number ] = params;
        }
    },
    {
        trigger: "\\config",
        desc: "Open the Snippet configuration menu",
        onExpand: () => {
            if (isAW) alert('\\config is not supported in Agent Workspace... yet!'); // TODO: implement \config in agent workspace
            loadUserSnippets();
            let gm = new GlideModal();
            let nextId = 0;
            gm.setTitle('Edit Custom Snippets');
            gm.setWidth(1000);
            gm.renderWithContent(`
              <div style="position: absolute; bottom: 16px; right: 16px"><button id="__tmus_domelem_btn_newSnippet"class="form_action_button btn btn-default">New Snippet</button><button id='__tmus_domelem_btn_save' style='margin-left: 10px' class="form_action_button btn btn-default btn-primary">Save</button></div>
              <div style='width: 100%; display: flex; justify-content: center; align-items: center'>
                <table style='width: 65%'>
                  <thead>
                    <tr>
                      <th style="text-align: center">Trigger</th>
                      <th style="text-align: center">Expansion</th>
                    </tr>
                  </thead>
                  <tbody id='__tmus_domelem_tbody'>
                    ${Object.keys(userSnippetDefinitions).reduce((html, recordKey) => {
                        html += `
                          <tr>
                            <td style="padding: 5px"><div class="input-group"><span class="input-group-btn"><button class="btn btn-default"><strong>\\</strong></button></span><input class="form-control" id="__tmus_snowbindings_usersnippetKey_${nextId}" value=${recordKey} /></div></td>
                            <td style="padding: 5px"><textarea style="height: 32px; min-height: 32px" class="form-control" id="__tmus_snowbindings_usersnippetValue_${nextId++}">${userSnippetDefinitions[recordKey]}</textarea></td>
                          </tr>
                        `
                        return html;
                     }, "")}
                  </tbody>
              </div>
            `);

            // "New Snippet" button logic
            document.querySelector('#__tmus_domelem_btn_newSnippet').addEventListener('click', e => {
                e.preventDefault();
                document.querySelector('#__tmus_domelem_tbody').innerHTML += `
                  <tr>
                    <td style="padding: 5px"><div class="input-group"><span class="input-group-btn"><button class="btn btn-default"><strong>\\</strong></button></span><input class="form-control" id="__tmus_snowbindings_usersnippetKey_${nextId}" value='<trigger>' /></div></td>
                    <td style="padding: 5px"><textarea style="height: 32px; min-height: 32px" class="form-control" id="__tmus_snowbindings_usersnippetValue_${nextId++}"><expansion></textarea></td>
                  </tr>
                `
            });

            // "Save" button logic
            document.querySelector('#__tmus_domelem_btn_save').addEventListener('click', e => {
                e.preventDefault();
                let idx = 0;
                const newUserSnippetDefinitions = {};
                while (!!document.querySelector(`#__tmus_snowbindings_usersnippetKey_${idx}`)) {
                    const key = document.querySelector(`#__tmus_snowbindings_usersnippetKey_${idx}`).value;
                    const expansion = document.querySelector(`#__tmus_snowbindings_usersnippetValue_${idx}`).value;

                    if (!!key && !!expansion && SNIPPET_REGEX.test(key) && !Object.keys(newUserSnippetDefinitions).includes(key))
                        newUserSnippetDefinitions[key] = expansion;

                    idx++;
                }

                saveUserSnippets(newUserSnippetDefinitions);
                gm.get().destroy(); // close modal
            });

            return '';
        }
    }
];

let userSnippets = []; // actual loaded user snippets (will load on DOMContentLoaded)
let userSnippetDefinitions = {}; // object-shaped user snippet definitions (will load on DOMContentLoaded from tampermonkey value store). These will be parsed into actual user snippets at loadtime

// record should be of the shape: { [snippet_trigger: string]: string }. (ex: { "have": "have a lovely day", "num": "(585) 475-5000" })
function saveUserSnippets(record) {
    GM_setValue(USERSNIPPETS_KEY, record);
    loadUserSnippets();
}

// called on DOMContentLoaded. This will fetch userscript definitions and parse into valid userscript syntax (see SNIPPETS object for example of userscript syntax)
function loadUserSnippets() {
    userSnippetDefinitions = GM_getValue(USERSNIPPETS_KEY) ?? USERSNIPPETS_DEFAULTS;

    // parse definitions into userscript syntax
    userSnippets = Object.keys(userSnippetDefinitions).map(key => ({
        trigger: key,
        desc: userSnippetDefinitions[key],
        onExpand: () => userSnippetDefinitions[key]
    }));
}

// this syntax may seem very strange. Please refer to https://github.com/zurb/tribute#a-collection for more information regarding this process / syntax
function initTributeHelper() {
    g_tribute = new Tribute({
        trigger: "\\",
        menuItemLimit: SNIPPETS.length,
        values: (userText, resolve) => {
            resolve(
            SNIPPETS.concat(userSnippets.map(({ trigger, onExpand }) => ({ trigger: '\\' + trigger, onExpand }))).reduce((validSnippets, snippet) => { // reduce here acts as a filter & map function
                const [ typedTrigger, ...typedArgs ] = userText.split(' ');
                const maxArgs = snippet.nParams || 0;

                // if the user typed the correct function identifier and not too many args then include
                if (snippet.trigger.includes(typedTrigger) && typedArgs.length <= maxArgs) {
                    validSnippets.push({
                        snippet,
                        params: typedArgs, // here we parse and store the params for this::selectTemplate
                        key: userText,
                        value: snippet.trigger
                    });
                }

                return validSnippets;
            }, []));
        },
        menuItemTemplate: item => {
            const { trigger, onExpand, desc, nParams, paramNames } = item.original.snippet;
            return `<strong>${trigger}</strong>&nbsp&nbsp<tt>${paramNames ?? ''}</tt><br /><em>${desc ?? '(No Description)'}</em>`
        },
        selectTemplate: item => {
            const { snippet, params } = item.original;
            const { onExpand } = { ...snippet };
            return onExpand(snippet, ...params)
        },
        allowSpaces: true,
        requireLeadingSpace: false
    });
}

let tribute_initedElementIds = [ ]; // track elements that have g_tribute has attached to

// here we check if the clicked element (the active element in this case, since it is mouse-up) is
//   (a) eligible for usersnippets (tribute)
//   (b) not already attached to g_tribute
//
// if (a) and (b), then we attach g_tribute to the current active element (what was just clicked)
function doc_mouseup(e) {
    const curElem = Util.getActiveElement();
    if (!curElem) return;

    // begin check if current element is eligible for snippets

    if (isAW) {
        if (!curElem.classList.contains('sn-textarea') || tribute_initedElementIds.includes(curElem.id)) return; // invalid element or already inited
    } else {
        const ALLOWED_IDS = [
            'activity-stream-work_notes-textarea',
            'activity-stream-comments-textarea',
            'sc_task.request_item.comments',
            'sc_task.work_notes',
            'incident.comments',
            'new_call.u_special_instructions',
            'incident.work_notes'
        ];

        if (!ALLOWED_IDS.includes(curElem.id) || tribute_initedElementIds.includes(curElem.id)) return; // invalid ID or already inited
    }

    // end check

    tribute_initedElementIds.push(curElem.id);
    curElem.classList.add('mentionable');
    g_tribute.attach(curElem);
}

(function () {
    GM_addStyle(GM_getResourceText("TRIBUTE_CSS"));
    document.addEventListener('mouseup', doc_mouseup);

    loadUserSnippets();
    initTributeHelper();
})();
