import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const toggleDisposable = vscode.commands.registerCommand('splitjoin-vscode.toggle', () => {
		toggleArguments();
	});

	const splitDisposable = vscode.commands.registerCommand('splitjoin-vscode.split', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor for split.');
			return;
		}
		const position = editor.selection.active;
		const region = findEnclosingBracketRegion(editor, position);
		if (region) {
			splitArguments(editor, region);
		} else {
			vscode.window.showInformationMessage('No enclosing brackets found for split.');
		}
	});

	const joinDisposable = vscode.commands.registerCommand('splitjoin-vscode.join', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor for join.');
			return;
		}
		const position = editor.selection.active;
		const region = findEnclosingBracketRegion(editor, position);
		if (region) {
			joinArguments(editor, region);
		} else {
			vscode.window.showInformationMessage('No enclosing brackets found for join.');
		}
	});

	context.subscriptions.push(toggleDisposable, splitDisposable, joinDisposable);
}

function toggleArguments() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor.');
		return;
	}

	const position = editor.selection.active;
	const region = findEnclosingBracketRegion(editor, position);

	if (region) {
		const contentStart = region.start.translate(0, 1);
		const contentEnd = region.end.translate(0, -1);
		
		if (contentStart.isAfterOrEqual(contentEnd)) {
			vscode.window.showInformationMessage(`Region found: ${editor.document.getText(region)}. Content is empty/single-line. Ready to split.`);
			splitArguments(editor, region);
			return;
		}

		const contentRange = new vscode.Range(contentStart, contentEnd);
		const contentText = editor.document.getText(contentRange);

		const isMultiLine = contentRange.start.line !== contentRange.end.line;

		if (isMultiLine) {
			vscode.window.showInformationMessage(`Region found: ${editor.document.getText(region)}. Content is multi-line. Ready to join.`);
			joinArguments(editor, region);
		} else {
			vscode.window.showInformationMessage(`Region found: ${editor.document.getText(region)}. Content is single-line. Ready to split.`);
			splitArguments(editor, region);
		}
	} else {
		vscode.window.showInformationMessage('No enclosing brackets found around the cursor.');
	}
}

function findMatchingClosingBracket(document: vscode.TextDocument, openCharPosition: vscode.Position, openChar: string, closeChar: string): vscode.Position | undefined {
	let balance = 1;

	for (let lineNum = openCharPosition.line; lineNum < document.lineCount; lineNum++) {
		const lineText = document.lineAt(lineNum).text;
		const startCharIdx = (lineNum === openCharPosition.line) ? openCharPosition.character + 1 : 0;

		for (let charIdx = startCharIdx; charIdx < lineText.length; charIdx++) {
			const char = lineText[charIdx];
			if (char === openChar) {
				balance++;
			} else if (char === closeChar) {
				balance--;
				if (balance === 0) {
					return new vscode.Position(lineNum, charIdx);
				}
			}
		}
	}
	return undefined;
}

function isRangeSmaller(range1: vscode.Range, range2: vscode.Range, document: vscode.TextDocument): boolean {
	const range1StartOffset = document.offsetAt(range1.start);
	const range1EndOffset = document.offsetAt(range1.end);
	const range2StartOffset = document.offsetAt(range2.start);
	const range2EndOffset = document.offsetAt(range2.end);

	const size1 = range1EndOffset - range1StartOffset;
	const size2 = range2EndOffset - range2StartOffset;

	return size1 < size2;
}

function findEnclosingBracketRegion(editor: vscode.TextEditor, position: vscode.Position): vscode.Range | undefined {
	const bracketPairs = [
		{ open: '(', close: ')' },
		{ open: '[', close: ']' },
		{ open: '{', close: '}' },
	];

	let smallestRange: vscode.Range | undefined = undefined;
	const document = editor.document;

	for (let lineNum = position.line; lineNum >= 0; lineNum--) {
		const lineText = document.lineAt(lineNum).text;
		const startSearchChar = (lineNum === position.line) ? position.character : lineText.length -1;

		for (let charIdx = startSearchChar; charIdx >= 0; charIdx--) {
			const char = lineText[charIdx];
			const pairConfig = bracketPairs.find(p => p.open === char);

			if (pairConfig) {
				const openPos = new vscode.Position(lineNum, charIdx);
				const closePos = findMatchingClosingBracket(document, openPos, pairConfig.open, pairConfig.close);

				if (closePos) {
					const currentRange = new vscode.Range(openPos, closePos.translate(0, 1));

					if (currentRange.contains(position)) {
						if (!smallestRange || isRangeSmaller(currentRange, smallestRange, document)) {
							smallestRange = currentRange;
						}
					}
				}
			}
		}
	}
	return smallestRange;
}

function parseArgumentsAdvanced(contentText: string): string[] {
	const args: string[] = [];
	if (contentText.trim() === "") {
		return [];
	}

	let currentArgStartIndex = 0;
	let parenBalance = 0;
	let squareBalance = 0;
	let curlyBalance = 0;
	let inString: '"' | "'" | null = null;
	let escapeNext = false;

	for (let i = 0; i < contentText.length; i++) {
		const char = contentText[i];

		if (escapeNext) {
			escapeNext = false;
			continue;
		}

		if (char === '\\') {
			escapeNext = true;
			continue;
		}

		if (inString === '"') {
			if (char === '"') inString = null;
			continue;
		} else if (inString === "'") {
			if (char === "'") inString = null;
			continue;
		} else {
			switch (char) {
				case '"':
				case "'":
					inString = char;
					break;
				case '(':
					parenBalance++;
					break;
				case ')':
					parenBalance--;
					break;
				case '[':
					squareBalance++;
					break;
				case ']':
					squareBalance--;
					break;
				case '{':
					curlyBalance++;
					break;
				case '}':
					curlyBalance--;
					break;
				case ',':
					if (parenBalance === 0 && squareBalance === 0 && curlyBalance === 0) {
						args.push(contentText.substring(currentArgStartIndex, i));
						currentArgStartIndex = i + 1;
					}
					break;
			}
		}
	}

	args.push(contentText.substring(currentArgStartIndex));
	
	return args.map(arg => arg.trim()).filter(arg => arg.length > 0 || contentText.trim() === arg.trim());
}

function splitArguments(editor: vscode.TextEditor, region: vscode.Range) {
	const document = editor.document;
	const originalText = document.getText(region);
	if (originalText.length < 2) { return; }

	const openingBracket = originalText[0];
	const closingBracket = originalText[originalText.length - 1];

	const contentStart = region.start.translate(0, 1);
	const contentEnd = region.end.translate(0, -1);
	let contentText = "";
	let isEmptyContent = true;
	if (contentStart.isBefore(contentEnd)) {
		contentText = document.getText(new vscode.Range(contentStart, contentEnd));
		isEmptyContent = contentText.trim() === "";
	}

	const startLineNumber = region.start.line;
	const startLine = document.lineAt(startLineNumber);
	const baseIndentMatch = startLine.text.match(/^(\s*)/);
	const baseIndent = baseIndentMatch ? baseIndentMatch[0] : "";

	let argIndent = baseIndent;
	if (editor.options.insertSpaces && typeof editor.options.tabSize === 'number') {
		argIndent += ' '.repeat(editor.options.tabSize);
	} else {
		argIndent += '\t';
	}

	const args = isEmptyContent ? [] : parseArgumentsAdvanced(contentText);

	let newText = openingBracket + '\n';
	if (args.length > 0) {
		newText += args.map(arg => `${argIndent}${arg}`).join(',\n');
		newText += '\n';
	} else if (isEmptyContent) {
        newText += argIndent; 
        newText += '\n';
    }
	newText += baseIndent + closingBracket;

	editor.edit(editBuilder => {
		editBuilder.replace(region, newText);
	});
}

function joinArguments(editor: vscode.TextEditor, region: vscode.Range) {
	const document = editor.document;

	const originalText = document.getText(region);
	if (originalText.length < 2) { return; }

	const openingBracket = originalText[0];
	const closingBracket = originalText[originalText.length - 1];

	const contentStart = region.start.translate(0, 1);
	const contentEnd = region.end.translate(0, -1);

	if (contentStart.isAfterOrEqual(contentEnd) || contentStart.line === contentEnd.line) {
		let currentContent = "";
		if(contentStart.isBefore(contentEnd)){
			currentContent = document.getText(new vscode.Range(contentStart, contentEnd));
		}
		const trimmedContent = currentContent.split('\n').map(line => line.trim()).filter(line => line.length > 0).join(' ');
		const args = trimmedContent.split(',').map(arg => arg.trim()).filter(arg => arg.length > 0);
		const newText = openingBracket + args.join(', ') + closingBracket;
		if (document.getText(region) !== newText) {
			editor.edit(editBuilder => {
				editBuilder.replace(region, newText);
			});
		}
		return;
	}

	const contentText = document.getText(new vscode.Range(contentStart, contentEnd));
	const lines = contentText.split('\n');

	const processedArgs = lines.map(line => {
		let trimmedLine = line.trim();
		if (trimmedLine.endsWith(',')) {
			trimmedLine = trimmedLine.substring(0, trimmedLine.length - 1).trimEnd();
		}
		return trimmedLine;
	}).filter(line => line.length > 0);

	const joinedArguments = processedArgs.join(', ');
	const finalText = openingBracket + joinedArguments + closingBracket;

	editor.edit(editBuilder => {
		editBuilder.replace(region, finalText);
	});
}

export function deactivate() {}
