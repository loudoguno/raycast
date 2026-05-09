/**
 * Inline AppleScript registry.
 * Scripts are embedded as template literals to avoid file-path issues
 * in the bundled Raycast extension.
 */

const ESCAPE_HANDLERS = `
on escapeJSON(str)
	set str to my replaceText(str, "\\\\", "\\\\\\\\")
	set str to my replaceText(str, "\\"", "\\\\\\"")
	set str to my replaceText(str, return, "\\\\n")
	set str to my replaceText(str, linefeed, "\\\\n")
	return str
end escapeJSON

on replaceText(theText, searchStr, replaceStr)
	set oldDelims to AppleScript's text item delimiters
	set AppleScript's text item delimiters to searchStr
	set parts to text items of theText
	set AppleScript's text item delimiters to replaceStr
	set theText to parts as text
	set AppleScript's text item delimiters to oldDelims
	return theText
end replaceText
`;

function withEscape(script: string): string {
  return script + "\n" + ESCAPE_HANDLERS;
}

export const scripts: Record<string, string> = {
  // ─── Tier 1 ────────────────────────────────────────────

  "finder.applescript": withEscape(`tell application "Finder"
	set sel to selection
	if (count of sel) > 0 then
		set f to item 1 of sel
		set fileName to name of f
		set fileURL to URL of f
		return "{\\"title\\":\\"" & my escapeJSON(fileName) & "\\",\\"url\\":\\"" & fileURL & "\\"}"
	else
		set loc to insertion location
		set locPath to POSIX path of (loc as text)
		set locURL to URL of loc
		return "{\\"title\\":\\"" & my escapeJSON(locPath) & "\\",\\"url\\":\\"" & locURL & "\\"}"
	end if
end tell`),

  "textedit.applescript": withEscape(`tell application "TextEdit"
	if (count of documents) > 0 then
		set d to document 1
		set docName to name of d
		try
			set docPath to path of d
			set docURL to "file://" & docPath
		on error
			set docURL to ""
		end try
		return "{\\"title\\":\\"" & my escapeJSON(docName) & "\\",\\"url\\":\\"" & docURL & "\\"}"
	else
		return "{\\"title\\":\\"\\",\\"url\\":\\"\\"}"
	end if
end tell`),

  "omnifocus.applescript": withEscape(`tell application "OmniFocus"
	tell content of first document window of front document
		set sel to selected trees
		if (count of sel) > 0 then
			set t to value of item 1 of sel
			set taskName to name of t
			set taskID to id of t
			return "{\\"title\\":\\"" & my escapeJSON(taskName) & "\\",\\"url\\":\\"omnifocus:///task/" & taskID & "\\"}"
		else
			return "{\\"title\\":\\"\\",\\"url\\":\\"\\"}"
		end if
	end tell
end tell`),

  "mail.applescript": withEscape(`tell application "Mail"
	set msgs to selection
	if (count of msgs) > 0 then
		set m to item 1 of msgs
		set subj to subject of m
		set msgID to message id of m
		set msgURL to "message://%3c" & msgID & "%3e"
		return "{\\"title\\":\\"" & my escapeJSON(subj) & "\\",\\"url\\":\\"" & msgURL & "\\"}"
	else
		return "{\\"title\\":\\"\\",\\"url\\":\\"\\"}"
	end if
end tell`),

  "obsidian.applescript": withEscape(`tell application "System Events"
	tell process "Obsidian"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell

set oldDelims to AppleScript's text item delimiters
set AppleScript's text item delimiters to " - "
set parts to text items of winTitle
set AppleScript's text item delimiters to oldDelims

if (count of parts) ≥ 2 then
	set noteName to item 1 of parts
	set vaultName to item 2 of parts
	set noteURI to "obsidian://open?vault=" & my encodeURI(vaultName) & "&file=" & my encodeURI(noteName)
	return "{\\"title\\":\\"" & my escapeJSON(noteName) & "\\",\\"url\\":\\"" & noteURI & "\\"}"
else
	return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
end if

on encodeURI(str)
	set str to my replaceText(str, " ", "%20")
	set str to my replaceText(str, "&", "%26")
	set str to my replaceText(str, "=", "%3D")
	return str
end encodeURI`),

  "bear.applescript": withEscape(`tell application "Bear"
	set noteTitle to name of front window
end tell

tell application "System Events"
	tell process "Bear"
		try
			click menu item "Copy Link to Note" of menu 1 of menu bar item "Note" of menu bar 1
		on error
			try
				click menu item "Copy Link to Note" of menu 1 of menu bar item "Edit" of menu bar 1
			end try
		end try
	end tell
end tell

delay 0.2
set noteURL to the clipboard

return "{\\"title\\":\\"" & my escapeJSON(noteTitle) & "\\",\\"url\\":\\"" & my escapeJSON(noteURL) & "\\"}"
`),

  "drafts.applescript": withEscape(`tell application "Drafts"
	set d to current draft
	set draftTitle to (first line of content of d)
	set draftUUID to uuid of d
	set draftURL to "drafts://open?uuid=" & draftUUID
	return "{\\"title\\":\\"" & my escapeJSON(draftTitle) & "\\",\\"url\\":\\"" & draftURL & "\\"}"
end tell`),

  "spotify.applescript": withEscape(`tell application "Spotify"
	set trackName to name of current track
	set trackArtist to artist of current track
	set trackID to id of current track
	set spotifyURL to "https://open.spotify.com/track/" & (text 15 thru -1 of trackID)
	set fullTitle to trackName & " — " & trackArtist
	return "{\\"title\\":\\"" & my escapeJSON(fullTitle) & "\\",\\"url\\":\\"" & spotifyURL & "\\"}"
end tell`),

  // ─── Tier 2 ────────────────────────────────────────────

  "calendar.applescript": withEscape(`tell application "System Events"
	tell process "Calendar"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "contacts.applescript": withEscape(`tell application "Contacts"
	set sel to selection
	if (count of sel) > 0 then
		set p to item 1 of sel
		set personName to name of p
		set personID to id of p
		return "{\\"title\\":\\"" & my escapeJSON(personName) & "\\",\\"url\\":\\"addressbook://" & personID & "\\"}"
	else
		return "{\\"title\\":\\"\\",\\"url\\":\\"\\"}"
	end if
end tell`),

  "fantastical.applescript": withEscape(`tell application "System Events"
	tell process "Fantastical"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "devonthink.applescript": withEscape(`tell application "DEVONthink 3"
	set sel to selected records of think window 1
	if (count of sel) > 0 then
		set rec to item 1 of sel
		set recName to name of rec
		set recUUID to uuid of rec
		set recURL to "x-devonthink-item://" & recUUID
		return "{\\"title\\":\\"" & my escapeJSON(recName) & "\\",\\"url\\":\\"" & recURL & "\\"}"
	else
		return "{\\"title\\":\\"\\",\\"url\\":\\"\\"}"
	end if
end tell`),

  "bike.applescript": withEscape(`tell application "Bike"
	set d to front document
	set docName to name of d
	try
		set docPath to file of d
		set docURL to "file://" & POSIX path of docPath
	on error
		set docURL to ""
	end try
	return "{\\"title\\":\\"" & my escapeJSON(docName) & "\\",\\"url\\":\\"" & docURL & "\\"}"
end tell`),

  "notes.applescript": withEscape(`tell application "System Events"
	tell process "Notes"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "sidenotes.applescript": withEscape(`tell application "SideNotes"
	try
		set current_note to current note
		set note_id to id of current_note
		set note_title to title of current_note
		set note_url to "sidenotes://open/" & note_id
		return "{\\"title\\":\\"" & my escapeJSON(note_title) & "\\",\\"url\\":\\"" & note_url & "\\"}"
	on error
		return "{\\"title\\":\\"\\",\\"url\\":\\"\\"}"
	end try
end tell`),

  "preview.applescript": withEscape(`tell application "Preview"
	set d to front document
	set docName to name of d
	set docPath to path of d
	set docURL to "file://" & docPath
	return "{\\"title\\":\\"" & my escapeJSON(docName) & "\\",\\"url\\":\\"" & docURL & "\\"}"
end tell`),

  // ─── Tier 3 ────────────────────────────────────────────

  "scrivener.applescript": withEscape(`tell application "System Events"
	tell process "Scrivener 3"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
		set docURL to ""
		try
			set docURL to value of attribute "AXDocument" of front window
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"" & docURL & "\\"}"
`),

  "ulysses.applescript": withEscape(`tell application "System Events"
	tell process "Ulysses"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "nova.applescript": withEscape(`tell application "Nova"
	set d to front document
	set docName to name of d
	set docPath to path of d
	set docURL to "file://" & docPath
	return "{\\"title\\":\\"" & my escapeJSON(docName) & "\\",\\"url\\":\\"" & docURL & "\\"}"
end tell`),

  "transmit.applescript": withEscape(`tell application "System Events"
	tell process "Transmit"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "reeder.applescript": withEscape(`tell application "System Events"
	tell process "Reeder"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "bookends.applescript": withEscape(`tell application "System Events"
	tell process "Bookends"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "thearchive.applescript": withEscape(`tell application "System Events"
	tell process "The Archive"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "nvultra.applescript": withEscape(`tell application "System Events"
	tell process "nvUltra"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "kindle.applescript": withEscape(`tell application "System Events"
	tell process "Kindle"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "houdahspot.applescript": withEscape(`tell application "System Events"
	tell process "HoudahSpot"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "accordance.applescript": withEscape(`tell application "System Events"
	tell process "Accordance"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "keyboardmaestro.applescript": withEscape(`tell application "System Events"
	tell process "Keyboard Maestro"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "ithoughts.applescript": withEscape(`tell application "System Events"
	tell process "iThoughts"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "soulver.applescript": withEscape(`tell application "System Events"
	tell process "Soulver 3"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
		set docURL to ""
		try
			set docURL to value of attribute "AXDocument" of front window
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"" & docURL & "\\"}"
`),

  "evernote.applescript": withEscape(`tell application "System Events"
	tell process "Evernote"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "omnioutliner.applescript": withEscape(`tell application "OmniOutliner"
	set d to front document
	set docName to name of d
	try
		set docPath to path of d
		set docURL to "file://" & docPath
	on error
		set docURL to ""
	end try
	return "{\\"title\\":\\"" & my escapeJSON(docName) & "\\",\\"url\\":\\"" & docURL & "\\"}"
end tell`),

  "omniplan.applescript": withEscape(`tell application "System Events"
	tell process "OmniPlan"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
		set docURL to ""
		try
			set docURL to value of attribute "AXDocument" of front window
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"" & docURL & "\\"}"
`),

  "marginnote.applescript": withEscape(`tell application "System Events"
	tell process "MarginNote 3"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "pathfinder.applescript": withEscape(`tell application "Path Finder"
	set sel to selection
	if (count of sel) > 0 then
		set f to item 1 of sel
		set fileName to name of f
		set filePath to POSIX path of f
		set fileURL to "file://" & filePath
		return "{\\"title\\":\\"" & my escapeJSON(fileName) & "\\",\\"url\\":\\"" & fileURL & "\\"}"
	else
		return "{\\"title\\":\\"\\",\\"url\\":\\"\\"}"
	end if
end tell`),

  "reminders.applescript": withEscape(`tell application "System Events"
	tell process "Reminders"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "dayone.applescript": withEscape(`tell application "System Events"
	tell process "Day One"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),

  "skim.applescript": withEscape(`tell application "Skim"
	set d to front document
	set docName to name of d
	set docPath to path of d
	set pageNum to index of current page of d
	set docURL to "file://" & docPath & "#page=" & pageNum
	return "{\\"title\\":\\"" & my escapeJSON(docName) & " (p. " & pageNum & ")" & "\\",\\"url\\":\\"" & docURL & "\\"}"
end tell`),

  "books.applescript": withEscape(`tell application "System Events"
	tell process "Books"
		try
			set winTitle to name of front window
		on error
			set winTitle to ""
		end try
	end tell
end tell
return "{\\"title\\":\\"" & my escapeJSON(winTitle) & "\\",\\"url\\":\\"\\"}"
`),
};
