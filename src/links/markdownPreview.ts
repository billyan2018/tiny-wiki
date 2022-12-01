import { window, workspace} from 'vscode';

import { isWikiDocument, retrieveParentPath } from '../utils';
import { getPageFromLink, getUriFromLink } from '../store';

import * as markdownit from 'markdown-it';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extendMarkdownIt(md: any) {
  if (window.activeTextEditor == null) {
    return;
  }
  const document = window.activeTextEditor.document;
  const currentPath =  '/' + workspace.asRelativePath(document.uri, false);
  const currentParent = retrieveParentPath(currentPath);
  return md
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .use(require('markdown-it-regex').default, {
      name: 'tiny-wiki-links',
      regex: /(?<!)(?:\[\[)([^\]]+?)(?:\]\])/,
      replace: (olink: string) => {
        if (!isWikiDocument(document)) {
          return;
        }
        let link = olink;
        let text = olink;
        const pos = link.indexOf('|');
        if (pos >= 0) {
          link = olink.slice(0, pos);
          text = olink.slice(pos + 1);
        }
        const linkUri = getUriFromLink(link, currentParent);
        const args = encodeURIComponent(JSON.stringify([linkUri]));
        const href = `command:vscode.open?${args}`;

        return `[[<a href=${href}>${text}</a>]]`;
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .use(require('markdown-it-regex').default, {
      name: 'tiny-wiki-embeds',
      regex: /(?:!\[\[)([^\]]+?)(?:\]\])/,
      replace: (link: string) => {
        console.log('GW Displaying link');

        const page = getPageFromLink(link, currentParent);
        if (page) {
          console.log('GW Got page: ', page);

          markdownit().renderer.rules.heading_open = (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tokens: any,
            index: number,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options: any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            env: any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            self: any
          ) => {
            tokens[index].attrSet(
              'style',
              'text-align: center; border: 0; margin: 10px 0 5px 0'
            );
            return self.renderToken(tokens, index, options, env, self);
          };

          const htmlContent = markdownit().render(page.contents ?? '');
          return `<div>
<hr />
${htmlContent}
<hr />
</div>`;
        }
      },
    });
}
