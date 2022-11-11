import { commands, ExtensionContext, Uri, window, workspace } from "vscode";
import { EXTENSION_NAME } from "./config";
import { store } from "./store";
import { updateWiki } from "./store/actions";
import { getPageFilePath, removeLeadingSlash} from "./utils";
const { titleCase } = require("title-case");


function stringToByteArray(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}
function createWikiPage(name: string, oFilePath: string) {
  const title = titleCase(name);
  let fileHeading = `# ${title}

`;
   const pageUri = Uri.joinPath(workspace.workspaceFolders![0].uri, removeLeadingSlash(oFilePath));

  return workspace.fs.writeFile(pageUri, stringToByteArray(fileHeading));
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