import {
  localforage,
  // CrypticStorage,
} from '../imports.js'
import Config from '../manifest.json' assert { type: 'json' }

export const localForageBaseCfg = {
  name: Config.name,
  description: Config.description,
  version: 1.0,
}

export async function DatabaseSetup() {
  var wallets = localforage.createInstance({
    ...localForageBaseCfg,
    storeName: 'wallets',
  });
  var alias = localforage.createInstance({
    ...localForageBaseCfg,
    storeName: 'alias',
  });
  var contacts = localforage.createInstance({
    ...localForageBaseCfg,
    storeName: 'contacts',
  });
  var addresses = localforage.createInstance({
    ...localForageBaseCfg,
    storeName: 'addresses',
  });

  return {
    wallets,
    addresses,
    contacts,
    alias,
  }
}
