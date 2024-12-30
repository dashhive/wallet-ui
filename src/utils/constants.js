export const DEFAULT_ENTRYPOINT = document.querySelector('main#app')

export const KS_PRF = {
  'hmac-sha256': 'SHA-256',
}
export const KS_CIPHER = {
  'aes-128-ctr': [
    'AES-CTR',
    128
  ],
  'aes-192-ctr': [
    'AES-CTR',
    192
  ],
  'aes-256-ctr': [
    'AES-CTR',
    256
  ],
  'aes-128-cbc': [
    'AES-CBC',
    128
  ],
  'aes-192-cbc': [
    'AES-CBC',
    192
  ],
  'aes-256-cbc': [
    'AES-CBC',
    256
  ],
  'aes-128-gcm': [
    'AES-GCM',
    128
  ],
  'aes-192-gcm': [
    'AES-GCM',
    192
  ],
  'aes-256-gcm': [
    'AES-GCM',
    256
  ],
}

export const DUFFS = 100000000;

export const OIDC_CLAIMS = {
  preferred_username: '',
  name: '', // [given_name,middle_name,family_name].join(' ')
  given_name: '',
  family_name: '',
  middle_name: '',
  nickname: '',
  gender: '',
  birthdate: '',
  website: '',
  address: {},
  email: '',
  email_verified: false,
  phone_number: '',
  phone_number_verified: false,
  profile: '', // 'https://imgur.com/gallery/y6sSvCr.json',
  picture: '', // 'https://i.imgur.com/y6sSvCr.jpeg', // url to avatar img
  sub: '',
  nonce: '',
  scope: '',
  amount: '',
  xpub: '',
  xprv: '',
  zoneinfo: '',
  locale: '',
  updated_at: (new Date()).toISOString(),
  request: '',
  request_uri: '',
  response_uri: '',
  redirect_uri: '',
}

export const SUPPORTED_CLAIMS = [
  ...Object.keys(OIDC_CLAIMS),
  // 'xprv', 'xpub', 'address',
  // 'preferred_username', 'profile', 'picture', 'website',
  // 'name', 'given_name', 'family_name', 'middle_name', 'nickname',
  // 'email', 'email_verified', 'phone_number', 'phone_number_verified',
  // 'gender', 'birthdate',
  // 'zoneinfo', 'locale', 'updated_at',
  // 'nonce', 'sub', 'scope', 'amount',
  // 'request', 'request_uri', 'response_uri', 'redirect_uri',
]


export const MOMENT = 0;
export const MOMENTS = 2;
export const SECONDS = 5;
export const MINUTE = 60;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;
export const YEAR = 365 * DAY;
// workaround for when `ms = Date.now() - 0`
export const NEVER = 45 * YEAR;

export const TIMEAGO_LOCALE_EN = {
  moment: "a moment ago",
  moments: "moments ago",
  seconds: "%s seconds ago",
  minute: "a minute ago",
  minutes: "%m minutes ago",
  hour: "an hour ago",
  hours: "%h hours ago",
  day: "a day ago",
  days: "%D days ago",
  week: "a week ago",
  weeks: "%w weeks ago",
  month: "a month ago",
  months: "%M months ago",
  years: "over a year ago",
  never: "never",
}


export const PHRASE_REGEX = new RegExp(
  /^([a-zA-Z]+\s){11,}([a-zA-Z]+)$/
)
export const AMOUNT_REGEX = new RegExp(
  // /^[0-9]{1,5}?$/
  /^[0-9]+(\.[0-9]{1,8})?%?$/
)
export const ALIAS_REGEX = new RegExp(
  /^[a-zA-Z0-9]{1,}([a-zA-Z0-9_.\-]+[a-zA-Z0-9])?$/
)
export const DASH_URI_REGEX = new RegExp(
  /^(?:web\+)?(?<protocol>dash)(?:[:])(?:\/\/)?(?<address>X[a-zA-Z0-9]{33})?(?:(?:[?])(?<params>.+))?/,
  'ig'
)

export const VERBOSE = true

export const RECEIVE = 0 // DashHd.RECEIVE
export const CHANGE = 1 // DashHd.CHANGE

export const USAGE = {
  RECEIVE,
  CHANGE,
}

const NOT_LOADING = 0
const LOADING = 1
const SUCCESS = 2
const ERROR = 3

export const DIALOG_STATUS = {
  NOT_LOADING,
  LOADING,
  SUCCESS,
  ERROR
}

export const DCD_RPC_ENDPOINT = 'https://rpc.digitalcash.dev/'
export const DCD_RPC_AUTH = btoa(`user:pass`);

export const CORS_BYPASS = 'https://wallet.dashing.trade/api/cors'

export const CROWDNODE = {
  offset: 20000,
  duffs: 100000000,
  satoshis: 100000000,
  depositMinimum: 100000,
  stakeMinimum: 50000000,

  network: {
    main: {
      // baseUrl: "https://app.crowdnode.io",
      baseUrl: `${CORS_BYPASS}/app.crowdnode.io`,
      hotwallet: "XjbaGWaGnvEtuQAUoBgDxJWe8ZNv45upG2",
    },
    test: {
      // baseUrl: "https://test.crowdnode.io",
      baseUrl: `${CORS_BYPASS}/test.crowdnode.io`,
      hotwallet: "yMY5bqWcknGy5xYBHSsh2xvHZiJsRucjuy",
    },
  },

  /**
   * @type {Record<String, Number>}
   */
  requests: {
    acceptTerms: 65536,
    offset: 20000,
    signupForApi: 131072,
    toggleInstantPayout: 4096,
    withdrawMin: 1,
    withdrawMax: 1000,
  },

  /**
   * @type {Record<String, Number>}
   */
  messages: {
    PleaseAcceptTerms: 2,
    WelcomeToCrowdNodeBlockChainAPI: 4,
    DepositReceived: 8,
    WithdrawalQueued: 16,
    WithdrawalFailed: 32,
    AutoWithdrawalEnabled: 64,
    AutoWithdrawalDisabled: 128,
  },

  /**
   * @type {Record<Number, String>}
   */
  responses: {},
}

CROWDNODE.responses = Object.fromEntries(
  Object.entries(CROWDNODE.messages).map(
    ([k,v]) => [v,k]
  )
)
