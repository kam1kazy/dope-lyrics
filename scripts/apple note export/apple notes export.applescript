-- Экспорт папки Notes Музыка / Рэпчик в txt с датами создания и правки.
-- Запускать сохранённый скрипт (двойной клик или osascript), не Run из несохранённого редактора.
-- Папка: рядом со скриптом /Рэпчик Export/. Если путь к скрипту неизвестен — Desktop/Рэпчик Export/.

on pad2(n)
	set s to n as text
	if (count of s) is 1 then return "0" & s
	return s
end pad2

on iso8601(theDate)
	set y to year of theDate as integer
	set mo to month of theDate as integer
	set d to day of theDate as integer
	set h to hours of theDate as integer
	set mi to minutes of theDate as integer
	set s to (seconds of theDate as integer)
	set stamp to (y as text) & "-" & my pad2(mo) & "-" & my pad2(d) & " " & my pad2(h) & ":" & my pad2(mi) & ":" & my pad2(s)
	set raw to do shell script "date -j -f '%Y-%m-%d %H:%M:%S' " & quoted form of stamp & " +%Y-%m-%dT%H:%M:%S%z"
	return (text 1 thru -3 of raw) & ":" & (text -2 thru -1 of raw)
end iso8601

on sanitizeFilename(theName)
	set badCharacters to {"/", ":", "\\", return, linefeed, character id 8232, character id 8233}
	
	repeat with badChar in badCharacters
		set AppleScript's text item delimiters to badChar
		set theName to text items of theName
		set AppleScript's text item delimiters to "_"
		set theName to theName as text
	end repeat
	
	set AppleScript's text item delimiters to ""
	
	if theName is "" then set theName to "Без названия"
	
	return theName
end sanitizeFilename

on resolveOutputFolder()
	try
		set mePath to POSIX path of (path to me)
		if mePath does not contain "Script Editor.app" then
			return (do shell script "dirname " & quoted form of mePath) & "/Рэпчик Export/"
		end if
	end try
	return POSIX path of (path to desktop) & "Рэпчик Export/"
end resolveOutputFolder

set outputFolder to my resolveOutputFolder()

do shell script "mkdir -p " & quoted form of outputFolder
do shell script "find " & quoted form of outputFolder & " -maxdepth 1 -name " & quoted form of "*.txt" & " -delete"

tell application "Notes"
	set targetFolder to folder "Рэпчик" of folder "Музыка"
	set allNotes to every note of targetFolder
	
	set counter to 0
	
	repeat with currentNote in allNotes
		if not (password protected of currentNote) then
			set counter to counter + 1
			
			set noteName to name of currentNote
			set noteText to plaintext of currentNote
			set createdIso to my iso8601(creation date of currentNote)
			set modifiedIso to my iso8601(modification date of currentNote)
			
			set safeName to my sanitizeFilename(noteName)
			set fileName to text -5 thru -1 of ("00000" & counter) & " - " & safeName & ".txt"
			set filePath to outputFolder & fileName
			
			set fileContents to "---" & linefeed & "created: " & createdIso & linefeed & "modified: " & modifiedIso & linefeed & "---" & linefeed & linefeed & noteText
			
			set fileRef to open for access (POSIX file filePath) with write permission
			set eof of fileRef to 0
			write fileContents to fileRef as «class utf8»
			close access fileRef
		end if
	end repeat
end tell

display notification "Экспортировано заметок: " & counter with title "Рэпчик Export"
return counter
