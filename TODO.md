## Todo
- [ ] UI Components
  - [ ] Dialogs
    - [x] QR Code
      - [x] Scan
        - [ ] Upload QR image
    - [x] Modify `src/rigs/send-or-request.js` to toggle between send & request, not show both
      - [x] Send Dialog
      - [x] Request Dialog
  - [ ] Fiat balance from:
    - https://rates2.dashretail.org/rates?source=dashretail&%7B%7D=
    - symbol=DASH${symbol}
  - [ ] Styled Drop Down List
  - [ ] Type Ahead Input Field
- [x] Batch generate IndexedDB store addresses on wallet load and after addressIndex is incremented by requesting funds in Send / Request dialog
- [x] Clicking send with a Zero balance throws an error in console
  - Need dialog/error message to indicate what/why it won't send
- [x] On Pairing/Editing contacts:
  - [x] Enforce unique Aliases
  - [x] Should be able to add a contact by normal Dash Address (without Dash URI DIP: aj-contact-scanback features)
  - [x] Check if XkeyID exists
- [x] Add `updatedAt` property to IndexedDB Stores



### Bugs
#### Mobile Specific
- [ ] Copy Buttons don't seem to work reliably
- [x] ~~Toggle Show/Hide password fields is also sketchy~~
  - should be fixed by <https://github.com/dashhive/wallet-ui/commit/b511813db1f432cb80db8a3ffc5d4fc06a897aee>
- [ ] Pairing via QR Code looks like it works, yet clicking save ends with an unpaired contact
- [ ] Unique Alias Collision with only the one contact you're trying to pair with
- [ ] Encrypted Full Backup & Backup Keystore fail to open "Save file dialog" in brave on android
- [ ] Edit Profile, Add Contact & Insufficient Wallet Funds Dialogs have layout issues on mobile

#### General
- [x] Dialog: Confirm Wallet Lock buttons need `line-height: 1;`
- [x] ~~Backup Keystore & Show Seed Phrase failed on initial load but worked after browser refresh~~
  - should be fixed by <https://github.com/dashhive/wallet-ui/commit/b511813db1f432cb80db8a3ffc5d4fc06a897aee>

### Enhancements
- [ ] Dialog: Sent Funds Confirmation
  - currently send closes, and you see your balance change
  - we should show a "Funds Sent" type dialog with a link to the Transaction ID
- [ ] Batch Generate tweaks
  - need to check each address funds and generate 20 past the last address with funds
  - need to pre-generate accounts with some addresses when importing a phrase to start adding contacts after the last account with funds