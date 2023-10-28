import {
  DashTx,
  DashHd,
  DashSight,
  DashSocket,
  Cryptic,
} from '../imports.js'
import { DatabaseSetup } from './db.js'
import { STOREAGE_SALT, OIDC_CLAIMS } from './constants.js'

// @ts-ignore
let dashsight = DashSight.create({
  baseUrl: 'https://insight.dash.org',
  // baseUrl: 'https://dashsight.dashincubator.dev',
});

let defaultSocketEvents = {
  onClose: async (e) => console.log('onClose', e),
  onError: async (e) => console.log('onError', e),
  onMessage: async (e, data) => console.log('onMessage', e, data),
}

export async function initDashSocket(
  events = {}
) {
  // @ts-ignore
  let dashsocket = DashSocket.create({
    dashsocketBaseUrl: 'https://insight.dash.org/socket.io',
    cookieStore: null,
    debug: true,
    ...defaultSocketEvents,
    ...events,
  })

  await dashsocket.init()
    .catch((e) => console.log('dashsocket catch err', e));

  setTimeout(() => {
    dashsocket.close()
  }, 15*60*1000);

  return dashsocket
}

export const store = await DatabaseSetup()

export async function loadWallets() {
  let result = {}
  let walletsLen = await store.wallets.length()

  return await store.wallets.iterate((
    value, key, iterationNumber
  ) => {
    // console.log('main iteration', iterationNumber, [key, value]);

    result[key] = value

    if (iterationNumber === walletsLen) {
      return result
    }
  })
}

export async function loadWalletsForAlias(alias) {
  let $alias = await store.aliases.getItem(alias)
  $alias.$wallets = {}

  if ($alias?.wallets) {
    for (let w of $alias.wallets) {
      let wallet = await store.wallets.getItem(w)
      $alias.$wallets[w] = wallet
    }
  }

  return $alias
}

export async function initWalletsInfo(
  info = {},
) {
  let wallets = await loadWallets()

  info = {
    ...OIDC_CLAIMS,
    ...info,
  }

  let alias = info.preferred_username

  wallets = Object.values(wallets || {})
  wallets = wallets
    .filter(w => w.alias === alias)
    .map(w => w.id)

  return {
    alias,
    wallets,
    info,
  }
}

export async function decryptWallet(
  keystorePassword,
  keystoreIV,
  keystoreSalt,
  ciphertext,
) {
  const cw = Cryptic.encryptString(keystorePassword, keystoreSalt);

  return await cw.decrypt(ciphertext, keystoreIV);
}

export async function initWallet(
  encryptionPassword,
  wallet,
  accountIndex = 0,
  addressIndex = 0,
  infoOverride = {},
) {
  let {
    alias,
    wallets,
    info,
  } = await initWalletsInfo(infoOverride)

  let { id, recoveryPhrase } = wallet

  // console.log(
  //   'initWallet wallets',
  //   wallets,
  //   info,
  // )

  if (!wallets.includes(id)) {
    wallets.push(id)
  }

  let addrs = await batchAddressGenerate(
    wallet,
    accountIndex,
    addressIndex,
  )

  for (let a of addrs.addresses) {
    store.addresses.setItem(
      a.address,
      {
        walletId: wallet.id,
        accountIndex: a.accountIndex,
        addressIndex: a.addressIndex,
        insight: {},
      }
    )
  }

  const cw = Cryptic.encryptString(
    encryptionPassword,
    STOREAGE_SALT
  );
  const iv = Cryptic.bufferToHex(
    cw.getInitVector()
  );

  // const derivedKey = await cw.deriveKey(recoveryPhrase, iv);
  const encryptedPhrase = await cw.encrypt(recoveryPhrase, iv);

  // console.log('initWallet Cryptic derived key', {
  //   derivedKey,
  //   encryptedPhrase,
  // })

  // let storeWallet = await
  store.wallets.setItem(
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

  // let storedAlias = await
  store.aliases.setItem(
    `${alias}`,
    {
      wallets,
      info,
    }
  )

  // console.log(
  //   'initWallet stored values',
  //   storeWallet,
  //   storedAlias,
  // )

  let contacts = '{}'

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
  // console.log('checkWalletFunds $addr', $addr)
  let walletFunds = $addr?.insight

  if (
    !walletFunds?.updated_at ||
    updated_at - walletFunds?.updated_at > HOUR
  ) {
    // console.info('check insight api for addr', addr)

    let insightRes = await dashsight.getInstantBalance(address)

    if (insightRes) {
      let { addrStr, ...res } = insightRes
      walletFunds = res

      $addr.insight = {
        ...walletFunds,
        updated_at,
      }

      store.addresses.setItem(
        address,
        $addr,
      )
    }
  }

  // console.info('check addr funds', addr, walletFunds)

  return $addr
}

export async function updateAllFunds(wallet) {
  let funds = 0
  let addrKeys = await store.addresses.keys()

  for (const address of addrKeys) {
    let {
      walletId,
      accountIndex,
      addressIndex,
    } = await store.addresses.getItem(address)

    if (walletId === wallet?.id) {
      let { insight } = await checkWalletFunds({
        address,
        accountIndex,
        addressIndex,
      }, wallet)

      funds += insight?.balance || 0
    }
  }

  return funds
}

export async function getTotalFunds(wallet) {
  let funds = 0
  let result = {}
  let addrsLen = await store.addresses.length()

  return await store.addresses.iterate((
    value, key, iterationNumber
  ) => {
    if (value?.walletId === wallet?.id) {
      result[key] = value
      funds += value?.insight?.balance || 0
    }

    if (iterationNumber === addrsLen) {
      return funds
    }
  })
}

export async function batchAddressGenerate(
  wallet,
  accountIndex = 0,
  addressIndex = 0,
  use = DashHd.RECEIVE,
  batchSize = 20
) {
  let batchLimit = addressIndex + batchSize
  let addresses = []

  let account = await wallet.derivedWallet.deriveAccount(accountIndex);
  let xkey = await account.deriveXKey(use);

  for (;addressIndex < batchLimit; addressIndex++) {
    let key = await xkey.deriveAddress(addressIndex);
    let address = await DashHd.toAddr(key.publicKey);

    addresses.push({
      address,
      addressIndex,
      accountIndex,
    })

    store.addresses.getItem(address)
      .then(a => {
        let $addr = a || {}
        // console.log(
        //   'batchAddressGenerate wallet',
        //   wallet
        // )

        store.addresses.setItem(
          address,
          {
            ...$addr,
            walletId: wallet.id,
            accountIndex,
            addressIndex,
          },
        )
      })
  }

  return {
    addresses,
    finalAddressIndex: addressIndex,
  }
}

// await forceInsightUpdate('XsiasfIJBjifeifasdijbuUt3')
export async function forceInsightUpdateForAddress(addr) {
  let currentAddr = await store.addresses.getItem(
    addr
  )
  await store.addresses.setItem(
    addr,
    {
      ...currentAddr,
      insight: {
        ...currentAddr.insight,
        updated_at: 0
      }
    }
  )
}

export async function sendTx(
  fromWallet, recipient, amount,
) {
  const MIN_FEE = 191;
  const DUST = 2000;

  console.log(DashTx, fromWallet)
  let dashTx = DashTx.create({
    // @ts-ignore
    version: 3,
  });

  let privateKeys = {
    [fromWallet.address]: fromWallet.addressKey.privateKey,
  };

  let coreUtxos = await dashsight.getCoreUtxos(fromWallet.address);

  console.log('coreUtxos', coreUtxos);

  let payments = [
    {
      address: recipient?.address || recipient,
      satoshis: DashTx.toSats(amount),
    },
  ];

  let spendableDuffs = coreUtxos.reduce(function (total, utxo) {
    return total + utxo.satoshis;
  }, 0);
  let spentDuffs = payments.reduce(function (total, output) {
    return total + output.satoshis;
  }, 0);
  let unspentDuffs = spendableDuffs - spentDuffs;

  let txInfo = {
    inputs: coreUtxos,
    outputs: payments,
  };

  let sizes = DashTx.appraise(txInfo);
  let midFee = sizes.mid;

  if (unspentDuffs < MIN_FEE) {
    throw new Error(
      `overspend: inputs total '${spendableDuffs}', but outputs total '${spentDuffs}', which leaves no way to pay the fee of '${sizes.mid}'`,
    );
  }

  txInfo.inputs.sort(DashTx.sortInputs)

  let outputs = txInfo.outputs.slice(0);
  let change;

  change = unspentDuffs - (midFee + DashTx.OUTPUT_SIZE);
  if (change < DUST) {
    change = 0;
  }
  if (change) {
    txInfo.outputs = outputs.slice(0);
    txInfo.outputs.push({
      address: fromWallet.address,
      satoshis: change,
    });
  }

  let keys = coreUtxos.map(utxo => privateKeys[utxo.address]);

  let tx = await dashTx.hashAndSignAll(txInfo, keys);

  let txHex = tx.transaction;

  console.log('tx', tx);
  console.log('txHex', [txHex]);

  let result = await dashsight.instantSend(txHex);

  console.log('instantSend result', result);

  return result
}