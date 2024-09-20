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
  var transactions = localforage.createInstance({
    ...localForageBaseCfg,
    storeName: 'transactions',
  });

  return {
    wallets,
    addresses,
    contacts,
    accounts,
    aliases,
    transactions,
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

  const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
  });

  link.dispatchEvent(evt);
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

export async function getStoreData(
  store,
  callback,
  iterableCallback = res => async (v, k, i) => res.push(v)
) {
  let result = []

  return await store.keys().then(async function(keys) {
    for (let k of keys) {
      let v = await store.getItem(k)
      await iterableCallback(result)(v, k)
    }

    callback?.(result)

    return result
  }).catch(function(err) {
    console.error('getStoreData', err)
    return null
  });
}

export async function loadStore(
  store,
  callback,
  iterableCallback = res => v => res.push(v)
) {
  let result = []

  return await store.iterate(iterableCallback(result))
  .then(() => callback?.(result))
  .catch(err => {
    console.error('loadStore', err)
    return null
  });
}

export async function loadStoreObject(store, callback) {
  let result = {}

  return await store.iterate((v, k, i) => {
    result[k] = v
  })
  .then(() => callback?.(result))
  .then(() => result)
  .catch(err => {
    console.error('loadStoreObject', err)
    return null
  });
}

export async function getFilteredStoreLength(targStore, query = {}) {
  let resLength = 0
  let storeLen = await targStore.length()
  let qs = Object.entries(query)

  // console.log('getFilteredStoreLength qs', {
  //   storeName: targStore?._config?.storeName,
  //   storeLen,
  //   qs,
  // })

  if (storeLen === 0) {
    return 0
  }

  return await targStore.iterate((
    value, key, iterationNumber
  ) => {
    let res = true

    // console.log('getFilteredStoreLength qs before each', key, res)

    qs.forEach(([k,v]) => {
      // console.log('getFilteredStoreLength qs each', k, v, value[k])
      if (k === 'key' && key !== v || value[k] !== v) {
        res = undefined
      }
    })

    // console.log('getFilteredStoreLength qs after each', key, res)

    if (res) {
      resLength += 1
    }

    if (iterationNumber === storeLen) {
      return resLength
    }
  })
}

export async function findInStore(targStore, query = {}) {
  let result = {}
  let storeLen = await targStore.length()
  let qs = Object.entries(query)
  // console.log('findInStore qs', qs)

  return await targStore.iterate((
    value, key, iterationNumber
  ) => {
    let res = value

    // console.log('findInStore qs before each', key, res)

    qs.forEach(([k,v]) => {
      // console.log('findInStore qs each', k, v, value[k])
      if (k === 'key' && key !== v || value[k] !== v) {
        res = undefined
      }
    })

    // console.log('findInStore qs after each', key, res)

    if (res) {
      result[key] = res
    }

    if (iterationNumber === storeLen) {
      return result
    }
  })
}

export async function findOneInStore(targStore, query = {}) {
  let storeLen = await targStore.length()
  let qs = Object.entries(query)

  return await targStore.iterate((
    value, key, iterationNumber
  ) => {
    let res = value

    qs.forEach(([k,v]) => {
      if (k === 'key' && key !== v || value[k] !== v) {
        res = undefined
      }
    })

    if (res) {
      return res
    }

    if (iterationNumber === storeLen) {
      return undefined
    }
  })
}
