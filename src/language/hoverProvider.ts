import {
  Hover,
  HoverProvider,
  languages,
  MarkdownString,
  Position,
  Range,
  TextDocument,
  Uri,
  window,
  workspace,
} from "vscode";
import { findLinks, getPageFromLink, LINK_SELECTOR, retrieveParentPath } from "../utils";

class LinkHoverProvider implements HoverProvider {
  public provideHover(document: TextDocument, position: Position) {
    const currentPath =  '/' + workspace.asRelativePath(window.activeTextEditor!.document.uri, false); 
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

    const page = getPageFromLink(link.title, currentParent);
    if (page) {
      const text = page.contents;
      const proceededText = this.proceedLinks(text || '', page.path);
      const contents = new MarkdownString(proceededText);
      return new Hover(contents);
    }
  }
  proceedLinks(text: string, pagePath: string): string {
    const basePath = retrieveParentPath(pagePath);
    return text.replace(/\[(.*)\]\((.*)\)/, (url) => {
      const posStart = url.indexOf('(');
      const posEnd = url.indexOf(')');
      const link = url.slice(posStart + 1, posEnd);
      const path = link.startsWith('/') ? link : basePath + '/' + link;
      const imageUri = Uri.joinPath(
        workspace.workspaceFolders![0].uri, path).toString();
      return `[](${imageUri})`;
    });

  }
}

export function registerHoverProvider() {
  languages.registerHoverProvider(LINK_SELECTOR, new LinkHoverProvider());
}
