import { window, workspace} from 'vscode';

import { isWikiDocument, retrieveParentPath } from '../utils';
import { getPageFromLink, getUriFromLink } from '../store';

import * as markdownit from 'markdown-it';


export function extendMarkdownIt(md: any) {
  const currentPath =  '/' + workspace.asRelativePath(window.activeTextEditor!.document.uri, false);
  const currentParent = retrieveParentPath(currentPath);
  return md
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .use(require('markdown-it-regex').default, {
      name: 'tiny-wiki-links',
      regex: /(?<!)(?:\[\[)([^\]]+?)(?:\]\])/,
      replace: (olink: string) => {
        if (!isWikiDocument(window.activeTextEditor!.document)) {
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
        if (!isWikiDocument(window.activeTextEditor!.document)) {
          return;
        }

        console.log('GW Displaying link');

        const page = getPageFromLink(link, currentParent);
        if (page) {
          console.log('GW Got page: ', page);
          //const markdown = require('markdown-it')();
          markdownit().renderer.rules.heading_open = (
            tokens: any,
            index: number,
            options: any,
            env: any,
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
