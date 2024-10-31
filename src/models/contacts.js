import {
  OIDC_CLAIMS,
} from '../utils/constants.js'

import {
  appState,
  appTools,
  store,
  wallets,
  getStoredWallet,
  getUnusedAccountIndex,
} from '../state/index.js'

import {
  isEmpty,
} from '../utils/generic.js'

import {
  getUniqueAlias,
  deriveWalletData,
  batchGenAcctAddrs,
  parseAddressField,
} from '../utils/dash/local.js'

// Create & Update Contact

export function getContactAliases(
  direction // 'outgoing' | 'incoming'
) {
  if (!direction) {
    return appState.contacts
      .filter(
        c => c.alias
      )
      .map(contact => contact.alias)
  }

  return appState.contacts
    .filter(
      c => c.alias &&
      !isEmpty(c[direction])
    )
    .map(contact => contact.alias)
}

export async function parseContactURI(uri) {
  let data = {
    uri,
  }

  if (uri?.length >= 34) {
    // let incoming = {}
    let outgoing = {}

    let {
      address,
      xpub,
      xprv,
      name,
      preferred_username,
      sub,
    } = parseAddressField(uri)

    let xkey = xprv || xpub

    let xkeyOrAddr = xkey || address

    let info = {
      name,
      sub,
      preferred_username,
    }

    let alias = await getUniqueAlias(
      getContactAliases(),
      preferred_username
    )

    if (!xkey && address) {
      outgoing = {
        [address]: {
          address,
        },
      }
    }

    if (xkey) {
      let {
        xkeyId,
        addressKeyId,
        addressIndex,
        address: addr,
      } = await deriveWalletData(
        xkey,
      )

      outgoing = {
        [xkeyId]: {
          addressIndex,
          addressKeyId,
          address: address || addr,
          xkeyId,
          xprv,
          xpub,
        },
      }
    }

    data = {
      uri,
      alias,
      name,
      info,
      outgoing,
      xkeyOrAddr,
      preferred_username,
    }
  }

  // console.log(
  //   'parseContactURI',
  //   data,
  // )

  return data
}

export async function putContact(
  data = {},
) {
  let selectedWallet = getStoredWallet()
  let accountIndex = getUnusedAccountIndex(selectedWallet)

  let shareAccount
  let parsedUri = {}

  if (appState.phrase) {
    console.log(
      'addContact current wallet',
      accountIndex,
      selectedWallet?.xkeyId,
      selectedWallet,
    )

    if (selectedWallet) {
      let upWallet = await store.wallets.setItem(
        localStorage.selectedWallet,
        {
          ...selectedWallet,
          accountIndex,
          updatedAt: (new Date()).toISOString(),
        }
      )
      wallets[localStorage.selectedWallet] = upWallet
    }

    shareAccount = await deriveWalletData(
      appState.phrase,
      accountIndex,
    )

    let created = (new Date()).toISOString()
    // let updated = (new Date()).toISOString()
    let usage = [0,0]

    let newAccount = await store.accounts.setItem(
      shareAccount.xkeyId,
      {
        createdAt: created,
        updatedAt: created,
        accountIndex,
        usage,
        walletId: shareAccount.id,
        xkeyId: shareAccount.xkeyId,
        addressKeyId: shareAccount.addressKeyId,
        address: shareAccount.address,
      }
    )
    let { createdAt, updatedAt, ...contactAcct } = newAccount

    let { addresses, finalAddressIndex } = await batchGenAcctAddrs(
      shareAccount,
      newAccount,
    ) ?? {}

    console.log(
      'addContact derived wallet',
      {
        accountIndex,
        finalAddressIndex,
        addresses,
        shareAccount,
        newAccount,
      }
    )

    if (data.uri) {
      // { address, xpub, xprv, name, preferred_username, sub, }
      parsedUri = await parseContactURI(data.uri)
    }

    console.log('addContact', {parsedUri})

    let alias = await getUniqueAlias(
      getContactAliases(),
      data.alias
    )

    let newContact = await appTools.storedData.encryptItem(
      store.contacts,
      shareAccount.xkeyId,
      storedContact => ({
        createdAt,
        updatedAt: (new Date()).toISOString(),
        incoming: {
          [`${contactAcct.walletId}/${contactAcct.xkeyId}`]: {
            ...contactAcct,
          }
        },
        outgoing: {
          ...(parsedUri.outgoing || {})
        },
        info: {
          ...OIDC_CLAIMS,
          ...(storedContact.info || {}),
          sub: parsedUri?.sub || '',
          ...(data.info || {}),
          preferred_username: data.alias || '',
          // @ts-ignore
          // sub: contactAcct.xkeyId,
          // sub: data.info?.sub || '',
          // name: data.info?.name || '',
        },
        uri: data.uri || '',
        alias,
      }),
      // false,
    )

    // await contactsList.render({
    //   userInfo,
    //   contacts: appState.contacts,
    // })

    console.log(
      'addContact',
      {
        newAccount,
        shareAccount,
        newContact,
      },
    )

    return {
      newAccount,
      shareAccount,
      newContact,
    }
  }
}

// Find Contact(s)
export async function findContactByXkeyID(xkeyId) {
  let contact = appState.contacts.find(
    c => Object.keys(c.incoming).find(i => i.endsWith(xkeyId))
  )
  // console.log('find contact by XkeyID', { contact })
  return contact
  // return await appTools.storedData.decryptItem(
  //   store.contacts,
  //   xkeyId,
  // )
}

export async function findContactByAlias(alias) {
  let contact = appState.contacts.find(c => c.alias === alias)
  console.log('find contact by alias', { contact })
  return contact
}

// Remove Contact(s)

// List Contacts