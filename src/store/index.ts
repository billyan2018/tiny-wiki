import * as minimatch from 'minimatch';
import { observable, runInAction } from 'mobx';
import { Uri, workspace, window } from 'vscode';
import { WikiPage } from './wiki-page';
import { config } from '../config';
import {
  retrieveParentPath,
} from '../utils';

export const store = observable({
  isLoading: true,
  pages: <WikiPage[]>[],
  resources: <string[]>[],
});

function areEqualUris(uri: Uri, otherUri: Uri) {
  return uri.toString().localeCompare(otherUri.toString()) === 0;
}

async function updateResources() {
  const ignoredFiles = getIgnoredFiles();
  const uris = await workspace.findFiles('**​/*.{png,jpg,jpeg,PNG,JPG,JPEG}', ignoredFiles, 500);

  store.resources = uris.map((uri) =>  '/' + workspace.asRelativePath(uri, false));
}

export async function initializeWiki() {
  store.isLoading = true;

  updateWiki();
  updateResources();

  const watcher = workspace.createFileSystemWatcher('**/**.md');

  watcher.onDidCreate(async (uri) => {
    if (
      uri.scheme === 'vscode-userdata' ||
      minimatch(uri.path, getIgnoredFiles())
    ) {
      return;
    }

    let page = getPage(uri);
    let isNewPage = false;
    if (!page) {
      isNewPage = true;
      page = WikiPage.fromUri(uri);
    }

    await page.updatePageContents();
    await updatePageBacklinks(page);

    if (isNewPage) {
      store.pages.push(page);
    }
  });

  watcher.onDidDelete(async (uri) => {
    // TODO: Scope changes to the current workspace
    if (uri.scheme === 'vscode-userdata') {
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
      page.backLinks = page.backLinks?.filter(
        (link) => !areEqualUris(link.location.uri, uri)
      );
    }

    store.pages = store.pages.filter((page) => !areEqualUris(page.uri, uri));
  });

  watcher.onDidChange(async (uri) => {
    if (uri.scheme === 'vscode-userdata') {
      return;
    }

    const page = getPage(uri);
    if (!page) {
      return;
    }

    await page.updatePageContents();
    await updatePageBacklinks(page);
  });
}

export async function updateWiki() {
  const ignoredFiles = getIgnoredFiles();
  const pageUris = await workspace.findFiles('**/*.md', ignoredFiles, 500);

  const pages = pageUris.map((uri) => WikiPage.fromUri(uri));
  store.pages = pages;
  store.isLoading = false;

  await Promise.all(pages.map((page) => page.updatePageContents()));
  await Promise.all(pages.map((page) => updatePageBacklinks(page)));
}

function getPage(uri: Uri) {
  return store.pages.find((page) => page.uri.toString() === uri.toString());
}




function getIgnoredFiles() {
  return `{${config.ignoredFiles.join(',')}}`;
}

async function updatePageBacklinks(page: WikiPage) {

  const linkedPages = store.pages.filter(
    (linkedPage) =>
      linkedPage.backLinks &&
      linkedPage.backLinks.some((link) =>
        areEqualUris(link.location.uri, page.uri)
      )
  );

  const newLinks = await page.getBackLinks();

  runInAction(() => {
    for (const linkedPage of linkedPages) {
      linkedPage.backLinks = linkedPage.backLinks?.filter(
        (link) => !areEqualUris(link.location.uri, page.uri)
      );
    }
    if (window.activeTextEditor == null) {
      return;
    }
    const currentPath =  '/' + workspace.asRelativePath(window.activeTextEditor.document.uri, false);
    const currentParent = retrieveParentPath(currentPath);
    for (const link of newLinks) {
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

export function getPageFromLink(link: string, basePath: string): WikiPage| undefined {
  const path = link.startsWith('/') ? link : basePath + '/' + link;
  return store.pages.find(
    (page: WikiPage) => page.path.replace('.md', '') === path
  );
}

export function getUriFromLink(link: string, basePath: string) {
  const page = getPageFromLink(link, basePath);
  return page?.uri;
}










