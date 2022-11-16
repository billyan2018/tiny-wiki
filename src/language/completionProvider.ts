import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  languages,
  Position,
  Range,
  TextDocument,
  workspace
} from "vscode";
import { EXTENSION_NAME } from "../config";
import { getPageFromLink, store } from "../store";
import { WikiPage } from "../store/wiki-page";
import {
  LINK_SELECTOR,

  retrieveParentPath
} from "../utils";

export const LINK_PREFIX = "[[";
export const LINK_SUFFIX = "]]";

const RX_IMAGE = /\[(.*)\]\((.*)\)/;
class WikiLinkCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position
  ): CompletionItem[] | undefined {
    const lineText = document
      .lineAt(position)
      .text.slice(0, position.character);

    const linkOpening = lineText.lastIndexOf(LINK_PREFIX);
    if (linkOpening !== -1) {
      return this.completeLink(document, position, lineText, linkOpening);
    }
    const imageTagPos = lineText.search(RX_IMAGE);
    if (imageTagPos !== -1) {
      const currentPath =  '/' + workspace.asRelativePath(document.uri, false); 
      const currentParent = retrieveParentPath(currentPath);
      return store.resources.map((path) => {
        let itemPath = path;
        if (itemPath.startsWith(currentParent)) {
          itemPath = itemPath.substring(currentParent.length + 1);
        }
        return new CompletionItem(
          itemPath,
          CompletionItemKind.File
        );
      });
    }


  }
  completeLink(document: TextDocument,
    position: Position,
    lineText: string,
    linkOpening: number) : CompletionItem[] | undefined {
    const link = lineText.slice(linkOpening + LINK_PREFIX.length);
    if (link === undefined || link.includes(LINK_SUFFIX)) {
      return;
    }


    const wikipages = store.pages.filter(
      (page: WikiPage) => page.uri.toString() !== document.uri.toString()
    );

    const currentPath =  '/' + workspace.asRelativePath(document.uri, false); 
    const currentParent = retrieveParentPath(currentPath);
    const documentItems = wikipages.map((wikipage) => {
      let itemPath = wikipage.path;
      if (itemPath.startsWith(currentParent)) {
        itemPath = itemPath.substring(currentParent.length + 1);
      }
      const item = new CompletionItem(
        itemPath,
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

    if (!getPageFromLink(link, currentParent)) {
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
