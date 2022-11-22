import {
  DocumentSelector,
  ProgressLocation,
  TextDocument,
  Uri,
  window
} from "vscode";



export const LINK_SELECTOR: DocumentSelector = [
  {
    language: "markdown",
  },
];

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
