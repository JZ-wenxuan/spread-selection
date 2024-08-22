const vscode = require('vscode');

function activate(context) {
	const disposable = vscode.commands.registerCommand('spread-selection.spread-selection', async function () {
		// Check if there is a multi-line clipboard
		const clipboard = await vscode.env.clipboard.readText();
		if (!clipboard) {
			vscode.window.showErrorMessage('No text found in the clipboard.');
			return;
		}

		const clipboardLines = clipboard.split('\n');
		if (clipboardLines.length <= 1) {
			vscode.window.showInformationMessage('Clipboard does not have multiple lines.');
			return;
		}

		// Check if there is a single selection
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}

		const selections = editor.selections;
		if (selections.length === 0) {
			vscode.window.showInformationMessage('No selection found.');
			return;
		}
		if (selections.length > 1) {
			vscode.window.showInformationMessage('Cannot spread multi-cursor selection.');
			return;
		}

		// Check if the selection is empty and grab the line
		const selection = selections[0];
		const targetRange = selection.isEmpty ? editor.document.lineAt(selection.start.line).rangeIncludingLineBreak : selection;
	
		const text = editor.document.getText(targetRange);
		const repeatedText = text.repeat(clipboardLines.length);
		await editor.edit(editBuilder => {
			editBuilder.replace(targetRange, repeatedText);
		});
		
		const lineIncrement = targetRange.end.line - targetRange.start.line;
		const charIncrement = targetRange.end.character - targetRange.start.character;
		
		// Add cursor to every duplicate
		editor.selections = clipboardLines.map((_, index) => {
			const lineOffset = lineIncrement * index;
			const charOffset = lineIncrement === 0 ? charIncrement * index : 0;
			const start = selection.start.translate(lineOffset, lineOffset ? charIncrement : charOffset);
			const end = selection.end.translate(lineOffset, charOffset);
			return selection.isReversed ? new vscode.Selection(end, start) : new vscode.Selection(start, end);
		});
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
