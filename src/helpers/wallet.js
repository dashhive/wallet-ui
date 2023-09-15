import {
  DashSight,
} from '../imports.js'
import { DatabaseSetup } from './db.js'
import {
  deriveAccountData,
  deriveAddressData,
  batchAddressGenerate,
  // checkWalletFunds,
} from './utils.js'

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

export async function initWallet(
  wallet,
  accountIndex = 0,
  addressIndex = 0,
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

  // let acct = await deriveAccountData(
  //   wallet.wallet,
  // )

  let { id, address, xpubId, recoveryPhrase } = wallet

  // if (!wallets[id]) {
  //   wallets[id] =
  // }
  wallets = Object.values(wallets || {})
  wallets = wallets
    .filter(w => w.alias === alias)
    .map(w => w.id)

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
            // "cipherparams": {
            //     "iv": "6087dab2f9fdbbfaddc31a909735c1e6"
            // },
            ciphertext: recoveryPhrase,
            // "kdf": "pbkdf2",
            // "kdfparams": {
            //     "c": 262144,
            //     "dklen": 32,
            //     "prf": "hmac-sha256",
            //     "salt": "ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd"
            // },
            // "mac": "517ead924a9d0dc3124507e3393d175ce3ff7c1e96529c6c555ce9e51205e9b2"
        },
        // "id": "3198bc9c-6672-5ab3-d995-4942343ae5b6",
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