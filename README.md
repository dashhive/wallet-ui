# Wallet UI

A Graphical User Interface (GUI) for
[DashWallet.js](https://github.com/dashhive/DashWallet.js)


## Roadmap
### Stage 1
- [x] Initial Project Setup
- [x] Implementation of `DashHd` & `DashPhrase` modules
  - [x] To generate a new wallet
  - [x] To restore an existing wallet via recovery phrase
- [x] Contacts
  - [x] Share Pairing Contact Info
    - Dash URI
      - [DIP: aj-contact-scanback](https://github.com/dashhive/DIPs/blob/aj-contact-scanback/aj-contact-scanback.md#1-contact-exchange)
      - ```
        dash://?xpub=xpub6FKUF6P1ULrfvSrhA9DKSS3MA3digsd27MSTMjBxCczsfYz7vcFLnbQwjP9CsAfEJsnD4UwtbU43iZaibv4vnzQNZmQAVcufN4r3pva8kTz
              &sub=01H5KG2NGES5RVMA85YB3M6G0G
              &nickname=Prime%208
              &profile=https://imgur.com/gallery/y6sSvCr.json
              &picture=https://i.imgur.com/y6sSvCr.jpeg
              &scope=sub,nickname,profile,xpub
              &redirect_uri=https://
        ```
    - QR Code (uses the Dash URI from above)
  - [x] Add a Contact
  - [x] List
  - [x] Edit
  - [x] Remove
- [x] Funding
  - [x] Request
  - [x] Send
- [x] Modify CrypticStorage.js Keystore code to be Xchain compatible
- [x] Encrypt wallet data in LocalStorage / IndexedDB
  - [x] Recovery Phrase
  - [x] Aliases Data
  - [x] Contact Data
- [x] Backup/Restore Wallet & Contacts

### Stage 1 - QA
- [ ] User testing of wallet and all processes
  - Fix any bugs that arise

### Stage 2
See the [Stage 2](/../../milestone/2) milestone

### Stage 2 - QA
- [ ] ...

### Stage 3
- [ ] Contact/Payment Share Features
  - [ ] SMS (sms:)
  - [ ] Email (mailto:)
- [ ] Transactions view
  - [ ] Table with filter/sort
  - [ ] Select & Copy as CSV
- [ ] View & manage addresses associated with Wallet
- [ ] Coin Control
  - [ ] Set Fund Denomination for Send & Request payments
  - [ ] Cash Drawer to display coins separated by denomination
- [ ] Theme: Light version

### Stage 3 - QA
- [ ] ...

### Stage 4
- [ ] Localization for multiple languages
- [ ] Subscriptions
- [ ] If possible, automate `befriend` process with blockchain messaging.
- [ ] Settings
  - [ ] Select Wallet (multiple accounts)
  - [ ] Set Alias for selected wallet
- [ ] Add side-by-side view for contacts to display the XPubs that represent both you & the contact in the connection

### Stage 4 - QA
- [ ] ...


### Backlog
- [ ] style(julius): Is there some reason it is necessary to use the terms “disconnect” and “add wallet” as opposed to just “log in” and “log out”?
- [ ] Tutorializing for the user
  - [ ] doc(julius): Minor aspects of user understanding: how does the wallet actually work? What information is your browser storing when you create a wallet? Is it downloading a temporary self custodial wallet into the browser session? How does that work, where is it saved to? How does locking work?
- [ ] doc(julius): User experience: should you be able to create a new alias every time you log back in?
- [ ] style(julius): Minor visual design notes: the landing page feels slightly “empty”. Awkward side columns.
- [ ] feat: Maybe we should use the big empty space in the contacts list to recommend pairing with other prominent wallets (mobile wallet, Desktop wallet, etc).
  - [ ] DCG’s mobile wallet definitely needs to display a QR for its xpub address.
  - [ ] We need to support importing raw xpubs if we don’t already.
- [ ] style: Top button is “adjective noun”, bottom two buttons are “verb noun”. Maybe make it consistent.
- [ ] feat: Every time I click Request the wallet generates a new address. This might be unsettling for users. Need to rethink this functionality. Side note/question: Is this cycling through the 0 index on the HD path when no contact is selected? Either way, we may want to put our own username in the alias input box by default, which would be the default funding mechanism.
- [ ] Contact Data List Selector in the Send Dialog on mobile does not show contact alias hints
  - Appears to be an issue specific to Firefox on Android, both normal version (in normal & private view) & Firefox Focus
- [ ] Edit Profile, Add Contact & Insufficient Wallet Funds Dialogs have layout issues on mobile
- [ ] ...
