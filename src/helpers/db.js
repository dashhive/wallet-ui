import {
  localforage,
} from '../imports.js'

let Config = {
  name: 'incubator',
  description: 'dash wallet'
}

const manifest = await fetch(
  '/src/manifest.webmanifest'
)
if (manifest.ok) {
  Config = await manifest.json()
}

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
