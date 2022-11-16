import {
  DocumentSelector,
  ProgressLocation,
  TextDocument,
  Uri,
  window
} from "vscode";

export function sanitizeName(name: string) {
  return name.replace(/\s/g, "-").replace(/[^\w\d-_]/g, "");
}

export const LINK_SELECTOR: DocumentSelector = [
  {
    language: "markdown",
  },
];




export function getPageFilePath(name: string) {
  let fileName = sanitizeName(name).toLocaleLowerCase();
  if (!fileName.endsWith(".md")) {
    fileName += ".md";
  }
  return fileName;
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
