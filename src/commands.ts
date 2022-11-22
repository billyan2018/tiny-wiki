import { commands, ExtensionContext, Uri, window, workspace } from "vscode";
import { EXTENSION_NAME } from "./config";
import { store } from "./store";
import { updateWiki } from "./store";
import { removeLeadingSlash} from "./utils";



function stringToByteArray(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}
function createWikiPage(path: string, oFilePath: string) {

  let title = path;
  const pos = path.lastIndexOf('/');
  if (pos >= 0) {
    title = path.slice(pos + 1);
  }

  let fileHeading = `# ${title}

`;
   const pageUri = Uri.joinPath(workspace.workspaceFolders![0].uri, removeLeadingSlash(oFilePath));

  return workspace.fs.writeFile(pageUri, stringToByteArray(fileHeading));
}

function sanitizeName(name: string) {
  return name.replace(/\s/g, "-");//.replace(/[^\w\d-_]/g, "");
}
function getPageFilePath(name: string) {
  let fileName = sanitizeName(name).toLocaleLowerCase();
  if (!fileName.endsWith(".md")) {
    fileName += ".md";
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
}