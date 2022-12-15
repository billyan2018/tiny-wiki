import fetch from 'node-fetch';
import { ProgressLocation, window, workspace } from 'vscode';


import { stringToByteArray } from '../utils';
import htmlToMarkdown from '@wcj/html-to-markdown';

async function showInputBox(): Promise<string | undefined> {
	return await window.showInputBox({
		placeHolder: 'Input a URL',
		validateInput: text => {
			return text != null && text.length > 5 ? null : 'Input a valid URL';
		}
	});
}

export async function downloadPage(): Promise<void> {
	const url = await showInputBox();
	if (url == null) {
		return undefined;
	}
	const fileUrl = await window.showSaveDialog({filters: {
		'Markdown documents': ['md', 'markdown']}});
	if (fileUrl == null) {
		return undefined;
	}
	return await window.withProgress(
		{
			location: ProgressLocation.Notification,
			title: 'Retriving page',
		},
		async () => {
			const contentData = await fetch(url);
			const content = await contentData.text();
			const markdown = await htmlToMarkdown({ html:content});
			workspace.fs.writeFile(fileUrl, stringToByteArray(markdown));
		}
	);



}

