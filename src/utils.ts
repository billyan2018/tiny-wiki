import {
  DocumentSelector,
  ProgressLocation,
  TextDocument,
  Uri,
  window
} from "vscode";
import { store, WikiPage } from "./store";

export function sanitizeName(name: string) {
  return name.replace(/\s/g, "-").replace(/[^\w\d-_]/g, "");
}

export const LINK_SELECTOR: DocumentSelector = [
  {
    language: "markdown",
  },
];


export const LINK_PATTERN =
  /(?:\s|^)((?:[#\!]?\[\[)(?<page>[^\]`]+)(?:\]\])|#(?<tag>[^\s#`,]+))/gim;


export function getPageFilePath(name: string) {
  let fileName = sanitizeName(name).toLocaleLowerCase();
  if (!fileName.endsWith(".md")) {
    fileName += ".md";
  }
  return fileName;
}

export interface WikiLink {
  title: string;
  start: number;
  end: number;
  contentStart: number;
  contentEnd: number;
}

export function* findLinks(contents: string): Generator<WikiLink> {
  let match;
  while ((match = LINK_PATTERN.exec(contents))) {
    const title = match.groups!.page || match.groups!.tag;
    const start = match.index;
    const end = start + match[0].length;
    const contentStart = start + match[0].indexOf(title);
    const contentEnd = contentStart + title.length;
    console.log(title);
    yield {
      title,
      start,
      end,
      contentStart,
      contentEnd,
    };
  }
}

export function getPageFromLink(link: string, basePath: string): WikiPage {
  const path = link.startsWith('/') ? link : basePath + '/' + link;
  return store.pages.find(
    (page) => page.path.replace(".md", "") === path
  )!;
}

export function getUriFromLink(link: string, basePath: string) {
  const page = getPageFromLink(link, basePath);
  return page?.uri;
}

export function withProgress<T>(title: string, action: () => Promise<T>) {
  return window.withProgress(
    {
      location: ProgressLocation.Notification,
      title,
    },
    action
  );
}

export function areEqualUris(uri: Uri, otherUri: Uri) {
  return uri.toString().localeCompare(otherUri.toString()) === 0;
}

export function isWikiDocument(document: TextDocument) {
  return document.uri.path.endsWith(".md");
}

export function removeLeadingSlash(oFilePath: string) {
  return oFilePath.startsWith('/') ? oFilePath.substring(1) : oFilePath;
}

export function retrieveParentPath(currentPath: string) {
  const pathPars = currentPath.split('/');
  pathPars.pop();
  return pathPars.join('/');
}
