# RIT-ITS-SnazzySnowKeys

A keyboard shortcuts userscript for ITS employees

## Current Shortcuts

|Snippet|Expansion|
|---|---|
|\have|Have a lovely day,\nRIT Service Center|
|\close|If you have any further questions, please feel free to reach out to the Service Center by giving us a call at (585) 475-5000 or by starting a live chat at help.rit.edu\n\nHave a lovely day,\nRIT Service Center|
|\hi|Hello!\n\nThank you so much for reaching out to the Service Center.|
|\num|(585) 475-5000|
|\g|give us a call|
|\vi|verify your identity|
|\t|Thanks!\nRIT Service Center|
|\ep|escalating per|
|\codes|ID verified over zoom\nstudent id + external email, bday, zip|

## Dynamic Snippets
**note** `{parameter}` denotes a variable field
|Snippet|Action|
|---|---|
|{KB Number} \lkb|Wraps {KB Number} in the markdown syntax for a link. ex: `KB1234 \lkb` -> `[KB1234](https://help.rit.edu/kb_view.do?sysparm_article=KB1234)`|
|{KB Number} \lekb|Wraps {KB Number} in the markdown syntax for a link just like \lkb, but prefixes it with "escalating per". ex: `KB1234 \lekb` -> `escalating per [KB1234](https://help.rit.edu/kb_view.do?sysparm_article=KB1234)
|{expression} \sg|Searches {expression} globally in SNow in a new tab|

# Functional Snippets
Snippet deletes itself and then performs an action, simlar to the function of a hotkey
|Snippet|Action|
|---|---|
|\ol|Open the current url in a the current tab (duplicates the tab)|
