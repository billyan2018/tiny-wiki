import { commands, ExtensionContext, Uri, window, workspace } from 'vscode';
import { EXTENSION_NAME } from './config';
import { downloadPage } from './crewler/crewler';
import { store, updateWiki } from './store';
import { retrieveParentPath, stringToByteArray } from './utils';


function createWikiPageWithContent(oFilePath: string, content: string) {
  if (window.activeTextEditor == null) {
    return;
  }
  const parentDir = retrieveParentPath(window.activeTextEditor.document.uri.fsPath);
  const parentUrl = Uri.file(parentDir);
  const pageUri = Uri.joinPath(parentUrl, removeLeadingSlash(oFilePath));

  return workspace.fs.writeFile(pageUri, stringToByteArray(content));
}

function createWikiPage(path: string, oFilePath: string) {

  let title = path;
  const pos = path.lastIndexOf('/');
  if (pos >= 0) {
    title = path.slice(pos + 1);
  }

  const fileHeading = `# ${title}

`;
  return createWikiPageWithContent(oFilePath,fileHeading);
}

function removeLeadingSlash(oFilePath: string) {
  return oFilePath.startsWith('/') ? oFilePath.substring(1) : oFilePath;
}

function sanitizeName(name: string) {
  return name.replace(/\s/g, '-');//.replace(/[^\w\d-_]/g, '');
}
function getPageFilePath(link: string) {
  let name = link;
  const pos = name.indexOf('|');
  if (pos >= 0) {
    name = link.slice(0,pos).trim();
  }
  let fileName = sanitizeName(name).toLocaleLowerCase();
  if (!fileName.endsWith('.md')) {
    fileName += '.md';
  }
  return fileName;
}

export function registerCommands(context: ExtensionContext) {
  // This is a private command that handles dynamically
  // creating wiki documents, when the user auto-completes
  // a new document link that doesn't exist.
  context.subscriptions.push(
    commands.registerCommand(
      `${EXTENSION_NAME}._createWikiPage`,
      async (name: string) => {
        const fileName = getPageFilePath(name);
        createWikiPage(name, fileName);

        // Automatically save the current, in order to ensure
        // the newly created backlink is discovered.
        await window.activeTextEditor?.document.save();
      }
    )
  );

  context.subscriptions.push(
    commands.registerCommand(`${EXTENSION_NAME}.refreshWiki`, async () => {
      store.isLoading = true;
      updateWiki();
    })
  );

  context.subscriptions.push(
    commands.registerCommand(`${EXTENSION_NAME}.downloadPage`, async () => {
      const content = await downloadPage();
      if (content == null) {
        return;
      }
      //createWikiPageWithContent('test.md', content);
      //await window.activeTextEditor?.document.save();
    })
  );
}