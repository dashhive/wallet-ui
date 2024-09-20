import {
  TIMEAGO_LOCALE_EN,
  MOMENT, MOMENTS, NEVER,
  SECONDS, MINUTE, HOUR, DAY, WEEK, MONTH, YEAR,
} from './constants.js'

let eventHandlers = []

/**
 * Code Highlighting for String Literals.
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#raw_strings MDN Reference}
 *
 * @example
 *    import { lit as html, lit as css } from './utils.js'
 *    let h = html`<div><span>${example}</span></div>`
 *    let c = css`div > span { color: #bad; }`
 *
 *    // falsey values now default to empty string
 *    let falsey = html`<div>${doesNotExist && html`<img src="a.png">`}</div>`

 *    // falsey === '<div></div>'
 *    // instead of
 *    // falsey === '<div>undefined</div>'
 *
 * @param {TemplateStringsArray} s
 * @param  {...any} v
 *
 * @returns {string}
 */
export const lit = (s, ...v) => String.raw({ raw: s }, ...(v.map(x => x || '')))
// export const lit = (s, ...v) => String.raw({ raw: s }, ...v)

export function isEmpty(value) {
  if (value === null) {
    return true
  }
  // if (typeof value === 'boolean' && value === false) {
  //   return true
  // }
  if (typeof value === 'string' && value?.length === 0) {
    return true
  }
  if (typeof value === 'object' && Object.keys(value)?.length === 0) {
    return true
  }
  if (Array.isArray(value) && value.length === 0) {
    return true
  }
  return false;
}

/**
 * promise debounce changes
 *
 * https://www.freecodecamp.org/news/javascript-debounce-example/
 *
 * @example
 *    const change = debounce((a) => console.log('Saving data', a));
 *    change('b');change('c');change('d');
 *    'Saving data d'
 *
 * @param {(...args) => void} callback
 * @param {number} [delay]
*
* @returns {Promise<any>}
*/
export async function debouncePromise(callback, delay = 300) {
  let timer

  return await new Promise(resolve => async (...args) => {
    clearTimeout(timer)

    timer = setTimeout(() => {
      resolve(callback.apply(this, args))
    }, delay)
  })
}

/**
 * debounce changes
 *
 * https://www.freecodecamp.org/news/javascript-debounce-example/
 *
 * @example
 *    const change = debounce((a) => console.log('Saving data', a));
 *    change('b');change('c');change('d');
 *    'Saving data d'
 *
 * @param {(...args) => void} callback
 * @param {number} [delay]
*
* @returns {(...args) => void}
*/
export function debounce(callback, delay = 300) {
  let timer

  return (...args) => {
    clearTimeout(timer)

    timer = setTimeout(() => {
      return callback.apply(this, args)
    }, delay)

    return timer
  }
}

/**
 * debounce that immediately triggers and black holes any extra
 * executions within the time delay
 *
 * https://www.freecodecamp.org/news/javascript-debounce-example/
 *
 * @example
 *    const dry = nobounce((a) => console.log('Saving data', a));
 *    dry('b');dry('c');dry('d');
 *    'Saving data b'
 *
 * @param {(...args) => void} callback
 * @param {number} [delay]
*
* @returns {(...args) => void}
*/
export function nobounce(callback, delay = 300) {
  let timer

  return (...args) => {
    if (!timer) {
      callback.apply(this, args)
    }

    clearTimeout(timer)

    timer = setTimeout(() => {
      timer = undefined
    }, delay)
  }
}


/**
 * @example
 *    await forIt(500);
 *    nowDoThis()
 *
 * @param {number} [delay]
*
* @returns {Promise<any>}
*/
export function forIt(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

export function timeago(ms, locale = TIMEAGO_LOCALE_EN) {
  var ago = Math.floor(ms / 1000);
  var part = 0;

  if (ago < MOMENTS) { return locale.moment; }
  if (ago < SECONDS) { return locale.moments; }
  if (ago < MINUTE) { return locale.seconds.replace(/%\w?/, `${ago}`); }

  if (ago < (2 * MINUTE)) { return locale.minute; }
  if (ago < HOUR) {
    while (ago >= MINUTE) { ago -= MINUTE; part += 1; }
    return locale.minutes.replace(/%\w?/, `${part}`);
  }

  if (ago < (2 * HOUR)) { return locale.hour; }
  if (ago < DAY) {
    while (ago >= HOUR) { ago -= HOUR; part += 1; }
    return locale.hours.replace(/%\w?/, `${part}`);
  }

  if (ago < (2 * DAY)) { return locale.day; }
  if (ago < WEEK) {
    while (ago >= DAY) { ago -= DAY; part += 1; }
    return locale.days.replace(/%\w?/, `${part}`);
  }

  if (ago < (2 * WEEK)) { return locale.week; }
  if (ago < MONTH) {
    while (ago >= WEEK) { ago -= WEEK; part += 1; }
    return locale.weeks.replace(/%\w?/, `${part}`);
  }

  if (ago < (2 * MONTH)) { return locale.month; }
  if (ago < YEAR) { // 45 years, approximately the epoch
    while (ago >= MONTH) { ago -= MONTH; part += 1; }
    return locale.months.replace(/%\w?/, `${part}`);
  }

  if (ago < NEVER) {
    return locale.years;
  }

  return locale.never;
}

// https://stackoverflow.com/a/66494926
export function getBackgroundColor(stringInput) {
  let stringUniqueHash = [...stringInput].reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${stringUniqueHash % 360}, 100%, 67%)`;
}



export async function sha256(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256", new TextEncoder().encode(str)
  );
  return Array.prototype.map.call(
    new Uint8Array(buf),
    x => (('00' + x.toString(16)).slice(-2))
  ).join('');
}



export async function getAvatarUrl(
  email,
  size = 48,
  rating = 'pg',
  srv = 'gravatar',
) {
  let emailSHA = await sha256(email || '')

  if (srv === 'gravatar') {
    return `https://gravatar.com/avatar/${
      emailSHA
    }?s=${size}&r=${rating}&d=retro`
  }
  if (srv === 'libravatar') {
    return `https://seccdn.libravatar.org/avatar/${
      emailSHA
    }?s=${size}&r=${rating}&d=retro`
  }

  return ''
}

export async function getAvatar(c) {
  let initials = c?.info?.name?.
    split(' ').map(n => n[0]).slice(0,3).join('') || ''
  let nameOrAlias = c?.info?.name || c?.alias || c?.info?.preferred_username

  if (!initials) {
    initials = (c?.alias || c?.info?.preferred_username)?.[0] || ''
  }

  let avStr = `<div class="avatar" style="`

  if (nameOrAlias) {
    avStr += `background-color:${
      getBackgroundColor(nameOrAlias)
    };color:#000;`
  }

  if (c?.info?.picture) {
    avStr += `color:transparent;background-image:url(${c.info.picture});`
  }

  // Gravatar
  if (c?.info?.email) {
    avStr += `color:transparent;background-image:url(${
      await getAvatarUrl(c.info.email)
    });`
  }

  return `${avStr}">${initials}</div>`
}

export function fileIsSubType(file, type) {
  const fileType = file?.type?.split('/')?.[1]

  if (!fileType) {
    return false
  }

  return fileType === type
}

// fileInTypes({type:'application/json'}, ['image/png'])
export function fileInMIMETypes(file, types = []) {
  const fileType = file?.type

  if (!fileType) {
    return false
  }

  return types.includes(fileType)
}

export function fileTypeInTypes(file, types = []) {
  const fileType = file?.type?.split('/')?.[0]

  if (!fileType) {
    return false
  }

  return types.includes(fileType)
}

export function fileTypeInSubtype(file, subtypes = []) {
  const fileSubType = file?.type?.split('/')?.[1]

  if (!fileSubType) {
    return false
  }

  return subtypes.includes(fileSubType)
}

export function readFile(file, options) {
  let opts = {
    expectedFileType: 'json',
    denyFileTypes: ['audio','video','image','font','model'],
    denyFileSubTypes: ['msword','xml'],
    callback: () => {},
    errorCallback: () => {},
    ...options,
  }
  let reader = new FileReader();
  let result

  reader.addEventListener('load', () => {
    if (
      fileTypeInTypes(
        file,
        opts.denyFileTypes,
      ) || fileTypeInSubtype(
        file,
        opts.denyFileSubTypes,
      )
    ) {
      return opts.errorCallback?.({
        err: `Wrong file type: ${file.type}. Expected: ${opts.expectedFileType}.`,
        file,
      })
    }

    try {
      // @ts-ignore
      result = JSON.parse(reader?.result || '{}');

      // console.log('parse loaded json', result);

      opts.callback?.(result, file)

      // state[key] = result
    } catch(err) {
      opts.errorCallback?.({
        err,
        file,
      })

      throw new Error(`failed to parse JSON data from ${file.name}`)
    }
  });

  reader.readAsText(file);
}







export function toSlug(...slugs) {
  return slugs.join('_').toLowerCase()
    .replaceAll(/[^a-zA-Z _]/g, '')
    .replaceAll(' ', '_')
}





export function addListener(
  node,
  event,
  handler,
  capture = false,
  handlers = this?.eventHandlers || eventHandlers,
) {
  console.log('addListener', this, { node, event, handler, capture })
  handlers.push({ node, event, handler, capture })
  node.addEventListener(event, handler, capture)
}

export function addListeners(
  resolve,
  reject,
) {
  if (resolve && reject) {
    addListener(
      this.elements.dialog,
      'close',
      this.events.close(resolve, reject),
    )

    addListener(
      this.elements.dialog,
      'click',
      this.events.click,
    )
  }

  addListener(
    this.elements.form,
    'blur',
    this.events.blur,
  )
  addListener(
    this.elements.form,
    'focusout',
    this.events.focusout,
  )
  addListener(
    this.elements.form,
    'focusin',
    this.events.focusin,
  )
  addListener(
    this.elements.form,
    'change',
    this.events.change,
  )
  // if (updrop) {
    addListener(
      this.elements.form,
      'drop',
      this.events.drop,
    )
    addListener(
      this.elements.form,
      'dragover',
      this.events.dragover,
    )
    addListener(
      this.elements.form,
      'dragend',
      this.events.dragend,
    )
    addListener(
      this.elements.form,
      'dragleave',
      this.events.dragleave,
    )
  // }
  addListener(
    this.elements.form,
    'input',
    this.events.input,
  )
  addListener(
    this.elements.form,
    'reset',
    this.events.reset,
  )
  addListener(
    this.elements.form,
    'submit',
    this.events.submit,
  )
}

export function removeAllListeners(
  targets = [
    this?.elements.dialog,
    this?.elements.form,
  ],
  handlers = this?.eventHandlers || eventHandlers,
) {
  if (this.elements.updrop) {
    targets.push(this.elements.updrop)
  }
  handlers = handlers
    .filter(({ node, event, handler, capture }) => {
      if (targets.includes(node)) {
        node.removeEventListener(event, handler, capture)
        return false
      }
      return true
    })
}


export function formDataEntries(event) {
  let fd = new FormData(
    event.target,
    event.submitter
  )

  return Object.fromEntries(fd.entries())
}

export function copyToClipboard(target) {
  target.select();
  document.execCommand("copy");
}

export function setClipboard(event) {
  event.preventDefault()
  let el = event.target?.previousElementSibling
  let val = el.textContent?.trim()
  if (el.nodeName === 'INPUT') {
    val = el.value?.trim()
  }
  const type = "text/plain";
  const blob = new Blob([val], { type });

  if (
    "clipboard" in navigator &&
    typeof navigator.clipboard.write === "function"
  ) {
    const data = [new ClipboardItem({ [type]: blob })];

    navigator.clipboard.write(data).then(
      cv => {
        console.log('setClipboard', cv)
      },
      ce => {
        console.error('[fail] setClipboard', ce)
      }
    );
  } else {
    copyToClipboard(el)
  }
}

export function openBlobSVG(target) {
	const svgStr = new XMLSerializer().serializeToString(target);
	const svgBlob = new Blob([svgStr], { type: "image/svg+xml" });
	const url = URL.createObjectURL(svgBlob);
	const win = open(url);
	win.onload = (evt) => URL.revokeObjectURL(url);
}
