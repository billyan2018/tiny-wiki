export const LINK_PATTERN =
  /(?:\s|^)((?:[#!]?\[\[)(?<page>[^\]`]+)(?:\]\])|#(?<tag>[^\s#`,]+))/gim;

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
