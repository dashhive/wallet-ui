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
  - [ ] Fix any bugs that arise

### Stage 2
- [ ] PWA Improvements & Fixes
  - [ ] Fix White Screen of Death
- [ ] Mobile Improvements
- [ ] Display Wallet balance in desired fiat currency
- [ ] Settings
  - [ ] Preferred fiat Currency (USD, GBP, EUR, etc)
- [ ] Add Memo to Send Dialog
- [ ] Integrations
  - [ ] Save
    - [ ] CrowdNode
    - [ ] Maya
  - [ ] Spend - Gift Cards
    - [ ] DashSpend (CTX)
    - [ ] BitRefill
  - [ ] Earn
- [ ] Contact/Payment Share Features
  - [ ] QR Image / Button Fixes
- [ ] System Wrappers
  - [ ] Desktop / Tauri Wrapper
  - [ ] Mobile / Capacitor App

### Stage 2 - QA
- [ ]

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
- [ ]

### Stage 4
- [ ] Localization for multiple languages
- [ ] Subscriptions
- [ ] If possible, automate `befriend` process with blockchain messaging.
- [ ] Settings
  - [ ] Select Wallet (multiple accounts)
  - [ ] Set Alias for selected wallet
- [ ] Add side-by-side view for contacts to display the XPubs that represent both you & the contact in the connection

### Stage 4 - QA
- [ ]
