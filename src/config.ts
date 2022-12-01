import { workspace } from 'vscode';

export const EXTENSION_NAME = 'tiny-wiki';

function getConfigSetting(settingName: string, defaultValue?: boolean | string[]) {
  return workspace
    .getConfiguration(EXTENSION_NAME)
    .get(settingName, defaultValue);
}

export const config = {
  get enabled() {
    return getConfigSetting('enabled', true);
  },
  get logoUrl() {
    return 'https://cdn.jsdelivr.net/gh/billyan2018/tiny-wiki/images/logo.png';
  },
  get ignoredFiles(): string[] {
    const configed = getConfigSetting('ignoredFiles', [
      '**/node_modules/**',
      '**/.vscode/**',
      '**/.github/**',
    ]);
    return configed as string[];
  },
};
