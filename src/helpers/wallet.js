import {
  DashSight,
  Cryptic,
} from '../imports.js'
import { DatabaseSetup } from './db.js'
import {
  deriveAccountData,
  deriveAddressData,
  batchAddressGenerate,
  // checkWalletFunds,
} from './utils.js'

const STOREAGE_SALT = 'b9f4088bd3a93783147e3d78aa10cc911a2449a0d79a226ae33a5957b368cc18'

// @ts-ignore
let dashsight = DashSight.create({
  baseUrl: 'https://insight.dash.org',
  // baseUrl: 'https://dashsight.dashincubator.dev',
});

export const store = await DatabaseSetup()

export async function loadWallets() {
  let result = {}
  let walletsLen = await store.wallets.length()

  return await store.wallets.iterate((
    value, key, iterationNumber
  ) => {
    console.log('main iteration', iterationNumber, [key, value]);

    result[key] = value

    if (iterationNumber === walletsLen) {
      return result
    }
  })
}

// export async function loadAliases() {
//   let result = {}
//   let walletsLen = await store.aliases.length()

//   return await store.aliases.iterate(async (
//     value, key, iterationNumber
//   ) => {
//     let [walletId, alias] = key.split('__')
//     console.log('main iteration', iterationNumber, [key, value]);

//     result[alias] = value
//     result[alias].wallet = await store.wallets.getItem(value.walletId)

//     if (iterationNumber === walletsLen) {
//       return result
//     }
//   })
// }

export async function loadAlias(alias) {
  let $alias = await store.aliases.getItem(alias)

  if ($alias !== null) {
    $alias.$wallets = {}

    for (let w of $alias.wallets) {
      let wallet = await store.wallets.getItem(w)
      $alias.$wallets[w] = wallet
    }
  }

  return $alias
}

export async function initProfileWallets(
  profile = {},
) {
  let wallets = await loadWallets()

  let initProfile = {
    preferred_username: '',
    name: '',
    nickname: '',
    website: '',
    phone_number: '',
    address: '',
    email: '', // gravatar?
    // profile: 'https://imgur.com/gallery/y6sSvCr.json',
    // picture: 'https://i.imgur.com/y6sSvCr.jpeg', // url to avatar img
    sub: '',
    xpub: '',
    updated_at: (new Date()).toISOString(),
  }

  profile = {
    ...initProfile,
    ...profile,
  }

  let alias = profile.preferred_username

  // if (!wallets[id]) {
  //   wallets[id] =
  // }
  wallets = Object.values(wallets || {})
  wallets = wallets
    .filter(w => w.alias === alias)
    .map(w => w.id)

  return {
    alias,
    wallets,
    profile,
  }
}

export async function decryptWallet(
  keystorePassword,
  keystoreIV,
  keystoreSalt,
  ciphertext,
  // wallet,
  // accountIndex = 0,
  // addressIndex = 0,
  // overProfile = {},
) {
  // let {
  //   alias,
  //   wallets,
  //   profile,
  // } = await initProfileWallets(overProfile)

  // let { id, address, xpubId, recoveryPhrase } = wallet

  const cw = Cryptic.encryptString(keystorePassword, keystoreSalt);

  // const derivedKey = await cw.deriveKey(recoveryPhrase, iv);
  // const encryptedPhrase = await cw.encrypt(recoveryPhrase, iv);

  // console.log('initWallet Cryptic derived key', {
  //   derivedKey,
  //   encryptedPhrase,
  // })

  const decrypted = await cw.decrypt(ciphertext, keystoreIV);

  return decrypted
}

export async function initWallet(
  encryptionPassword,
  wallet,
  accountIndex = 0,
  addressIndex = 0,
  overProfile = {},
) {
  let {
    alias,
    wallets,
    profile,
  } = await initProfileWallets(overProfile)

  // let acct = await deriveAccountData(
  //   wallet.wallet,
  // )

  let { id, address, xpubId, recoveryPhrase } = wallet

  console.log(
    'initWallet wallets',
    wallets,
    profile,
  )

  if (!wallets.includes(id)) {
    wallets.push(id)
  }

  let addrs = await batchAddressGenerate(
    wallet.wallet,
    accountIndex,
    addressIndex,
  )

  // let addrFunds = {}

  for (let a of addrs.addresses) {
    // checkWalletFunds(a)
    //   .then(r => {
    //     addrFunds[a] = r
    //   })

    store.addresses.setItem(
      a.address,
      // `receiveaddr__${address}`,
      // `changeaddr__${address}`,
      // `sendaddr__${address}`,
      // `${wallet.id} ${accountIndex} ${addressIndex}`,
      {
        walletId: wallet.id,
        accountIndex: a.accountIndex,
        addressIndex: a.addressIndex,
        insight: {},
      }
    )
  }

  // console.log(
  //   'initWallet batch addr gen',
  //   addrs,
  //   addrFunds,
  // )
  const cw = Cryptic.encryptString(encryptionPassword, STOREAGE_SALT);
  const iv = Cryptic.bufferToHex(cw.getInitVector());

  const derivedKey = await cw.deriveKey(recoveryPhrase, iv);
  const encryptedPhrase = await cw.encrypt(recoveryPhrase, iv);

  console.log('initWallet Cryptic derived key', {
    derivedKey,
    encryptedPhrase,
  })

  // const decrypted = await cw.decrypt(encrypted, iv);

  let storeWallet = await store.wallets.setItem(
    `${id}`,
    {
      id,
      alias,
      accountIndex,
      addressIndex: addrs?.finalAddressIndex || addressIndex,
      keystore: {
        crypto: {
            // "cipher": "aes-128-ctr",
            // "cipher": "aes-gcm",
            "cipherparams": {
              iv,
            },
            ciphertext: encryptedPhrase,
            "kdf": "pbkdf2",
            "kdfparams": {
                // "c": 262144,
                // "c": 1000,
                // "dklen": 32,
                // "prf": "hmac-sha256",
                "salt": STOREAGE_SALT
            },
            // "mac": "517ead924a9d0dc3124507e3393d175ce3ff7c1e96529c6c555ce9e51205e9b2"
        },
        "id": crypto.randomUUID(),
        // "version": 3
      }
    }
  )

  let storedAlias = await store.aliases.setItem(
    `${alias}`,
    {
      // walletId: id,
      wallets,
      profile,
    }
  )

  console.log(
    'initWallet stored values',
    storeWallet,
    storedAlias,
    // storedReceiveAddr,
  )

  let contacts = '{}'

  updateAllFunds(wallet)
    .then(funds => {
      console.log('initWallet updateAllFunds', funds)
    })

  return {
    wallets,
    contacts,
  }
}

export async function checkWalletFunds(addr, wallet = {}) {
  const HOUR = 1000 * 60 * 60;

  let {
    address,
    accountIndex,
    addressIndex,
  } = addr
  let updated_at = (new Date()).getTime()
  let $addr = await store.addresses.getItem(address) || {}
  $addr = {
    walletId: wallet.id,
    accountIndex,
    addressIndex,
    ...$addr,
  }
  console.log('checkWalletFunds $addr', $addr)
  let walletFunds = $addr?.insight

  // if (!$addr.walletId && wallet.id) {
  //   $addr.walletId = wallet.id
  // }

  if (
    !walletFunds?.updated_at ||
    updated_at - walletFunds?.updated_at > HOUR
  ) {
    console.info('check insight api for addr', addr)

    let insightRes = await dashsight.getInstantBalance(address)

    if (insightRes) {
      let { addrStr, ...res } = insightRes
      walletFunds = res

      $addr.insight = {
        ...walletFunds,
        updated_at,
      }

      await store.addresses.setItem(
        address,
        $addr,
      )
    }
  }

  console.info('check addr funds', addr, walletFunds)

  return $addr
}

export async function updateAllFunds(wallet) {
  let funds = 0
  let result = {}
  let addrsLen = await store.addresses.length()

  return await store.addresses.iterate((
    value, address, iterationNumber
  ) => {
    let {
      walletId,
      accountIndex,
      addressIndex,
    } = value

    if (walletId === wallet?.id) {
      // result[address] = value
      // funds += value?.insight?.balance || 0
      checkWalletFunds({
        address,
        accountIndex,
        addressIndex,
      }, wallet).then(({ insight }) => {
        funds += insight?.balance || 0
      })
    }

    if (iterationNumber === addrsLen) {
      // let funds = Object.values(result)
      //   .map(a => a?.insight?.balance || 0)
      //   .reduce((total, current) => total + current)

      console.log('update funds', result, funds);

      return funds
    }
  })
}

export async function getTotalFunds(wallet) {
  let funds = 0
  let result = {}
  let addrsLen = await store.addresses.length()

  return await store.addresses.iterate((
    value, key, iterationNumber
  ) => {
    // console.log('total iteration', iterationNumber, addrsLen, [key, value]);

    if (value?.walletId === wallet?.id) {
      result[key] = value
      funds += value?.insight?.balance || 0
    }

    if (iterationNumber === addrsLen) {
      // let funds = Object.values(result)
      //   .map(a => a?.insight?.balance || 0)
      //   .reduce((total, current) => total + current)

      console.log('total funds', result, funds);

      return funds
    }
  })
}