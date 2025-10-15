#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Get Menubar Commands of Front Applications
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon 🤖📃

# Documentation:
# @raycast.description 
# @raycast.author loudog
# @raycast.authorURL https://raycast.com/loudog
#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Get menubar commands
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon 🤖📃

# Documentation:
# @raycast.description Outputs a list of all menu commands available in the front application to a file on the desktop.
# @raycast.author loudog
# @raycast.authorURL https://raycast.com/loudog

set outputFilePath to POSIX path of (path to desktop) & "MenuCommands.txt"

tell application "System Events"
	tell (process 1 where frontmost is true)
		set menuList to {}
		set menuBarItems to menu bar items of menu bar 1
		repeat with aMenuItem in menuBarItems
			set aMenuName to name of aMenuItem
			try
				set subMenuList to my getSubMenus(aMenuItem, aMenuName)
				set menuList to menuList & subMenuList
			on error errMsg number errNum
				set end of menuList to "Error: " & errMsg & " (Error number: " & errNum & ")"
			end try
		end repeat
	end tell
end tell

set AppleScript's text item delimiters to linefeed
set menuList to menuList as string
do shell script "echo " & quoted form of menuList & " > " & quoted form of outputFilePath

on getSubMenus(aMenuItem, parentName)
	set subMenuList to {}
	tell application "System Events"
		try
			set menusCount to count of menus of aMenuItem
			if menusCount > 0 then
				repeat with bMenu in menus of aMenuItem
					try
						set menuItemsCount to count of menu items of bMenu
						if menuItemsCount > 0 then
							repeat with cMenuItem in menu items of bMenu
								set cMenuItemName to name of cMenuItem
								if cMenuItemName is not missing value then
									set end of subMenuList to parentName & " -> " & (name of bMenu) & " -> " & cMenuItemName
									set subMenuList to subMenuList & my getSubMenus(cMenuItem, parentName & " -> " & (name of bMenu) & " -> " & cMenuItemName)
								end if
							end repeat
						end if
					on error errMsg number errNum
						set end of subMenuList to "Error: " & errMsg & " (Error number: " & errNum & ")"
					end try
				end repeat
			end if
		on error errMsg number errNum
			set end of subMenuList to "Error: " & errMsg & " (Error number: " & errNum & ")"
		end try
	end tell
	return subMenuList
end getSubMenus
