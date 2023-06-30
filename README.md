# Wallet UI

A Graphical User Interface (GUI) for
[DashWallet.js](https://github.com/dashhive/DashWallet.js)


## Roadmap
### Stage 1
 - [x] Initial Project Setup
 - [ ] Implementation of `dashsight` & `dashwallet` modules
	 - [ ] To [generate a new wallet](https://github.com/dashhive/DashWallet.js#walletgeneratewalletinfo)
	 - [ ] To restore an existing wallet via recovery phrase and/or WIFs
	 - [ ] To [get balance of wallet](https://github.com/dashhive/DashWallet.js#walletbalances)
 - [ ] Add Usage Controls
	 - [ ] [Share Pairing Contact Info](https://github.com/dashhive/DashWallet.js#walletbefriendfrienddetails)
	 - [ ] Add a Contact
	 - [ ] Request Funds
		 - [DashWallet.js#walletfindchangewalletfriendopts](https://github.com/dashhive/DashWallet.js#walletfindchangewalletfriendopts)
	 - [ ] Send Funds
		 - [DashWallet.js#walletfindfriendfriendopts](https://github.com/dashhive/DashWallet.js#walletfindfriendfriendopts)
 - [ ] Display List of Contacts
	 - [ ] Send
	 - [ ] Request
	 - [ ] Edit
	 - [ ] Remove

### Stage 2
 - [ ] Backup Wallet & Contacts
 - [ ] Encrypt wallet data in local storage
 - [ ] Transactions view
	 - [ ] Table with filter/sort
	 - [ ] Select & Copy as CSV
 - [ ] Display Wallet balance in desired fiat currency
 - [ ] Settings
	 - [ ] Select Wallet (multiple accounts)
	 - [ ] Set Alias for selected wallet
	 - [ ] Preferred fiat Currency
		 - USD
		 - GBP
		 - EUR
		 - etc
 - [ ] Contact/Payment Share Features
	 - [ ] SMS
	 - [ ] Email
	 - [ ] QR Image
 - [ ] Set Fund Denomination for Send & Request  payments

### Stage 3
 - [ ] Cash Drawer to display coins separated by denomination
 - [ ] View & manage addresses associated with Wallet
 - [ ] Add side-by-side view for contacts to display the XPubs that represent both you & the contact in the connection
 - [ ] Gift card integration
	 - [ ] DashDirect
	 - [ ] BitRefill

### Stage 4
 - [ ] Savings account (Investing) Integration
	 - [ ] CrowdNode
	 - [ ] THORChain / Maya
 - [ ] Subscriptions
 - [ ] If possible, automate `befriend` process with blockchain messaging.

### Stage 5
 - [ ] Tauri Wrapper
 - [ ] Mobile App
