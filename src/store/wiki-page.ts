import { Location, Range, Uri, workspace } from 'vscode';
import { findLinks } from './wiki-link';


export class WikiPage {

  backLinks?: WikiPageBackLink[];
  contents?: string;

  constructor(readonly uri: Uri,
    readonly path: string,
    readonly name: string) {}

  static fromUri(uri: Uri): WikiPage {
      let path = '/' + workspace.asRelativePath(uri, false);
      if (path.endsWith('.md')) {
        path = path.substring(0, path.length - '.md'.length);
      }
      let name = path;
      const pos = path.lastIndexOf('/');
      if (pos > 0) {
        name = path.slice(0, pos);
      }
      name = name.replace('.md', '');
      return new WikiPage(uri, path, name);
  }

  async getBackLinks() {
    const documentLinks = [...findLinks(this.contents || '')];
    return Promise.all(
      documentLinks.map(async ({ title, contentStart, contentEnd }) => {
        const document = await workspace.openTextDocument(this.uri);
        const start = document.positionAt(contentStart);
        const end = document.positionAt(contentEnd);
        const range = new Range(start, end);
        return {
          title,
          linePreview: document.lineAt(start).text,
          location: new Location(this.uri, range),
        };
      })
    );
  }

  async updatePageContents() {
    this.contents = byteArrayToString(await workspace.fs.readFile(this.uri));
  }

}

function byteArrayToString(value: Uint8Array) {
  return new TextDecoder().decode(value);
}

export interface WikiPageBackLink {
  linePreview: string;
  location: Location;
}

