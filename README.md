# RIT-ITS-SnazzySnowKeys

A keyboard shortcuts userscript for ITS employees

**Click [here](https://github.com/erwijet/RIT-ITS-SnazzySnowKeys/raw/master/v3.0.bindings.user.js) the most up-to-date version** auto-updates are weird so you can always install the latest version there.

If you would like a snippet to be created, feel free to open a PR and add it directly. Otherwise, you can open an issue and I can add it myself!

Please note: each character in a snippet trigger must be typed sequentially. For example, if you type `\na <Backspace> um`, the screen may say `\num`, but the `\num` snippet will not be expanded. This is done in the event that you wish to manually write the snippet text without it expanding. Also, anytime you see `\n` in the expansion text, it denotes a new line.

## Basic Snippets
Trigger will be replaced with expansion text

|Snippet|Mnemonic|Expansion|
|---|---|---|
|`\close`|close|If you have any further questions, please feel free to reach out to the Service Center by giving us a call at (585) 475-5000 or by starting a live chat at help.rit.edu\n\nHave a lovely day,\nRIT Service Center|
|`\sign`|Sign ticket|\nIf you have any further questions, please feel free to reach out to the Service Center by giving us a call at (585) 475-5000 or by starting a live chat at `[help.rit.edu](https://help.rit.edu)`\n\nHave a lovely day,\nRIT Service Center|
|`\have`|have|Have a lovely day,\nRIT Service Center|
|`\hi`|hi|Hello!\n\nThank you so much for reaching out to the Service Center.|
|`\num`|number|(585) 475-5000|
|`\g`|give|give us a call|
|`\vi`|verify identity|verify your identity|
|`\thx`|Thanks|Thanks!\nRIT Service Center|
|`\ep`|escalating per|escalating per|
|`\codes`|Duo Codes|ID verified over zoom\nstudent id + external email, bday, zip|
|`\cb`|Code Block|[code]&lt;code&gt;xxx&lt;/code&gt;[/code]|

## Dynamic Snippets
|Snippet|Mnemonic|Action|
|---|---|---|
|`\tn`|Ticket Number|Expands to the current ticket number|

## Wrapping Snippets
**note** `{parameter}` denotes a variable field
|Snippet|Mnemonic|Action|
|---|---|---|
|{KB Number} `\lkb`|Link KB|Wraps {KB Number} in the markdown syntax for a link. ex: `KB1234 \lkb` -> `[KB1234](https://help.rit.edu/kb_view.do?sysparm_article=KB1234)`|
|{KB Number} `\lekb`|Link Escalation KB|Wraps {KB Number} in the markdown syntax for a link just like \lkb, but prefixes it with "escalating per". ex: `KB1234 \lekb` -> `escalating per [KB1234](https://help.rit.edu/kb_view.do?sysparm_article=KB1234`)|
|{Ticket Number} `\ltn`|Link Ticket Number|Wraps {t}

# Functional Snippets
Snippet deletes itself and then performs an action, simlar to the function of a hotkey
|Snippet|Mnemonic|Action|
|---|---|---|
|{KB Number} `\okb`|Open KB|Opens the {KB Number} in a new tab|
|{expression} `\sg`|Search Globally|Searches {expression} globally in SNow in a new tab|
|{expression} `\direc`|Directory|Attempts to match {expression} in the RIT directory. If {expression} is nothing, this will just open the RIT directory|
|`\dup`|Duplicate|Duplicates the current tab|
|{username} `\claws`|CLAWS|Attempts a CLAWS search for {username} in a new tab|
|`\?`|Help|Opens this documenation page|
