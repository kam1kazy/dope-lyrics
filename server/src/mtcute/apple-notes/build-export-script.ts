export const DEFAULT_NOTES_FOLDER_PATH = 'Музыка/Рэпчик';
export const EXPORT_FOLDER_NAME = 'Dope Notes Export';

const escapeAppleScriptString = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

export const parseNotesFolderPath = (raw: string | undefined): string[] => {
  const source = (raw?.trim() || DEFAULT_NOTES_FOLDER_PATH).replaceAll(
    '\\',
    '/'
  );
  const segments = source
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    throw new Error('Путь папки Notes пустой');
  }

  return segments;
};

/** Музыка/Рэпчик → folder "Рэпчик" of folder "Музыка" */
export const buildNotesFolderExpression = (segments: string[]): string => {
  const safe = segments.map(escapeAppleScriptString);
  let expression = `folder "${safe[safe.length - 1]}"`;

  for (let index = safe.length - 2; index >= 0; index -= 1) {
    expression = `${expression} of folder "${safe[index]}"`;
  }

  return expression;
};

export const buildAppleNotesExportScript = (
  folderPath?: string
): { script: string; folderLabel: string; outputFolderLabel: string } => {
  const segments = parseNotesFolderPath(folderPath);
  const folderExpression = buildNotesFolderExpression(segments);
  const folderLabel = segments.join(' / ');
  const outputFolderLabel = `Desktop/${EXPORT_FOLDER_NAME}`;

  const script = `-- Экспорт папки Notes ${folderLabel} в txt с датами создания и правки.
-- Запуск: osascript «этот файл» или двойной клик в Script Editor (сохранить).
-- Выход: ~/${outputFolderLabel}/*.txt — сожми папку в zip и пришли боту.

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
	set badCharacters to {"/", ":", "\\\\", return, linefeed, character id 8232, character id 8233}
	
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

set outputFolder to (POSIX path of (path to desktop folder)) & "${EXPORT_FOLDER_NAME}/"

do shell script "mkdir -p " & quoted form of outputFolder
do shell script "find " & quoted form of outputFolder & " -maxdepth 1 -name " & quoted form of "*.txt" & " -delete"

tell application "Notes"
	set targetFolder to ${folderExpression}
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

display notification "Экспортировано заметок: " & counter with title "${EXPORT_FOLDER_NAME}"
return counter
`;

  return { script, folderLabel, outputFolderLabel };
};
