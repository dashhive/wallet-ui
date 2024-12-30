import {
  OIDC_CLAIMS,
  DCD_RPC_ENDPOINT,
  DCD_RPC_AUTH,
  VERBOSE,
  DUFFS,
} from '../constants.js'

import {
  DashWallet,
  DashTx,
  DashSight,
  DashSocket,
} from '../../imports.js'

import {
  appState,
  appTools,
  appComponents,
  userInfo,
  wallets,
  walletFunds,
} from '../../state/index.js'

import {
  DatabaseSetup,
  loadStoreObject,
  getStoreData,
} from '../db.js'

import {
  batchGenAccts,
  batchGenAcctsAddrs,
  deriveWalletData,
  deriveContactAddrs,
  getContactsFromAddrs,
  batchXkeyAddressGenerate,
  sortIncomingAndOutgoingTxs,
  selectOptimalUtxos,
  parseAddressField,
  getUniqueAlias,
  sortAddrs,
  getContactAliases,
} from './local.js'

let defaultSocketEvents = {
  onClose: async (e) => console.log('onClose', e),
  onError: async (e) => console.log('onError', e),
  onMessage: async (e, data) => console.log('onMessage', e, data),
}

export const store = await DatabaseSetup()

// @ts-ignore
export const dashsight = DashSight.create({
  baseUrl: 'https://insight.dash.org',
  // baseUrl: 'https://dashsight.dashincubator.dev',
});

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

  return dashsocket
}

export async function rpcApi({
  method,
  // 'getaddressdeltas' | 'getaddresstxids'
  // 'getaddressutxos' | 'getrawtransactionmulti'
  params,
}) {
  let resp = await fetch(DCD_RPC_ENDPOINT, {
      method: "POST",
      headers: {
          "Authorization": `Basic ${DCD_RPC_AUTH}`,
          "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method,
        params,
      }),
  });
  let data = await resp.json();

  if (data.error) {
      let err = new Error(data.error.message);
      Object.assign(err, data.error);
      throw err;
  }

  return data;
}

export async function updateAddrFunds(
  wallet, insightRes,
) {
  let updatedAt = Date.now()
  let { address, ...res } = insightRes
  let $addr = await store.addresses.getItem(address) || {}
  let {
    walletId,
    xkeyId,
  } = $addr

  if (walletId && walletId === wallet?.id) {
    let storedWallet = await store.wallets.getItem(walletId) || {}
    let storedAccount = await store.accounts.getItem(xkeyId) || {}

    $addr.insight = {
      ...res,
      updatedAt,
    }

    store.addresses.setItem(
      address,
      $addr,
    )

    if (storedAccount.usage[$addr.usageIndex] < $addr.addressIndex) {
      storedAccount.usage[$addr.usageIndex] = $addr.addressIndex
      store.accounts.setItem(
        xkeyId,
        storedAccount
      )
    }
    if (storedWallet.accountIndex < $addr.accountIndex) {
      let upWallet = await store.wallets.setItem(
        walletId,
        {
          ...storedWallet,
          accountIndex: $addr.accountIndex,
          updatedAt: (new Date()).toISOString(),
        }
      )
      let storeAcctLen = (await store.accounts.length())-1
      wallets[walletId] = upWallet

      console.log('updateAddrFunds', {
        acctIdx: $addr.accountIndex,
        storeAcctLen,
        sameOrBigger: $addr.accountIndex >= storeAcctLen,
      })

      if ($addr.accountIndex >= storeAcctLen) {
        batchGenAccts(wallet.recoveryPhrase, $addr.accountIndex)
          .then(() => {
            batchGenAcctsAddrs(wallet)
              .then(accts => {
                console.log('batchGenAcctsAddrs', { accts })

                updateAllFunds(wallet)
                  .then(funds => {
                    console.log('updateAllFunds then funds', funds)
                  })
                  .catch(err => console.error('catch updateAllFunds', err, wallet))
              })
          })
      }
    }

    return res
  }

  return { balance: 0 }
}

/**
 * Modified version of `dashsight.getInstantBalance`
 * to work with {@link https://rpc.digitalcash.dev/ DCD RPC Proxy}
 *
 * @param {string[]} addresses
 * @returns {Promise<InstantBalance[]>}
 */
export async function getInstantBalances(addresses) {
  let rpcUtxos = (await rpcApi({
    method: "getaddressutxos",
    params: [{ addresses }]
  }));

  let utxos = rpcUtxos?.result || []
  let balanceOfAddrs = {}

  utxos?.forEach(function (utxo) {
    let {
      txid, address, satoshis,
      height, outputIndex, script,
    } = utxo
    let balanceDuffs = satoshis || 0
    let balanceDash = (balanceDuffs / DUFFS).toFixed(8);

    let utxoAddrSum = balanceOfAddrs[address] || {}

    let balance = utxoAddrSum.balance || 0
    let balanceSat = utxoAddrSum.balanceSat || 0
    let _utxoCount = utxoAddrSum._utxoCount || 0
    let _utxs = utxoAddrSum._utxs || {}
    _utxs[txid] = {
      txid, satoshis,
      height, outputIndex, script,
    }

    utxoAddrSum = {
      address,
      balance: balance + parseFloat(balanceDash),
      balanceSat: balanceSat + balanceDuffs,
      _utxoCount: _utxoCount + 1,
      _utxs,
    }

    balanceOfAddrs[utxo.address] = utxoAddrSum
  });

  let balanceArray = Object.values(balanceOfAddrs);

  return balanceArray;
}

export async function updateAllFunds(wallet) {
  let funds = 0
  let addresses = await store.addresses.keys()

  if (addresses.length === 0) {
    walletFunds.balance = funds
    return funds
  }

  let balances = await getInstantBalances(addresses)

  if (balances.length >= 0) {
    walletFunds.balance = funds
  }

  // add balances to address
  for (const balanceRes of balances) {
    let { address } = balanceRes
    let addrIdx = addresses.indexOf(address)
    if (addrIdx > -1) {
      addresses.splice(addrIdx, 1)
    }
    funds += (await updateAddrFunds(wallet, balanceRes))?.balance || 0
    walletFunds.balance = funds
  }

  // remove balances from address
  for (const addr of addresses) {
    let { insight, ...$addr } = await store.addresses.getItem(addr) || {}

    // walletFunds.balance = funds - (_insight?.balance || 0)

    store.addresses.setItem(
      addr,
      $addr,
    )
  }

  console.log('updateAllFunds funds', {balances, funds})

  return funds
}

export async function deriveTxWallet(
  fromWallet,
  fundAddrs,
) {
  let cachedAddrs = {}
  let privateKeys = {}
  let coreUtxos
  let tmpWallet

  if (Array.isArray(fundAddrs) && fundAddrs.length > 0) {
    fundAddrs.sort(sortAddrs)

    for (let w of fundAddrs) {
      tmpWallet = await deriveWalletData(
        fromWallet.recoveryPhrase,
        w.accountIndex,
        w.addressIndex,
        w.usageIndex,
      )
      privateKeys[tmpWallet.address] = tmpWallet.addressKey.privateKey
      cachedAddrs[w.address] = {
        checked_at: w.updatedAt,
        hdpath: `m/44'/${DashWallet.COIN_TYPE}'/${w.accountIndex}'/${w.usageIndex}`,
        index: w.addressIndex,
        wallet: w.walletId, // maybe `selectedAlias`?
        txs: [],
        utxos: [],
      }
    }

    coreUtxos = await dashsight.getMultiCoreUtxos(
      Object.keys(privateKeys)
    )
  } else {
    tmpWallet = await deriveWalletData(
      fromWallet.recoveryPhrase,
      fundAddrs.accountIndex,
      fundAddrs.addressIndex,
      fundAddrs.usageIndex,
    )
    privateKeys[tmpWallet.address] = tmpWallet.addressKey.privateKey
    cachedAddrs[fundAddrs.address] = {
      checked_at: fundAddrs.updatedAt,
      hdpath: `m/44'/${DashWallet.COIN_TYPE}'/${fundAddrs.accountIndex}'/${fundAddrs.usageIndex}`,
      index: fundAddrs.addressIndex,
      wallet: fundAddrs.walletId, // maybe `selectedAlias`?
      txs: [],
      utxos: [],
    }
    coreUtxos = await dashsight.getCoreUtxos(
      tmpWallet.address
    )
  }

  return {
    privateKeys,
    cachedAddrs,
    coreUtxos,
  }
}

export async function createStandardTx(
  fromWallet,
  fundAddrs,
  changeAddrs,
  recipient,
  amount,
  fullTransfer = false,
) {
  const amountSats = DashTx.toSats(amount)

  console.log('amount to send', {
    amount,
    amountSats,
  })

  let selection
  let receiverOutput
  let outputs = []
  let {
    privateKeys,
    coreUtxos,
    cachedAddrs,
  } = await deriveTxWallet(fromWallet, fundAddrs)
  let changeAddr = changeAddrs[0]

  let recipientAddr = recipient?.address || recipient

  // @ts-ignore
  let dashwallet = await DashWallet.create({
    safe: {
      cache: {
        addresses: cachedAddrs
      }
    },
    store: {
      save: data => console.log('dashwallet.store.save', {data})
    },
    dashsight,
  })

  receiverOutput = DashWallet._parseSendInfo(dashwallet, amountSats);

  selection = dashwallet.useMatchingCoins({
    output: receiverOutput,
    utxos: coreUtxos,
    breakChange: false,
  })

  console.log('coreUtxos', {
    coreUtxos,
    selection,
    amount,
    amountSats,
    fullTransfer,
  })

  let stampVal = dashwallet.__STAMP__ * selection.output.stampsPerCoin
  let receiverDenoms = receiverOutput?.denoms.slice(0)

  for (let denom of selection.output.denoms) {
    let address = '';
    let matchingDenomIndex = receiverDenoms.indexOf(denom)
    if (matchingDenomIndex >= 0) {
      void receiverDenoms.splice(matchingDenomIndex, 1)
      address = recipientAddr
    } else {
      address = changeAddr
    }

    let coreOutput = {
      address,
      // address: addrsInfo.addresses.pop(),
      satoshis: denom + stampVal,
      faceValue: denom,
      stamps: selection.output.stampsPerCoin,
    }

    outputs.push(coreOutput)
  }

  let txInfo = {
    inputs: selection.inputs,
    outputs: outputs,
  };

  txInfo.outputs.sort(DashTx.sortOutputs)
  txInfo.inputs.sort(DashTx.sortInputs)

  let keys = txInfo.inputs.map(
    utxo => privateKeys[utxo.address]
  )

  return [
    txInfo,
    keys,
    changeAddr,
  ]
}

export async function createOptimalTx(
  fromWallet,
  fundAddrs,
  changeAddrs,
  recipient,
  amount,
) {
  const MIN_FEE = 191;
  const DUST = 2000;
  const amountSats = DashTx.toSats(amount)

  console.log('amount to send', {
    amount,
    amountSats,
    fundAddrs,
  })

  let changeAddr = changeAddrs[0]

  let {
    privateKeys,
    coreUtxos,
  } = await deriveTxWallet(fromWallet, fundAddrs)

  let optimalUtxos = selectOptimalUtxos(
    coreUtxos,
    amountSats,
  )

  console.log('utxos', {
    core: coreUtxos,
    optimal: optimalUtxos,
  })

  let recipientAddr = recipient?.address || recipient

  let payments = [
    {
      address: recipientAddr,
      satoshis: amountSats,
    },
  ]

  let spendableDuffs = optimalUtxos.reduce(function (total, utxo) {
    return total + utxo.satoshis;
  }, 0)
  let spentDuffs = payments.reduce(function (total, output) {
    return total + output.satoshis;
  }, 0)
  let unspentDuffs = spendableDuffs - spentDuffs

  let txInfo = {
    inputs: optimalUtxos,
    outputs: payments,
  }

  let sizes = DashTx.appraise(txInfo)
  let midFee = sizes.mid

  if (unspentDuffs < MIN_FEE) {
    throw new Error(
      `overspend: inputs total '${spendableDuffs}', but outputs total '${spentDuffs}', which leaves no way to pay the fee of '${sizes.mid}'`,
    )
  }

  txInfo.inputs.sort(DashTx.sortInputs)

  let outputs = txInfo.outputs.slice(0)
  let change

  change = unspentDuffs - (midFee + DashTx.OUTPUT_SIZE)
  if (change < DUST) {
    change = 0
  }
  if (change) {
    txInfo.outputs = outputs.slice(0);
    txInfo.outputs.push({
      address: changeAddr,
      satoshis: change,
    })
  }

  txInfo.outputs.sort(DashTx.sortOutputs)

  let keys = optimalUtxos.map(
    utxo => privateKeys[utxo.address]
  )

  return [
    txInfo,
    keys,
    changeAddr,
  ]
}

export async function createDraftTx(
  fromWallet,
  fundAddrs,
  changeAddrs,
  recipient,
  amount,
  fullTransfer = false,
) {
  const amountSats = DashTx.toSats(amount)

  console.log('amount to send', {
    amount,
    amountSats,
  })

  let {
    privateKeys,
    coreUtxos,
    cachedAddrs,
  } = await deriveTxWallet(fromWallet, fundAddrs)
  let changeAddr = changeAddrs[0]

  let recipientAddr = recipient?.address || recipient

  // @ts-ignore
  let dashwallet = await DashWallet.create({
    safe: {
      cache: {
        addresses: cachedAddrs
      }
    },
    store: {
      save: data => console.log('dashwallet.store.save', {data})
    },
    dashsight,
  })

  let utxos = null;
  let inputs = null;
  let output = {
    address: recipientAddr,
    satoshis: amountSats
  };

  if (coreUtxos) {
    inputs = coreUtxos;
    if (fullTransfer) {
      output.satoshis = null;
    }
  } else {
    utxos = coreUtxos;
  }

  let txDraft = await dashwallet.legacy.draftTx({
    utxos,
    inputs,
    output,
    feeSize: 'max',
  })

  if (txDraft.change) {
    txDraft.change.address = changeAddr;
  }

  let keys = txDraft.inputs.map(
    utxo => privateKeys[utxo.address]
  )

  let txSummary = await dashwallet.legacy.finalizeAndSignTx(txDraft, keys);

  return {
    ...txSummary,
    changeAddr,
  }
}

export async function createTx(
  fromWallet,
  fundAddrs,
  changeAddrs,
  recipient,
  amount,
  fullTransfer = false,
  mode = null,
) {
  let tmpTx
  let dashTx = DashTx.create({
    // @ts-ignore
    version: 3,
  });

  if (fullTransfer) {
    let tx = await createDraftTx(
      fromWallet,
      fundAddrs,
      changeAddrs,
      recipient,
      amount,
      fullTransfer,
    )

    console.log('fullTransfer tx', tx);

    return {
      tx,
      changeAddr: tx.changeAddr,
      fee: tx.fee,
      // fee: inFee - outFee,
    }
  } else if (mode === 'cash') {
    // Denominated TX
    tmpTx = await createStandardTx(
      fromWallet,
      fundAddrs,
      changeAddrs,
      recipient,
      amount,
      fullTransfer,
    )
  } else {
    // Non-Denominated TX
    tmpTx = await createOptimalTx(
      fromWallet,
      fundAddrs,
      changeAddrs,
      recipient,
      amount,
    )
  }

  let [txInfo, keys, changeAddr] = tmpTx

  let inFee = txInfo.inputs.reduce((acc, cur) => acc + cur.satoshis, 0)
  let outFee = txInfo.outputs.reduce((acc, cur) => acc + cur.satoshis, 0)

  console.log('txInfo', {
    txInfo,
    calcFee: {
      in: inFee,
      out: outFee,
      fee: inFee - outFee,
    },
  });

  // @ts-ignore
  let tx = await dashTx.hashAndSignAll(txInfo, keys);

  console.log('tx', tx);

  return {
    tx,
    changeAddr,
    fee: inFee - outFee,
  }
}

export async function sendTx(
  tx,
) {
  let txHex = tx.transaction;

  console.log('txHex', [txHex]);

  let result = await dashsight.instantSend(txHex);

  console.log('instantSend result', result);

  return result
}


export async function rpcAddrsTransactions({
  addresses,
  txs = [],
}) {
  let txidData = (await rpcApi({
    method: "getaddresstxids",
    params: [
      {
        addresses,
      }
    ]
  }));

  let txids = txidData?.result || []

  if (txids.length === 0) {
    return []
  }

  let txInfoData = (await rpcApi({
    method: "getrawtransactionmulti",
    params: [
      {
        "0": txids,
      },
      VERBOSE
    ]
  }));
  txs = Object.values(txInfoData?.result || {})

  console.log('rpcAddrsTransactions', {
    txInfoData,
    txids,
    txs,
  })

  return txs;
}

export async function getAddrsTransactions({
  appState,
  addrs,
  contactAddrs = {},
  txs = [],
}) {
  let storeAddrs = await loadStoreObject(store.addresses)
  if (txs.length === 0) {
    txs = await rpcAddrsTransactions({
      addresses: addrs,
      txs,
    })
  }
  let byAddress = {}
  let byAlias = {}
  let byTx = {}

  for await (let tx of txs) {
    let dir = 'received'
    let conAddr
    let sentAmount = 0
    let receivedAmount = 0

    for await (let vin of tx.vin) {
      let addr = vin.address
      conAddr = contactAddrs[addr]

      if(storeAddrs[addr]) {
        dir = 'sent'
        sentAmount += Number(vin.value)
      }

      if (conAddr) {
        sortIncomingAndOutgoingTxs({
          tx, addr, conAddr, dir, sentAmount,
          byAlias, byAddress, byTx,
        })
      }
    }

    function voutSort({ addr, vout, }) {
      let conAddr = contactAddrs[addr]

      if(storeAddrs[addr]) {
        receivedAmount += Number(vout.value)
      } else {
        // sentAmount -= Number(vout.value)
      }

      if (conAddr) {
        sortIncomingAndOutgoingTxs({
          tx, addr, conAddr, dir, receivedAmount,
          byAlias, byAddress, byTx,
        })
      }
    }

    for await (let vout of tx.vout) {
      if (vout?.scriptPubKey?.address) {
        let addr = vout?.scriptPubKey?.address
        voutSort({ addr, vout })
      }
      if (vout?.scriptPubKey?.addresses) {
        for await (let addr of vout.scriptPubKey.addresses) {
          voutSort({ addr, vout })
        }
      }
    }

    byTx[tx.txid] = {
      ...byTx[tx.txid],
      ...tx,
      receivedAmount,
      sentAmount,
    }

    if (!appState.transactions[tx.txid]?.vin) {
      store.transactions.setItem(
        tx.txid,
        {
          ...(appState.transactions[tx.txid] || {}),
          ...tx,
          dir,
          sentAmount,
          receivedAmount,
        },
      )
    }
  }

  // console.log('getAddrsTransactions by Tx', byTx)
  // console.log('getAddrsTransactions by Alias', byAlias)
  // console.log('getAddrsTransactions by Address', byAddress)

  return {
    byAddress,
    byAlias,
    byTx,
  }
}

export async function getTxs(appState, transactions = []) {
  let contactAddrs = await getContactsFromAddrs(appState)
  let contactOutAddrs = await deriveContactAddrs(appState)

  contactAddrs = {
    ...contactAddrs,
    ...contactOutAddrs,
  }

  let addrs = Object.keys(contactAddrs)

  if (addrs.length === 0) {
    return
  }

  // let TxStore = await store.transactions.keys()
  // let txs = await dashsight.getAllTxs(addrs)

  let txs = await getAddrsTransactions({
    appState, addrs, contactAddrs,
    txs: transactions,
  })

  // console.log('getTxs', {
  //   txs, contactAddrs, contactOutAddrs, addrs
  // })

  return txs
}

export async function processURI(state, target, value) {
  let {
    address,
    xpub,
    xprv,
    name,
    preferred_username,
    sub,
  } = parseAddressField(value)

  let xkey = xprv || xpub

  let xkeyOrAddr = xkey || address

  let info = {
    name: name || '',
    sub,
    preferred_username,
  }

  let preferredAlias = await getUniqueAlias(
    getContactAliases(),
    preferred_username
  )

  let outgoing = {}

  let existingContacts
  let contactWallet

  if (!xkey && address) {
    existingContacts = appState.contacts?.filter(
      c => c.outgoing?.[address]
    )

    outgoing = {
      ...(state.contact.outgoing || {}),
      [address]: {
        address,
      },
    }
  }

  if (xkey) {
    contactWallet = await deriveWalletData(
      xkey,
    )
    let {
      xkeyId,
      addressKeyId,
      addressIndex,
      address: addr,
    } = contactWallet

    existingContacts = appState.contacts?.filter(
      c => c.outgoing?.[xkeyId]
    )

    outgoing = {
      ...(state.contact.outgoing || {}),
      [xkeyId]: {
        addressIndex,
        addressKeyId,
        address: address || addr,
        xkeyId,
        xprv,
        xpub,
      },
    }

    // console.log(
    //   'add contact handleInput parsedAddr',
    //   value,
    //   xkey,
    // )
  }

  let newContact

  if (existingContacts?.length > 0) {
    console.warn(
      `You've already paired with this contact`,
      {
        existingContacts,
        newContact: {
          alias: preferredAlias,
          outgoing,
        }
      }
    )

    // newContact = existingContacts[0]

    let pairings = existingContacts.map(c => `@${c.alias}`)
    if (pairings.length > 1) {
      let lastPairing = pairings.pop()
      pairings = `${pairings.join(', ')} & ${lastPairing}`
    } else {
      pairings = pairings[0]
    }

    // TODO: maybe prompt to show original pairing info
    // in the scenario where your contact
    // lost their contacts list
    target.contactAddr.setCustomValidity(
      `You've already paired with this contact (@${preferred_username}) as ${pairings}`,
    )
    target.reportValidity()
    return;
  } else {
    if (Object.keys(outgoing).length > 0 && contactWallet) {
      let xkeyAddrs = await batchXkeyAddressGenerate(
        contactWallet,
        contactWallet.addressIndex,
      )
      let contactAddrs = {}
      let addresses = xkeyAddrs.addresses.map(g => {
        contactAddrs[g.address] = {
          alias: preferredAlias,
          xkeyId: contactWallet.xkeyId,
        }
        return g.address
      })

      let txs = await getAddrsTransactions({
        appState,
        addrs: addresses,
        contactAddrs,
      })

      // outgoing[contactWallet.xkeyId] = {
      //   ...(outgoing[contactWallet.xkeyId] || {}),
      //   addressIndex: xkeyAddrs.finalAddressIndex,
      // }

      // console.log('xkeyAddrs', {addresses, txs})
    }

    newContact = await appTools.storedData.encryptItem(
      store.contacts,
      state.wallet.xkeyId,
      {
        ...state.contact,
        updatedAt: (new Date()).toISOString(),
        info: {
          ...OIDC_CLAIMS,
          ...(state.contact.info || {}),
          ...info,
        },
        outgoing,
        alias: preferredAlias,
        uri: value,
      },
      false,
    )

    getStoreData(
      store.contacts,
      res => {
        if (res) {
          appState.contacts = res

          return appComponents.contactsList?.restate?.({
            contacts: res,
            userInfo,
          })
        }
      },
      res => async v => {
        res.push(await appTools.storedData.decryptData(v))
      }
    )

    state.contact = newContact

    if (value) {
      target.contactURI.value = value
    }
    if (xkeyOrAddr) {
      target.contactAddr.value = xkeyOrAddr
    }
    if (name) {
      target.contactName.value = name
    }
    if (preferred_username) {
      target.contactAlias.value = preferredAlias
    }
  }

  return
}
