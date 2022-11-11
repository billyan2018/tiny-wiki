import * as minimatch from "minimatch";
import * as vscode from "vscode";
import { observable, runInAction } from "mobx";
import { Location, Range, Uri, workspace } from "vscode";
import { store,  WikiPage } from ".";
import { config } from "../config";
import {
  areEqualUris,
  findLinks,
  getPageFromLink,
  retrieveParentPath
} from "../utils";

async function getBackLinks({ uri, contents }: WikiPage) {
  const documentLinks = [...findLinks(contents!)];
  return Promise.all(
    documentLinks.map(async ({ title, contentStart, contentEnd }) => {
      const document = await workspace.openTextDocument(uri);
      const start = document.positionAt(contentStart);
      const end = document.positionAt(contentEnd);

      return {
        title,
        linePreview: document.lineAt(start).text,
        location: new Location(uri, new Range(start, end)),
      };
    })
  );
}

function createPage(uri: Uri) {
  let path = '/' + workspace.asRelativePath(uri, false);
  if (path.endsWith('.md')) {
    path = path.substring(0, path.length - '.md'.length);
  }

  return observable({
    uri,
    path,
    name: path.split("/").pop()!.replace(".md", ""),
  });
}

function getPage(uri: Uri) {
  return store.pages.find((page) => page.uri.toString() === uri.toString());
}

export function byteArrayToString(value: Uint8Array) {
  return new TextDecoder().decode(value);

}

async function updatePageContents(page: WikiPage) {
  page.contents = byteArrayToString(await workspace.fs.readFile(page.uri));
}

async function updatePageBacklinks(page: WikiPage) {
  const linkedPages = store.pages.filter(
    (linkedPage) =>
      linkedPage.backLinks &&
      linkedPage.backLinks.some((link) =>
        areEqualUris(link.location.uri, page.uri)
      )
  );

  const newLinks = await getBackLinks(page);

  runInAction(() => {
    for (const linkedPage of linkedPages) {
      linkedPage.backLinks = linkedPage.backLinks!.filter(
        (link) => !areEqualUris(link.location.uri, page.uri)
      );
    }
    const currentPath =  '/' + vscode.workspace.asRelativePath(vscode.window.activeTextEditor!.document.uri, false); 
    const currentParent = retrieveParentPath(currentPath);
    for (let link of newLinks) {
      const page = getPageFromLink(link.title, currentParent);
      if (page) {
        if (!page.backLinks) {
          page.backLinks = [];
        }

        page.backLinks.push(link);
      }
    }
  });
}




function getIgnoredFiles() {
  return `{${config.ignoredFiles.join(",")}}`;
}

export async function updateResources() {
  const ignoredFiles = getIgnoredFiles();
  const uris = await workspace.findFiles(`**​/*.{png,jpg,jpeg,PNG,JPG,JPEG}`, ignoredFiles, 500);

  store.resources = uris.map((uri) =>  '/' + workspace.asRelativePath(uri, false));
}

export async function updateWiki() {
  // TODO: Figure out how to find non-committed
  // files in github.dev

  const ignoredFiles = getIgnoredFiles();
  const pageUris = await workspace.findFiles(`**/*.md`, ignoredFiles, 500);

  const pages = pageUris.map((uri) => createPage(uri));
  store.pages = pages;
  store.isLoading = false;

  await Promise.all(pages.map((page) => updatePageContents(page)));
  await Promise.all(pages.map((page) => updatePageBacklinks(page)));
}

export async function initializeWiki(workspaceRoot: string) {
  store.isLoading = true;

  updateWiki();
  updateResources();

  const watcher = workspace.createFileSystemWatcher(`**/**.md`);

  watcher.onDidCreate(async (uri) => {
    if (
      uri.scheme === "vscode-userdata" ||
      minimatch(uri.path, getIgnoredFiles())
    ) {
      return;
    }

    let page = getPage(uri);
    let isNewPage = false;
    if (!page) {
      isNewPage = true;
      page = createPage(uri);
    }

    await updatePageContents(page);
    await updatePageBacklinks(page);

    if (isNewPage) {
      store.pages.push(page);
    }
  });

  watcher.onDidDelete(async (uri) => {
    // TODO: Scope changes to the current workspace
    if (uri.scheme === "vscode-userdata") {
      return;
    }

    const page = getPage(uri);
    if (!page) {
      return;
    }

    const linkedPages = store.pages.filter(
      (page) =>
        page.backLinks &&
        page.backLinks.find((link) => areEqualUris(link.location.uri, uri))
    );

    for (const page of linkedPages) {
      page.backLinks = page.backLinks!.filter(
        (link) => !areEqualUris(link.location.uri, uri)
      );
    }

    store.pages = store.pages.filter((page) => !areEqualUris(page.uri, uri));
  });

  watcher.onDidChange(async (uri) => {
    if (uri.scheme === "vscode-userdata") {
      return;
    }

    const page = getPage(uri);
    if (!page) {
      return;
    }

    await updatePageContents(page);
    await updatePageBacklinks(page);
  });
}
