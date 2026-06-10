#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.title TGATL Ask
# @raycast.mode fullOutput
# @raycast.icon 🎙
# @raycast.packageName TGATL
# @raycast.argument1 { "type": "text", "placeholder": "What do you want to know?" }
# @raycast.description Voice-or-typed query → Tavily search → ElevenLabs narration in your cloned voice
# @raycast.author Lou
# @raycast.authorURL https://loudog.uno

/Users/loudog/.bun/bin/bun /Users/loudog/code/tgatl-brief/index.ts ask "$1" --play
