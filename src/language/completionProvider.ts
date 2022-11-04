import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  languages,
  Position,
  Range,
  TextDocument
} from "vscode";
import { EXTENSION_NAME } from "../constants";
import { store, WikiPage } from "../store";
import {
  getPageFromLink,
  LINK_PREFIX,
  LINK_SELECTOR,
  LINK_SUFFIX
} from "../utils";

class WikiLinkCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position
  ): CompletionItem[] | undefined {
    const lineText = document
      .lineAt(position)
      .text.slice(0, position.character);

    const linkOpening = lineText.lastIndexOf(LINK_PREFIX);
    if (linkOpening === -1) {
      return;
    }

    const link = lineText.slice(linkOpening + LINK_PREFIX.length);
    if (link === undefined || link.includes(LINK_SUFFIX)) {
      return;
    }

    const wikipages = store.pages!.filter(
      (page: WikiPage) => page.uri.toString() !== document.uri.toString()
    );
    console.log(wikipages);
    const documentItems = wikipages.map((wikipage) => {

      const item = new CompletionItem(
        wikipage.path.replace('.md', ''),
        CompletionItemKind.File
      );

      // Automatically save the document upon selection
      // in order to update the backlinks in the tree.
      item.command = {
        command: "workbench.action.files.save",
        title: "Reference document",
      };

      return item;
    });

    if (!getPageFromLink(link)) {
      const newDocumentItem = new CompletionItem(link, CompletionItemKind.File);
      newDocumentItem.detail = `Create new page page "${link}"`;

      // Since we're dynamically updating the range as the user types,
      // we need to ensure the range spans the enter document name.
      newDocumentItem.range = new Range(
        position.translate({ characterDelta: -link.length }),
        position
      );

      // As soon as the user accepts this item,
      // automatically create the new document.
      newDocumentItem.command = {
        command: `${EXTENSION_NAME}._createWikiPage`,
        title: "Create new page",
        arguments: [link],
      };

      documentItems.unshift(newDocumentItem);
    }

    return documentItems;
  }
}

// TODO: Figure out why word characters don't trigger completion
let triggerCharacters = [...Array(94).keys()].map((i) =>
  String.fromCharCode(i + 32)
);

export async function registerLinkCompletionProvider() {
  languages.registerCompletionItemProvider(
    LINK_SELECTOR,
    new WikiLinkCompletionProvider(),
    ...triggerCharacters
  );
}
