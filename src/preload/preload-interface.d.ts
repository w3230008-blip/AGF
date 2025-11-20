type FtElectronApi = typeof import('./interface.js').default
type FtTitleLangApi = typeof import('./interface.js').titleLangApi

declare global {
  interface Window {
    ftElectron: FtElectronApi
    ftTitleLang: FtTitleLangApi
  }
}

export {}
