let currentSignal;
let globalDerivedValue;

/**
 * Creates a reactive signal
 *
 * Inspired By
 * {@link https://gist.github.com/developit/a0430c500f5559b715c2dddf9c40948d Valoo} &
 * {@link https://dev.to/ratiu5/implementing-signals-from-scratch-3e4c Signals from Scratch}
 *
 * @example
 *    let count = createSignal(0)
 *    console.log(count.value) // 0
 *    count.value = 2
 *    console.log(count.value) // 2
 *
 *    let off = count.on((value) => {
 *      document.querySelector("body").innerHTML = value;
 *    });
 *
 *    off();
 *
 * @param {Object} initialValue inital value
*/
export function createSignal(initialValue) {
  let _value = initialValue;
  let _last = _value;
  let subs = [];

  function pub() {
    for (let s of subs) {
      s && s(_value, _last);
    }
  }

  function unsub(fn) {
    for (let i in subs) {
      if (subs[i] === fn) {
        subs[i] = 0;
        // break;
      }
    }
  }

  function on(s) {
    const i = subs.push(s)-1;
    return () => { subs[i] = 0; };
  }

  function once(s) {
    const i = subs.length

    subs.push((_value, _last) => {
      s && s(_value, _last);
      subs[i] = 0;
    });
  }

  return {
    get value() {
      if (currentSignal) {
        on(currentSignal)
      }
      return _value;
    },
    set value(v) {
      _last = _value
      _value = v;
      pub();
    },
    on,
    once,
    unsub,
  }
}

/**
 * Use a reactive signal in hook fashion
 *
 * @example
 *    let [count, setCount, on] = useSignal(0)
 *    console.log(count()) // 0
 *    setCount(2)
 *    console.log(count()) // 2
 *
 *    let off = on(value => {
 *      document.querySelector("body").innerHTML = value;
 *    });
 *
 *    off()
 *
 * @param {Object} initialValue inital value
*/
export function useSignal(initialValue) {
  let _value = initialValue;
  let _last = _value;
  let subs = [];

  function pub() {
    for (let s of subs) {
      s && s(_value, _last);
    }
  }

  function unsub(fn) {
    for (let i in subs) {
      if (subs[i] === fn) {
        subs[i] = 0;
        // break;
      }
    }
  }

  function getValue(v) {
    if (
      currentSignal //&&
      // currentSignal !== globalDerivedValue
    ) {
      on(currentSignal)
    }
    return _value;
  }

  function setValue(v) {
    _last = _value
    _value = v;
    pub();
  }

  function on(s) {
    const i = subs.push(s)-1;
    return () => { subs[i] = 0; };
  }

  function once(s) {
    const i = subs.length

    subs.push((_value, _last) => {
      s && s(_value, _last);
      subs[i] = 0;
    });
  }

  return [
    // _value,
    getValue,
    setValue,
    on,
    once,
    unsub,
  ]
}

/**
 * {@link https://youtu.be/t18Kzj9S8-M?t=351 Understanding Signals}
 *
 * {@link https://youtu.be/1TSLEzNzGQM Learn Why JavaScript Frameworks Love Signals By Implementing Them}
 *
 * @example
 *   const [count, setCount] = useSignal(10)
 *   effect(() => console.log(count()))
 *   setCount(25)
 *
 *   let letter = createSignal('a')
 *   effect(() => console.log(letter.value))
 *   letter.value = 'b'
 *
 * @param {Function} fn
 */
export function effect(fn) {
  currentSignal = fn;

  fn();

  currentSignal = null;

  return fn
}

/**
 * {@link https://youtu.be/1TSLEzNzGQM Learn Why JavaScript Frameworks Love Signals By Implementing Them}
 *
 * @example
 *   let count = createSignal(10)
 *   let double = derived(() => count.value * 2)
 *
 *   effect(
 *     () => console.log(
 *       count.value,
 *       double.value,
 *     )
 *   )
 *
 *   count.value = 25
 *
 * @param {Function} fn
 */
export function derived(fn) {
  const derived = createSignal()

  globalDerivedValue = function derivedValue() {
    derived.value = fn()
  }

  effect(globalDerivedValue)

  return derived
}

/**
 * Creates a `Proxy` wrapped object with optional listeners
 * that react to changes
 *
 * @example
 *    let fooHistory = []
 *
 *    let kung = envoy(
 *      { foo: 'bar' },
 *      function firstListener(state, oldState) {
 *        if (state.foo !== oldState.foo) {
 *          localStorage.foo = state.foo
 *        },
 *      },
 *      async function secondListener(state, oldState) {
 *        if (state.foo !== oldState.foo) {
 *          fooHistory.push(oldState.foo)
 *        }
 *      }
 *    )
 *    kung.foo = 'baz'
 *    console.log(localStorage.foo) // 'baz'
 *    kung.foo = 'boo'
 *    console.log(fooHistory) // ['bar','baz']
 *
 * @param {Object} obj
 * @param {...(
 *  state: any, oldState: any, prop: string | symbol
 * ) => void | Promise<void>?} [initListeners]
 *
 * @returns {obj}
 */
export function envoy(obj, ...initListeners) {
  let _listeners = [...initListeners]
  return new Proxy(obj, {
    get(obj, prop, receiver) {
      if (prop === '_listeners') {
        return _listeners
      }
      return Reflect.get(obj, prop, receiver)
    },
    set(obj, prop, value) {
      if (
        prop === '_listeners' &&
        Array.isArray(value)
      ) {
        _listeners = value
      }

      _listeners.forEach(
        fn => fn(
          {...obj, [prop]: value},
          obj,
          prop
        )
      )

      obj[prop] = value

      return true
    }
  })
}

export async function restate(
  state = {},
  renderState = {},
) {
  let renderKeys = Object.keys(renderState)

  for await (let prop of renderKeys) {
    state[prop] = renderState[prop]
  }

  return state
}
