export const STOREAGE_SALT = 'b9f4088bd3a93783147e3d78aa10cc911a2449a0d79a226ae33a5957b368cc18'

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
  years: "more than a year ago",
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
