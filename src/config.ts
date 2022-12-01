import { workspace } from 'vscode';

export const EXTENSION_NAME = 'tiny-wiki';

function getConfigSetting(settingName: string, defaultValue?: any) {
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
  get ignoredFiles() {
    return getConfigSetting('ignoredFiles', [
      '**/node_modules/**',
      '**/.vscode/**',
      '**/.github/**',
    ]);
  },
};
