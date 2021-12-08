// ==UserScript==
// @name         SNow Inline Editor
// @namespace    https://rit.edu/its
// @version      1.1
// @description  Add inline editing to ServiceNow Additional Comments
// @author       Seth Teichman (sthelp)
// @match        https://rit.service-now.com/*
// @match        https://help.rit.edu/*
// @match        https://ritstage.service-now.com/*
// @icon         https://www.google.com/s2/favicons?domain=service-now.com
// @updateURL    https://gitlab.code.rit.edu/sd-public/sd-userscripts/raw/master/SNowInlineEditor.user.js
// @downloadURL  https://gitlab.code.rit.edu/sd-public/sd-userscripts/raw/master/SNowInlineEditor.user.js
// @grant        unsafeWindow
// ==/UserScript==

const urlString = window.location.href;
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

var gm;
var textareaId;
var firstName;

const mcePlugins = "advlist link lists";
const mceMenubar = false;
const mceToolbar = 'undo redo | bold italic underline | link unlink | bullist numlist outdent indent | greeting closing';

const sctEditorId = "scTaskAdditionalCommentsEditor";
const sctWatchlistButtonsSelector = "#element\\.sc_task\\.request_item\\.watch_list > div.col-xs-10.col-sm-9.col-md-6.col-lg-5.form-field.input_controls";
const sctAddlCommentSelector = "#sc_task\\.request_item\\.comments";
const incEditorId = "incAdditionalCommentsEditor";
const incWatchlistButtonsSelector = "#element\\.incident\\.watch_list > div.col-xs-10.col-sm-9.col-md-6.col-lg-5.form-field.input_controls";
const incAddlCommentSelector = "#activity-stream-comments-textarea";
const newIncAddlCommentsSelector = "#incident\\.comments";
const eqrHeadingSelector = "#item_table > tbody > tr > td:nth-child(1) > table:nth-child(1) > tbody > tr > td > table > tbody > tr > td > span";
const eqrEditorId = "eqrAdditionalCommentsEditor";
const eqrAddlCommentLabelSelector = "#label_IO\\:42cb2aeddb591410fee85eea4b961982 > label > span.sn-tooltip-basic";
const eqrAddlCommentSelector = "#IO\\:42cb2aeddb591410fee85eea4b961982";

const snBrokeAlert = "Please Contact the UserScript developer. ServiceNow may have updated, breaking functionality.";

/**
* @author Tyler Holewinski (tshhelp@rit.edu)
**/
class SnippetsPlugin {
    static _defprop (name, value) {
        Object.defineProperty(SnippetsPlugin, name, { value });
    }

    static get _ed() {
        return tinymce.get(textareaId);
    }

    static _buildSnippetsObj(map) {
        return Object.keys(map).map(key => ({ trigger: key, expansion: map[key] }));
    }

    static init() {
        console.assert(typeof tinymce !== 'undefined');
        if (SnippetsPlugin._initialized) return;

        SnippetsPlugin._defprop('_initialized', true);
        SnippetsPlugin._defprop('_strokeHistory', []);
        SnippetsPlugin._defprop('_snippets', SnippetsPlugin._buildSnippetsObj({
            "\\g": "give us a call",
            "\\thx": "Thanks!<br />RIT Service Center"
        }));
        SnippetsPlugin._defprop('_maxTriggerLen', Math.max(...SnippetsPlugin._snippets.map(snippet => snippet.trigger.length)));
        SnippetsPlugin._defprop('_expandSnippet', (snippet) => {
            const caretPosMarkId = tinymce.DOM.uniqueId();
            SnippetsPlugin._ed.execCommand('mceInsertRawHTML', false, `<span id=${caretPosMarkId}></span>`); // place a marker for our cursor to return to

            // expand text
            const content = SnippetsPlugin._ed.getContent();
            const newContent = content.replace(snippet.trigger, snippet.expansion);
            SnippetsPlugin._ed.setContent(newContent);

            // return caret to marker
            const caretPosMark = SnippetsPlugin._ed.dom.select('span#' + caretPosMarkId); // get a reference to the span marker
            SnippetsPlugin._ed.selection.select(caretPosMark[0]); // select the marker
            SnippetsPlugin._ed.selection.collapse(false); // move caret to end of selection

            SnippetsPlugin._ed.execCommand('mceRemoveNode', false, caretPosMark[0]); // delete marker
        });
    }

    static _handleKeyUp(e) {
        SnippetsPlugin._strokeHistory.push(e.key);
        if (SnippetsPlugin._strokeHistory.length > SnippetsPlugin._maxTriggerLen)
            SnippetsPlugin._strokeHistory.shift(); // delete oldest keystroke

        const historyStr = SnippetsPlugin._strokeHistory.reduce((acc, stroke) => acc + stroke);

        for (let snippet of SnippetsPlugin._snippets) {
            if (historyStr.includes(snippet.trigger)) {
                SnippetsPlugin._expandSnippet(snippet);
                SnippetsPlugin._strokeHistory.clear();
                return;
            }
        }
    }

    static start() {
        SnippetsPlugin._ed.on('keyup', SnippetsPlugin._handleKeyUp);
    }


    static stop() {
       SnippetsPlugin._ed.off('keyup', SnippetsPlugin._handleKeyUp); 
    }
}

/**
 * generateGreeting is a function that creates an HTML String to start a response
 **/
function generateGreeting() {
	//Get current hour
	var d = new Date();
	var h = d.getHours();
	var timeOfDay = "";
	
	//Get time of day word
	if (h < 12) {
		timeOfDay = "morning";
	} else if (h < 17) {
		timeOfDay = "afternoon";
	} else {
		timeOfDay = "evening";
	}
	
	//Check if firstName is undefined
	if (typeof firstName === "undefined") { //If so, return "Good [time of day],"
		return '<p>Good ' + timeOfDay + ',</p><br/>';
	} else { //Otherwise, return "Good [time of day] [firstName],"
		return '<p>Good ' + timeOfDay + ' ' + firstName + ',</p><br/>';
	}
}

/**
 * generateClosing is a function that creates an HTML String to end a response
 * 	type: the type of closing message "normal" for most cases or "close" for ticket closure/resolution
**/
function generateClosing(type) {
	//Base closing message to be added to the end of the comments
	const closingText = "<p>Thanks,<br/>RIT Service Center</p>";
	//Check which type of closing was requested
	if (type === "normal") { //If normal closing (ticket remains open), simply return the base text
		return closingText;
	} else if (type === "close") { //Otherwise (ticket closed/resolved)
		//Request for customer to fill out Satisfaction Survey
		const surveyFeedbackText = "If you have any further questions, don't hesitate to contact us. Additionally, you may receive an email to fill out a satisfaction survey, we would greatly appreciate your feedback, as it will help us serve you better in the future.</p>";
	
		//Check type of ticket
		if (isSctask() || isEsdqr()) { //If request, return request closing message
			return "<p>As your request has been completed, this ticket is now closed. " + surveyFeedbackText + closingText;
		} else if (isInc()) { //If incident, return incident closing message
			return "<p>As your issue has been fixed, this ticket has been marked as resolved. " + surveyFeedbackText + closingText;
		}
	}
}

/**
 * getAdditionalCommentsSelector is a function that gets the proper additional comments selector for the current record
**/
function getAdditionalCommentsSelector() {
	if (isInc()) {
		return incAddlCommentSelector;
	} else if (isSctask()) {
		return sctAddlCommentSelector;
	} else if (isEsdqr()) {
		return eqrAddlCommentSelector;
	}
}

/**
 * getEditorId is a function that gets the proper editor id for the current record
**/
function getEditorId() {
	if (isInc()) {
		return incEditorId;
	} else if (isSctask()) {
		return sctEditorId;
	} else if (isEsdqr()) {
		return eqrEditorId;
	}
}

/**
 * loadCommentsIntoEditor is a function that loads the comments from the Additional Comments field into TinyMCE
**/
function loadCommentsIntoEditor(commentsSelector) {
	var currentText = commentsSelector.value.replace('[code]', '').replace('[/code]', ''); //Get the current text of the additional comments box without code tags
	tinymce.get(textareaId).setContent(currentText); //Load the current additional comments into the editor
}

/**
 * getTinyMceConfig is a function that generates a TinyMCE init object for the current record
**/
function getTinyMceConfig() {
	return { //Initialize TinyMCE on the active textarea
		selector: "#" + textareaId,
		plugins: mcePlugins,
		menubar: mceMenubar,
		toolbar: mceToolbar,
		setup: function (ed) {
			ed.on('init', function(args) { //When TinyMCE initialization finishes
                SnippetsPlugin.init(); // initalize plugin

				var currentSelector = document.querySelector(getAdditionalCommentsSelector());
				if (currentSelector !== null) { //Check that the selector isn't null (issue with new INC records)
					loadCommentsIntoEditor(currentSelector);
				} else if (isInc()) { //For INC records, use the selector that new INC records use
					currentSelector = document.querySelector(newIncAddlCommentsSelector);
					loadCommentsIntoEditor(currentSelector);
				} else {
					alert(snBrokeAlert);
				}
			});
			ed.addButton('greeting', { //Add a button to insert a greeting/opening
				text: 'Insert Greeting',
				onclick: function (_) {
					ed.insertContent(generateGreeting());
				}
			});
			ed.addButton('closing', { //Add a dropdown button to insert a closing
				type: 'menubutton', //specify that this is a dropdown
				text: 'Insert Closing',
				icon: false,
				menu: [
					{ //Button for Normal Closing
						text: 'Normal Closing',
						onclick: function (_) {
							ed.insertContent(generateClosing('normal'));
						}
					},
					{ //Button for Ticket Closed/Resolved Closing
						text: 'Ticket Close/Resolve',
						onclick: function (_) {
							ed.insertContent(generateClosing('close'));
						}
					}
					]
			});
		}
	};
}

/**
 * freeMce is a function that frees the TinyMCE instance for further use
**/
function freeMce() {
	if (textareaId) { //If there is a textarea that is active
		tinymce.get(textareaId).remove(); //Disable TinyMCE on the current textarea to free it for further use
		textareaId = null; //Clear active textarea indicator
	}
}

/**
 * closeEditorModal is a function that closes the ServiceNow GlideModal and frees the TinyMCE instance
**/
function closeEditorModal() {
    SnippetsPlugin.stop();
	freeMce(); //Free TinyMCE Instance
	if (gm) { //If there is an open GlideModal
		gm.get().destroy(); //Destroy the open GlideModal
		gm = null; //Clear the variable
	}
}

/**
 * openEditorModal is a function that opens the TinyMCE editor on a textField in a ServiceNow GlideModal
**/
function openEditorModal() {
	if (isInc() && incHasCombinedFieldSet()) { //Make sure that the user didn't change to the combined field since page load
		incSeparateCombinedField();
	}
	gm = new GlideModal(); //Create a new GlideModal
	gm.setTitle('Inline Formatting'); //Set title to 'Inline Formatting'
	gm.setWidth(1000);
	//gm.setBackdropStatic(true); //Prevent users from clicking off of the GlideModal to close it (not catchable)
	textareaId = getEditorId();
	gm.renderWithContent(`
		<div class="form-group form-horizontal" id="linkModalContent">
			<textarea id='` + textareaId + `'></textarea>
			<div id="dialog_buttons" style="clear: both; padding-top: 20px;">
				<button class="btn btn-default" id="editorCancelButton" onclick="closeEditorModal(); return false" style="min-width: 5em;" title="" type="submit" data-original-title="Cancel Edit">Cancel</button>&nbsp;
				<button class="btn btn-primary" id="editorOkButton" onclick="submitEditorModal()" style="min-width: 5em;" title="" type="button" data-original-title="Save Changes">OK</button>
			</div>
		</div>
	`); //Add the content of the GlideModal
	tinymce.init(getTinyMceConfig()); //Initialize TinyMCE on the textarea in the GlideModal
	gm.on('closeconfirm', freeMce); //Free the TinyMCE instance if the X button in top right of GlideModal is hit
	gm.on('beforeclose', freeMce); //Free the TinyMCE instance before it closes
    SnippetsPlugin.start();
}

/**
 * exportEditorIntoComments is a function that takes the output from TinyMCE and puts it into the Additional Comments field
**/
function exportEditorIntoComments(result, commentsSelector) {
	commentsSelector.value = "[code]" + result + "[/code]"; //Add code tags to the outsides of the HTML output and put it all in the additional comments box
	commentsSelector.dispatchEvent(new Event('change')); //Tell the Additional Comments field that it has been changed
}

/**
 * submitEditorModal is a function that processes the data in the TinyMCE editor and places it in the appropriate additional comments box
**/
function submitEditorModal() {
	var id = getEditorId();
    
	var result = tinymce.get(id).getContent(); //Get HTML output from TinyMCE textarea
	closeEditorModal(); //Close the GlideModal and free the TinyMCE instance
	var addlComments = document.querySelector(getAdditionalCommentsSelector()); //Get the Additional Comments field
	if (addlComments !== null) { //Check that additional comments field exists (new INC issue)
		exportEditorIntoComments(result, addlComments);
	} else if (isInc()) { //If record is new incident, use different selector
		addlComments = document.querySelector(newIncAddlCommentsSelector);
		exportEditorIntoComments(result, addlComments);
	} else {
		alert(snBrokeAlert);
	}
}

/**
 * incHasCombinedFieldSet is a function that lets you know if the Additional Comments and Work Notes fields are combined
**/
function incHasCombinedFieldSet() {
	var multInputJournEntryButton = document.querySelector("#multiple-input-journal-entry");
	if (multInputJournEntryButton && multInputJournEntryButton !== null) {
		return multInputJournEntryButton.classList.contains('ng-hide');
	}
}

/**
 * incSeparateCombinedField is a function that presses the button to separate the combined fields
**/
function incSeparateCombinedField() {
	document.querySelector("#single-input-journal-entry > div.form-toggle-inputs.col-xs-2.col-md-1_5.col-lg-2.form-field-addons > button").click();
}

/**
 * getRecordInfo is a function that gets various info from the current record
**/
function getRecordInfo() {
    if (urlParams.get('sys_id') && urlParams.get('sys_id') != -1) { 
		var gr; 
		if (isSctask()) {
			gr = new GlideRecord('sc_task');
		} else if (isInc()) {
			gr = new GlideRecord('incident');
		}
		gr.addQuery('sys_id', urlParams.get('sys_id'));
		gr.query(getCustomerInfo);
	}
}

/**
 * getCustomerInfo is a function that gets customer record of the customer in the Requested for/Affected user field
 *	gr: GlideRecord for the current ticket/record
**/
function getCustomerInfo(gr){
	if(gr.next()) {
		var gr2 = new GlideRecord('sys_user');
		if (gr.getValue("u_cf_user")) {
			gr2.addQuery('sys_id', gr.getValue("u_cf_user"));
			gr2.query(getCustomerFirstName);
		}
	} else {
		alert("Error: getCustomerInfo() failed to find " + gr.getTableName() + " with sys_id " + gr.getValue("sys_id"));
	}
}

function getCustomerInfoEsdqr() {
	var gr = new GlideRecord('sys_user');
	gr.addQuery('sys_id', urlParams.get('sysparm_requested_for'));
	gr.query(getCustomerFirstName);
}

/**
 * getCustomerFirstName is a function that gets the customer first name from the provided GlideRecord
 * 	gr: GlideRecord for the Requested for/Affected user
**/
function getCustomerFirstName(gr) {
	if(gr.next()) {
		firstName = gr.getValue("first_name");
	} else {
		alert("Error: getCustomerFirstName() failed to find " + gr.getTableName() + " with sys_id " + gr.getValue("sys_id"));
	}
}

/**
 * isInc is a function that determines if the current record is an Incident (INC)
**/
function isInc() {
	return urlString.includes("incident.do");
}

/**
 * isSctask is a function that determines if the current record is a Catalog Task (SCTASK)
**/
function isSctask() {
	return urlString.includes("sc_task.do");
}

/**
 * isEsdqr is a function that determines if the current record is an Enterprise Service Desk Quick Request (EsdQR)
**/
function isEsdqr() {
	var header = document.querySelector("#item_table > tbody > tr > td:nth-child(1) > table:nth-child(1) > tbody > tr > td > table > tbody > tr > td > span");
	if (header) {
		return header.innerHTML === "Thank you for contacting the Enterprise Service Desk.  It's our pleasure to serve you!";
	}
	return false;
}

/**
 * Run this on page load. Initializes unsafeWindow functions, adds the respective Editor buttons to the page.
**/
(function() {
    'use strict'
	unsafeWindow.openEditorModal = openEditorModal;
    unsafeWindow.submitEditorModal = submitEditorModal;
	unsafeWindow.closeEditorModal = closeEditorModal;
	//Add a button above the additional comments field that calls openEditorModal()
	var editorButtonHtml = '<button id="' + getEditorId() + 'Button" class="btn" type="button" onclick="openEditorModal()">Comments Editor</button>';
    if (isSctask()) { //Check that we are on an SCTASK record.
        document.querySelector(sctWatchlistButtonsSelector).innerHTML += editorButtonHtml;
		getRecordInfo();
    } else if (isInc()) { //Check that we are on an INC record.
        document.querySelector(incWatchlistButtonsSelector).innerHTML += editorButtonHtml;
		getRecordInfo();
		if (incHasCombinedFieldSet()) { //Separate the combined field to allow the Editor to add to Additional Comments properly
			incSeparateCombinedField();
		}
	} else if (isEsdqr()) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.9.11/tinymce.min.js';    

		document.getElementsByTagName('head')[0].appendChild(script);
		document.querySelector(eqrAddlCommentLabelSelector).parentElement.innerHTML += editorButtonHtml;
		getCustomerInfoEsdqr();
	}
})();
