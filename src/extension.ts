import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { config } from './config';
import { registerLinkCompletionProvider } from './language/completionProvider';
import { registerDefinitionProvider } from './language/definition';
import { registerHoverProvider } from './language/hoverProvider';
import { registerDocumentLinkProvider } from './language/linkProvider';
import { registerCommentController } from './links/comments';
import { registerLinkDecorator } from './links/decorator';
import { extendMarkdownIt } from './links/markdownPreview';
import { initializeWiki } from './store';

function initialize() {
  const workspace = vscode.workspace.workspaceFolders?.[0];
  if (workspace && config.enabled) {
    vscode.commands.executeCommand(
      'setContext',
      'tiny-wiki:isWikiWorkspace',
      true
    );

    initializeWiki();
  } else {
    vscode.commands.executeCommand(
      'setContext',
      'tiny-wiki:isWikiWorkspace',
      false
    );
  }
}

export function activate(context: vscode.ExtensionContext) {
  registerCommands(context);
  registerLinkDecorator();
  registerHoverProvider();
  registerLinkCompletionProvider();
  registerDocumentLinkProvider();
  registerDefinitionProvider();
  registerCommentController();

  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('tiny-wiki.enabled')) {
      initialize();
    }
  });

  initialize();

  return {
    extendMarkdownIt,
  };
}
