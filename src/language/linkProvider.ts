import {
  CancellationToken,
  commands,
  DocumentLink,
  DocumentLinkProvider,
  languages,
  Range,
  TextDocument,
  Uri,
} from "vscode";
import * as vscode from "vscode";
import { EXTENSION_NAME } from "../constants";
import {
  findLinks,
  getPageFromLink,
  LINK_SELECTOR,
  retrieveParentPath,
  withProgress,
} from "../utils";

class WikiDocumentLink extends DocumentLink {
  constructor(public title: string, range: Range, target?: Uri) {
    super(range, target);
  }
}

class WikiDocumentLinkProvider implements DocumentLinkProvider {
  public provideDocumentLinks(
    document: TextDocument
  ): WikiDocumentLink[] | undefined {
    const documentLinks = [...findLinks(document.getText())];
    return documentLinks.map(({ title, contentStart, contentEnd }) => {
      const linkRange = new Range(
        document.positionAt(contentStart),
        document.positionAt(contentEnd)
      );

      return new WikiDocumentLink(title, linkRange);
    });
  }

  async resolveDocumentLink(link: WikiDocumentLink, token: CancellationToken) {
    const currentPath =  '/' + vscode.workspace.asRelativePath(vscode.window.activeTextEditor!.document.uri, false); 
    const currentParent = retrieveParentPath(currentPath);
    let page = getPageFromLink(link.title, currentParent);
    if (!page) {
      await withProgress("Creating page...", async () =>
        commands.executeCommand(`${EXTENSION_NAME}._createWikiPage`, link.title)
      );
      page = getPageFromLink(link.title, currentParent);
    }

    link.target = page!.uri;
    return link;
  }
}

export function registerDocumentLinkProvider() {
  languages.registerDocumentLinkProvider(
    LINK_SELECTOR,
    new WikiDocumentLinkProvider()
  );
}
