import { workspace } from "vscode";

export const EXTENSION_NAME = "tiny-wiki";

function getConfigSetting(settingName: string, defaultValue?: any) {
  return workspace
    .getConfiguration(EXTENSION_NAME)
    .get(settingName, defaultValue);
}

export const config = {
  get dailyDirectName() {
    return getConfigSetting("daily.directoryName");
  },
  get dailyTitleFormat() {
    return getConfigSetting("daily.titleFormat", "LL");
  },
  get enabled() {
    return getConfigSetting("enabled", true);
  },
  get ignoredFiles() {
    return getConfigSetting("ignoredFiles", [
      "**/node_modules/**",
      "**/.vscode/**",
      "**/.github/**",
    ]);
  },
};
