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
  var accounts = localforage.createInstance({
    ...localForageBaseCfg,
    storeName: 'accounts',
  });
  // accounts.ready(r => {
  //   console.log('accounts', r, accounts, accounts._dbInfo.db)
  //   let tx = accounts._dbInfo.db.transaction("accounts", "readwrite");
  //   let accts = tx.objectStore("accounts");
  //   let acctWalletIndex = accts.createIndex('wallet_id', 'walletId');
  //   console.log('acctWalletIndex', tx, accts, acctWalletIndex)
  // })
  var addresses = localforage.createInstance({
    ...localForageBaseCfg,
    storeName: 'addresses',
  });

  return {
    wallets,
    addresses,
    contacts,
    accounts,
    aliases,
  }
}

// https://gist.github.com/loilo/ed43739361ec718129a15ae5d531095b#file-idb-backup-and-restore-mjs
/**
 * Export all data from an IndexedDB database
 *
 * @param {IDBDatabase} idbDatabase The database to export from
 * @return {Promise<Object>}
 */
export function exportToJson(
  idbDatabase,
  excludeList = [],
  // includeList = [],
) {
  return new Promise((resolve, reject) => {
    const exportObject = {}
    let storeLength = idbDatabase.objectStoreNames.length
    if (storeLength === 0) {
      resolve(JSON.stringify(exportObject))
    } else {
      const transaction = idbDatabase.transaction(
        idbDatabase.objectStoreNames,
        'readonly'
      )

      transaction.addEventListener('error', reject)

      for (const storeName of idbDatabase.objectStoreNames) {
        if (excludeList.includes(storeName)) {
          --storeLength;
          console.log('eidb storeName', storeName)
          continue;
        }
        const allObjects = {}
        transaction
          .objectStore(storeName)
          .openCursor()
          .addEventListener('success', event => {
            // @ts-ignore
            const cursor = event.target.result
            // console.log('eidb transaction cursor', cursor)
            if (cursor) {
              allObjects[cursor.primaryKey] = cursor.value
              cursor.continue()
            } else {
              exportObject[storeName] = allObjects

              if (
                storeLength ===
                Object.keys(exportObject).length
              ) {
                resolve(exportObject)
              }
            }
          })
      }
    }
  })
}

/**
 * Import data from JSON into an IndexedDB database.
 * This does not delete any existing data from the database, so keys may clash.
 *
 * @param {Object} store Database to import into
 * @param {Object | string} json  Data to import, one key per object store
 * @return {Promise<void>}
 */
export async function importFromJson(store, json) {
  let importObject = json

  if ('string' === typeof json) {
    importObject = JSON.parse(json)
  }

  return new Promise((resolve, reject) => {
    for (const storeName in importObject) {
      let targetStore = store[storeName]
      let importData = importObject[storeName]
      // let count = 0
      for (const itemKey in importData) {
        targetStore.setItem(itemKey, importData[itemKey])
      }
      resolve()
    }
  })
}

// https://stackoverflow.com/a/65939108
export function saveJsonToFile(filename, dataObjToWrite) {
  const blob = new Blob([JSON.stringify(dataObjToWrite)], { type: "text/json" });
  const link = document.createElement("a");

  link.download = filename;
  link.href = window.URL.createObjectURL(blob);
  link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

  document.body.appendChild(link);

  // const evt = new MouseEvent("click", {
  //     view: window,
  //     bubbles: true,
  //     cancelable: true,
  // });

  // link.dispatchEvent(evt);
  link.click();
  link.remove()
}

// exportWalletData(localForageBaseCfg.name)
export function exportWalletData(name, version) {
  var conn = indexedDB.open(name, version)
  // console.log('exportWalletData', {name, version, conn})
  conn.onsuccess = e => {
    // @ts-ignore
    var database = e.target.result
    // console.log('exportWalletData onsuccess', {database})

    exportToJson(
      database,
      [
        'local-forage-detect-blob-support',
        // 'addresses',
      ],
    )
      .then(d => {
        // console.log('exportWalletData indexedDB exportToJson', d)

        let walletId = Object.keys(d.wallets)?.[0] || ''

        saveJsonToFile(
          `incubator_wallet.${walletId}.${(new Date()).toISOString()}.json`,
          d,
        )
      })
      .catch(console.error)
  }
}
