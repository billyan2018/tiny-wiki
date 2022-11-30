import {
  Comment,
  CommentAuthorInformation,
  CommentController,
  CommentMode,
  comments,
  CommentThreadCollapsibleState,
  MarkdownString,
  Range,
  Uri,
  window,
  workspace
} from "vscode";
import { store } from "../store";
import { WikiPage, WikiPageBackLink } from "../store/wiki-page";
import { isWikiDocument } from "../utils";
import { config } from "../config";

const AUTHOR = Object.freeze({
  name: "Backlinks:",
  iconPath: Uri.parse(config.logoUrl),
});

export class WikiBacklinksComments implements Comment {
  body: string | MarkdownString;
  mode: CommentMode = CommentMode.Preview;
  author: CommentAuthorInformation;

  constructor(backlinks: WikiPageBackLink[]) {
    const content = backlinks
      .map((link) =>renderBackLink(link)
      )
      .join("\r\n");

    const markdown = new MarkdownString(content);
    markdown.isTrusted = true;

    this.body = markdown;

    this.author = AUTHOR;
  }
}

function renderBackLink(link: WikiPageBackLink) {
  const page = store.pages?.find(
    (page: WikiPage) => page.uri.toString() === link.location.uri.toString()
  );

  const title = page!.path;
  const args = [
    link.location.uri,
    {
      selection: {
        start: {
          line: link.location.range.start.line,
          character: link.location.range.start.character,
        },
        end: {
          line: link.location.range.end.line,
          character: link.location.range.end.character,
        },
      },
    },
  ];
  const command = `command:vscode.open?${encodeURIComponent(
    JSON.stringify(args)
  )}`;
  return `### [${title}](${command} 'Open the "${title}" page')
  
\`\`\`markdown
${link.linePreview}
\`\`\``;
}


let controller: CommentController | undefined;
export function registerCommentController() {
  window.onDidChangeActiveTextEditor((e) => {
    if (!e || !isWikiDocument(e.document)) {
      return;
    }


    const page = store.pages?.find(
      (page) => page.uri.toString() === e.document.uri.toString()
    );
    if (!page || !page.backLinks || page.backLinks.length === 0) {
      return;
    }

    if (controller) {
      controller.dispose();
      controller = undefined;
    }
    controller = comments.createCommentController(
      "tiny-wiki.backlinks",
      "tiny-wiki"
    );
    const comment = new WikiBacklinksComments(page.backLinks);
    const thread = controller.createCommentThread(
      e.document.uri,
      new Range(e.document.lineCount, 0, e.document.lineCount, 0),
      [comment]
    );

    thread.label = "tiny-wiki";
    thread.canReply = false;
    thread.collapsibleState = CommentThreadCollapsibleState.Expanded;

    workspace.onDidChangeTextDocument((change) => {
      if (change.document.uri.toString() === e.document.uri.toString()) {
        thread.range = new Range(
          e.document.lineCount,
          0,
          e.document.lineCount,
          0
        );
      }
    });
  });
}
