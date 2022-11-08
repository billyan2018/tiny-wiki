import {
  Hover,
  HoverProvider,
  languages,
  MarkdownString,
  Position,
  Range,
  TextDocument,
  workspace,
} from "vscode";
import { findLinks, getPageFromLink, LINK_SELECTOR, retrieveParentPath } from "../utils";

class LinkHoverProvider implements HoverProvider {
  public provideHover(document: TextDocument, position: Position) {
    const currentUrl = document.uri.toString();
    const currentPath = workspace.asRelativePath(currentUrl, false);
    const currentParent = retrieveParentPath(currentPath);
    const line = document.lineAt(position).text;
    const links = [...findLinks(line)];
    if (!links) {
      return;
    }

    const link = links.find(({ start, end }) => {
      const range: Range = new Range(position.line, start, position.line, end);
      return range.contains(position);
    });

    if (!link) {
      return;
    }

    const treeItem = getPageFromLink(link.title, currentParent);
    if (treeItem) {
      const contents = new MarkdownString(treeItem.contents);
      return new Hover(contents);
    }
  }
}

export function registerHoverProvider() {
  languages.registerHoverProvider(LINK_SELECTOR, new LinkHoverProvider());
}
