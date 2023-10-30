
export const STOREAGE_SALT = 'b9f4088bd3a93783147e3d78aa10cc911a2449a0d79a226ae33a5957b368cc18'

export const DUFFS = 100000000;

export const OIDC_CLAIMS = {
  preferred_username: '',
  name: '', // [given_name,middle_name,family_name].join(' ')
  given_name: '',
  family_name: '',
  middle_name: '',
  nickname: '',
  website: '',
  address: {},
  email: '',
  email_verified: false,
  phone_number: '',
  phone_number_verified: false,
  profile: '', // 'https://imgur.com/gallery/y6sSvCr.json',
  picture: '', // 'https://i.imgur.com/y6sSvCr.jpeg', // url to avatar img
  sub: '',
  xpub: '',
  updated_at: (new Date()).toISOString(),
}

export const PHRASE_REGEX = new RegExp(
  /^([a-zA-Z]+\s){11,}([a-zA-Z]+)$/
)
export const ALIAS_REGEX = new RegExp(
  /^[a-zA-Z0-9]{1,}$/
  // Needs support added for Dashes, Underscores & Periods
)
export const DASH_URI_REGEX = new RegExp(
  /^(?:web\+)?(?<protocol>dash)(?:[:])(?:\/\/)?(?<address>X[a-zA-Z0-9]{33})?(?:(?:[?])(?<params>.+))?/,
  'ig'
)


// const DASH_URI_REGEX = new RegExp(
//   /(?<protocol>dash)(?:\:)(?:\/\/)?(?<address>X[1-9A-HJ-NP-Za-km-z]{33})?(?:[?])(?<params>.+)?$/,
//   'ig'
// )

// const DASH_URI_REGEX = new RegExp(
//   /(?<protocol>dash)(?:\:)(?:\/\/)?(?<address>X[1-9A-HJ-NP-Za-km-z]{33})?(?:[?])(?<params>.+)?$/,
//   'ig'
// )

// const DASH_URI_REGEX = new RegExp(
//   /^(?:web\+)?(?<protocol>dash)(?:\:)(?:\/\/)?(?<address>.+)?(?<params>(?:[?])([a-zA-Z_-]+)(?:[=])([a-zA-Z0-9,_\-]+)(?:[&])?)+/,
//   'ig'
// )

// ^((?:web\+)?dash:)(?:\/{0,2})?(.+)$
// (?:web\+dash:)?(?:\/{0,2})?(.+)
// ^(?:(web\+)?dash:)(?:\/{0,2})?(.+)$

// if (uri.match(/^((web\+)?dash:)(\/\/)?(.+)/ig)) {
//   result = parseDashURI(uri)
// }