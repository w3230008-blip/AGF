import { contextBridge } from 'electron/renderer'
import api, { titleLangApi } from './interface.js'

contextBridge.exposeInMainWorld('ftElectron', api)
contextBridge.exposeInMainWorld('ftTitleLang', titleLangApi)
