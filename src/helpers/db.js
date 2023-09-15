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
  var aliases = localforage.createInstance({
    ...localForageBaseCfg,
    storeName: 'aliases',
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
    aliases,
  }
}
