import {
  DashWallet,
  DashTx,
  DashSight,
  DashSocket,
} from '../imports.js'

import {
  walletFunds,
} from '../state/index.js'

import {
  DatabaseSetup,
  loadStoreObject,
} from './db.js'

import {
  batchGenAccts,
  batchGenAcctsAddrs,
  deriveWalletData,
  deriveContactAddrs,
  getContactsFromAddrs,
  selectOptimalUtxos,
  sortAddrs,
  sortIncomingAndOutgoingTxs,
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

  // setTimeout(() => {
  //   dashsocket.close()
  // }, 15*60*1000);

  return dashsocket
}

// export async function checkWalletFunds(addr, wallet = {}) {
//   const HOUR = 1000 * 60 * 60;

//   let {
//     address,
//     accountIndex,
//     addressIndex,
//     usageIndex,
//   } = addr
//   let updatedAt = Date.now()
//   let $addr = await store.addresses.getItem(address) || {}

//   $addr = {
//     walletId: wallet.id,
//     accountIndex,
//     addressIndex,
//     usageIndex,
//     ...$addr,
//   }
//   // console.log('checkWalletFunds $addr', $addr)
//   let walletFunds = $addr?.insight

//   if (
//     !walletFunds?.updatedAt ||
//     updatedAt - walletFunds?.updatedAt > HOUR
//   ) {
//     // console.info('check insight api for addr', addr)

//     let insightRes = await dashsight.getInstantBalance(address)

//     if (insightRes) {
//       let { addrStr, ...res } = insightRes
//       walletFunds = res

//       $addr.insight = {
//         ...walletFunds,
//         updatedAt,
//       }

//       store.addresses.setItem(
//         address,
//         $addr,
//       )
//     }
//   }

//   // console.info('check addr funds', addr, walletFunds)

//   return $addr
// }

export async function updateAddrFunds(
  wallet, insightRes,
) {
  let updatedAt = Date.now()
  let { addrStr, ...res } = insightRes
  let $addr = await store.addresses.getItem(addrStr) || {}
  let {
    walletId,
    xkeyId,
  } = $addr

  // console.log(
  //   'checkWalletFunds $addr',
  //   $addr,
  //   walletId,
  //   wallet?.id,
  //   walletId === wallet?.id
  // )

  if (walletId && walletId === wallet?.id) {
    let storedWallet = await store.wallets.getItem(walletId) || {}
    let storedAccount = await store.accounts.getItem(xkeyId) || {}

    $addr.insight = {
      ...res,
      updatedAt,
    }

    store.addresses.setItem(
      addrStr,
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
      store.wallets.setItem(
        walletId,
        {
          ...storedWallet,
          accountIndex: $addr.accountIndex,
        }
      )
      let storeAcctLen = (await store.accounts.length())-1

      console.log('updateAddrFunds', {
        acctIdx: $addr.accountIndex,
        storeAcctLen,
        sameOrBigger: $addr.accountIndex >= storeAcctLen,
      })

      if ($addr.accountIndex >= storeAcctLen) {
        batchGenAccts(wallet.recoveryPhrase, $addr.accountIndex)
          .then(() => {
            // updateAllFunds(wallet)
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

export async function updateAllFunds(wallet) {
  let funds = 0
  let addrKeys = await store.addresses.keys()

  if (addrKeys.length === 0) {
    walletFunds.balance = funds
    return funds
  }

  console.log(
    'updateAllFunds getInstantBalances for',
    {addrKeys},
    addrKeys.length,
  )

  let balances = await dashsight.getInstantBalances(addrKeys)
  // let txs = await dashsight.getAllTxs(
  //   addrKeys
  // )

  // console.log('getAllTxs', txs)

  if (balances.length >= 0) {
    walletFunds.balance = funds
  }

  // add insight balances to address
  for (const insightRes of balances) {
    let { addrStr } = insightRes
    let addrIdx = addrKeys.indexOf(addrStr)
    if (addrIdx > -1) {
      addrKeys.splice(addrIdx, 1)
    }
    funds += (await updateAddrFunds(wallet, insightRes))?.balance || 0
    walletFunds.balance = funds
  }

  // remove insight balances from address
  for (const addr of addrKeys) {
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
  // let transactions
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
    // transactions = await dashsight.getAllTxs(
    //   Object.keys(privateKeys)
    // )
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
    // transactions = await dashsight.getAllTxs(
    //   [tmpWallet.address]
    // )
  }

  // console.log('getAllTxs', transactions)

  return {
    privateKeys,
    cachedAddrs,
    coreUtxos,
    // transactions,
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



export async function getAddrsTransactions({
  appState, addrs, contactAddrs = {},
  txs = [],
}) {
  let storeAddrs = await loadStoreObject(store.addresses)
  if (txs.length === 0) {
    txs = await dashsight.getAllTxs(addrs)
  }
  let byAddress = {}
  let byAlias = {}
  let byTx = {}

  // console.log('getAddrsTransactions', {
  //   txs, addrs, contactAddrs, appT: appState.transactions
  // })

  for await (let tx of txs) {
    let dir = 'received'
    let conAddr
    let sentAmount = 0
    let receivedAmount = 0

    for await (let vin of tx.vin) {
      let addr = vin.addr
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

    for await (let vout of tx.vout) {
      if (vout?.scriptPubKey?.addresses) {
        for await (let addr of vout.scriptPubKey.addresses) {
          // let addr = vout.scriptPubKey.addresses[0]
          conAddr = contactAddrs[addr]

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
      }
    }

    byTx[tx.txid] = {
      ...byTx[tx.txid],
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
