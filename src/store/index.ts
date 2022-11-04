import { observable } from "mobx";
import { Location, Uri } from "vscode";

export type WikiItem = WikiDirectory | WikiPage;

export interface WikiDirectory {
  name: string;
  path: string;
  pages: WikiItem[];
}

export interface WikiPage {
  uri: Uri;
  path: string;
  name: string;
  backLinks?: WikiPageBackLink[];
  contents?: string;
}

export interface WikiPageBackLink {
  linePreview: string;
  location: Location;
}

export const store = observable({
  isLoading: true,
  pages: <WikiPage[]>[],
});

export const treeStore = {
  tree: <WikiItem[]>[],
};
