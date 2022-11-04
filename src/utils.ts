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

export const LINK_PREFIX = "[[";
export const LINK_SUFFIX = "]]";
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

export function getPageFromLink(link: string): WikiPage {
  return store.pages!.find(
    (page) => page.path.replace(".md", "") === link
  )!;
}

export function getUriFromLink(link: string) {
  const page = getPageFromLink(link);
  return page?.uri;
}

export function byteArrayToString(value: Uint8Array) {
  //return new TextDecoder().decode(value);
  let result = '';
  for (var i = 0; i < value.length; ++i) {
      const byte = value[i];
      const text = byte.toString(16);
      result += (byte < 16 ? '%0' : '%') + text;
  }
  return decodeURIComponent(result);
}

export function stringToByteArray(value: string): Uint8Array {
  //return new TextEncoder().encode(value);
  const buffer = Buffer.from(value, 'utf8');
  const result = new Uint8Array(buffer.length);
	//const result = Array(buffer.length);
	for (let i = 0; i < buffer.length; i++) {
		result[i] = buffer[i];
	}
	return result;
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
