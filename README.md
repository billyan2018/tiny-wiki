# tiny-wiki

A **simple** yet powerful wiki/note-taking extension for vscode.

![](images/demo-link.gif)

## Features
- Helps to **link** your notes(Markdown documents) together. To refer to another Markdown document in your current one, just type:
```markdown
[[path-of-another-note]]
```
Note: the path starts with the root of the workspace and use `/` as directory separator. Also, the extension of `md` will be eliminated.

- Autocomplete the path of the markdown filename. Typing inside `[[]]` will trigger the wiki autocomplete:
![](./images/auto-complete.png)

- Autocomplete image resource. Typing inside the `()` part of `![]()` will trigger the resource autocomplete.

