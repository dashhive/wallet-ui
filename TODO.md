## Todo
- [ ] UI Components
  - [ ] Dialogs
    - [x] QR Code
      - [x] Scan
        - [ ] Upload QR image
  - [ ] Fiat balance from:
    - https://rates2.dashretail.org/rates?source=dashretail&%7B%7D=
    - symbol=DASH${symbol}
  - [ ] Styled Drop Down List
  - [ ] Type Ahead Input Field


### Bugs
#### Mobile Specific
- [ ] Edit Profile, Add Contact & Insufficient Wallet Funds Dialogs have layout issues on mobile
- [ ] Contact Data List Selector in the Send Dialog on mobile does not show contact alias hints
  - Appears to be an issue specific to Firefox on Android, both normal version (in normal & private view) & Firefox Focus
- [x] Copy Buttons don't seem to work reliably
- [x] Unique Alias Collision with only the one contact you're trying to pair with
  - Unable to verify and reproduce issue
- [x] After initial pairing between mobile & desktop wallets, we funded the wallet from an external source, no page refresh but websocket updated balance, attempting to send to mobile contact from desktop failed
  - Should be fixed by https://github.com/dashhive/wallet-ui/pull/31/commits/6c96982925544aeafac470d46722a2f5bdb050d0
  - tried to POST to https://insight.dash.org/insight-api/addrs/utxo with an empty `addrs` array/string
  - TypeError: Cannot read properties of undefined (reading 'split')
    at AddressController.checkAddrs (/insight/node_modules/@dashevo/insight-api/lib/addresses.js:100:34)
    at Layer.handle [as handle_request] (/insight/node_modules/express/lib/router/layer.js:95:5)
    at next (/insight/node_modules/express/lib/router/route.js:144:13)
    at /insight/node_modules/@dashevo/insight-api/lib/index.js:78:5
    at Layer.handle [as handle_request] (/insight/node_modules/express/lib/router/layer.js:95:5)
    at next (/insight/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/insight/node_modules/express/lib/router/route.js:114:3)
    at Layer.handle [as handle_request] (/insight/node_modules/express/lib/router/layer.js:95:5)
    at /insight/node_modules/express/lib/router/index.js:284:15
    at Function.process_params (/insight/node_modules/express/lib/router/index.js:346:12)
- [ ]

### Enhancements
- [x] Dialog: Sent Funds Confirmation
  - currently send closes, and you see your balance change
  - we should show a "Funds Sent" type dialog with a link to the Transaction ID
- [ ] Batch Generate tweaks
  - need to check each address funds and generate 20 past the last address with funds
  - need to pre-generate accounts with some addresses when importing a phrase to start adding contacts after the last account with funds

#### General
- [ ] Dialog: Send Error Messages
  - we need to surface errors in the UI on send failure
