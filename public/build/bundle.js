
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.17.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/ComponentA.svelte generated by Svelte v3.17.1 */

    function create_fragment(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Component A");
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class ComponentA extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ComponentA",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (typeof result[key] === 'object' && typeof val === 'object') {
          result[key] = merge(result[key], val);
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Function equal to merge with the difference being that no reference
     * to original objects is kept.
     *
     * @see merge
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function deepMerge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (typeof result[key] === 'object' && typeof val === 'object') {
          result[key] = deepMerge(result[key], val);
        } else if (typeof val === 'object') {
          result[key] = deepMerge({}, val);
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      deepMerge: deepMerge,
      extend: extend,
      trim: trim
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%40/gi, '@').
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isValidXss = function isValidXss(requestURL) {
      var xssRegex = /(\b)(on\w+)=|javascript|(<\s*)(\/*)script/gi;
      return xssRegex.test(requestURL);
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (isValidXss(url)) {
              throw new Error('URL contains XSS injection attempt');
            }

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password || '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          var cookies$1 = cookies;

          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies$1.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (requestData === undefined) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'params', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy'];
      var defaultToConfig2Keys = [
        'baseURL', 'url', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress',
        'maxContentLength', 'validateStatus', 'maxRedirects', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath'
      ];

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, function mergeDeepProperties(prop) {
        if (utils.isObject(config2[prop])) {
          config[prop] = utils.deepMerge(config1[prop], config2[prop]);
        } else if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        } else if (utils.isObject(config1[prop])) {
          config[prop] = utils.deepMerge(config1[prop]);
        } else if (typeof config1[prop] !== 'undefined') {
          config[prop] = config1[prop];
        }
      });

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        } else if (typeof config1[prop] !== 'undefined') {
          config[prop] = config1[prop];
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys);

      var otherKeys = Object
        .keys(config2)
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, function otherKeysDefaultToConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        } else if (typeof config1[prop] !== 'undefined') {
          config[prop] = config1[prop];
        }
      });

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(utils.merge(config || {}, {
          method: method,
          url: url
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(utils.merge(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios_1;

    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios.Cancel = Cancel_1;
    axios.CancelToken = CancelToken_1;
    axios.isCancel = isCancel;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;

    var axios_1 = axios;

    // Allow use of default import syntax in TypeScript
    var default_1 = axios;
    axios_1.default = default_1;

    var axios$1 = axios_1;

    /* src/List.svelte generated by Svelte v3.17.1 */

    const file = "src/List.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (7:2) {#each listData as entry}
    function create_each_block(ctx) {
    	let li;
    	let t0_value = /*entry*/ ctx[2][0] + "";
    	let t0;
    	let t1;
    	let t2_value = /*entry*/ ctx[2][1] + "";
    	let t2;
    	let t3;
    	let t4_value = /*yearData*/ ctx[1].works[/*entry*/ ctx[2][0]].firsts.length + "";
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(" - ");
    			t2 = text(t2_value);
    			t3 = text(" - ");
    			t4 = text(t4_value);
    			t5 = text(" firsts");
    			add_location(li, file, 7, 4, 105);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    			append_dev(li, t4);
    			append_dev(li, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*listData*/ 1 && t0_value !== (t0_value = /*entry*/ ctx[2][0] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*listData*/ 1 && t2_value !== (t2_value = /*entry*/ ctx[2][1] + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*yearData, listData*/ 3 && t4_value !== (t4_value = /*yearData*/ ctx[1].works[/*entry*/ ctx[2][0]].firsts.length + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(7:2) {#each listData as entry}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let ol;
    	let each_value = /*listData*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(ol, file, 5, 0, 68);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ol, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*yearData, listData*/ 3) {
    				each_value = /*listData*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ol, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ol);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { listData } = $$props;
    	let { yearData } = $$props;
    	const writable_props = ["listData", "yearData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("listData" in $$props) $$invalidate(0, listData = $$props.listData);
    		if ("yearData" in $$props) $$invalidate(1, yearData = $$props.yearData);
    	};

    	$$self.$capture_state = () => {
    		return { listData, yearData };
    	};

    	$$self.$inject_state = $$props => {
    		if ("listData" in $$props) $$invalidate(0, listData = $$props.listData);
    		if ("yearData" in $$props) $$invalidate(1, yearData = $$props.yearData);
    	};

    	return [listData, yearData];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, { listData: 0, yearData: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*listData*/ ctx[0] === undefined && !("listData" in props)) {
    			console.warn("<List> was created without expected prop 'listData'");
    		}

    		if (/*yearData*/ ctx[1] === undefined && !("yearData" in props)) {
    			console.warn("<List> was created without expected prop 'yearData'");
    		}
    	}

    	get listData() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listData(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yearData() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yearData(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DataBlock.svelte generated by Svelte v3.17.1 */

    const file$1 = "src/DataBlock.svelte";

    function create_fragment$2(ctx) {
    	let dt;
    	let t0_value = /*entry*/ ctx[0].title + "";
    	let t0;
    	let t1;
    	let dd;
    	let t2_value = /*entry*/ ctx[0].data + "";
    	let t2;

    	const block = {
    		c: function create() {
    			dt = element("dt");
    			t0 = text(t0_value);
    			t1 = space();
    			dd = element("dd");
    			t2 = text(t2_value);
    			attr_dev(dt, "class", "DataBlock__tag");
    			add_location(dt, file$1, 4, 0, 40);
    			attr_dev(dd, "class", "DataBlock__data");
    			add_location(dd, file$1, 5, 0, 86);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dt, anchor);
    			append_dev(dt, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, dd, anchor);
    			append_dev(dd, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*entry*/ 1 && t0_value !== (t0_value = /*entry*/ ctx[0].title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*entry*/ 1 && t2_value !== (t2_value = /*entry*/ ctx[0].data + "")) set_data_dev(t2, t2_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dt);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(dd);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { entry } = $$props;
    	const writable_props = ["entry"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DataBlock> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("entry" in $$props) $$invalidate(0, entry = $$props.entry);
    	};

    	$$self.$capture_state = () => {
    		return { entry };
    	};

    	$$self.$inject_state = $$props => {
    		if ("entry" in $$props) $$invalidate(0, entry = $$props.entry);
    	};

    	return [entry];
    }

    class DataBlock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, { entry: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataBlock",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*entry*/ ctx[0] === undefined && !("entry" in props)) {
    			console.warn("<DataBlock> was created without expected prop 'entry'");
    		}
    	}

    	get entry() {
    		throw new Error("<DataBlock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set entry(value) {
    		throw new Error("<DataBlock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const defaultScoringMatrix = {
      1: 10,
      2: 9,
      3: 8,
      4: 7,
      5: 6,
      6: 5,
      7: 4,
      8: 3,
      9: 2,
      10: 1,
      '_': 0.5,
    };

    const addMetricToScore = (val, rank, scoringMatrix = defaultScoringMatrix) => {
      const score = scoringMatrix[rank];
      return val ? val + score : score;
    };

    const getUnrankedListValue = (list, scoringMatrix = defaultScoringMatrix) => {
      const rankedCount = Object.values(list).filter(v => typeof v === 'number').length;
      const unrankedCount = Object.values(list).length - rankedCount;
      const totalMatrixScorePoints = Object.entries(scoringMatrix).reduce(
        (acc, [rank, score]) => {
          if (typeof rank === 'number') {
            return acc + score;
          }
          return acc;
        }, 0
      );
      return (totalMatrixScorePoints / Object.values(list)) * unrankedCount;
    };

    const processListsWithRankings = (critics, matrix = defaultScoringMatrix) => {
      const films = {};
      Object.values(critics).forEach(({ list }) => {
        matrix._ = matrix._ || getUnrankedListValue(list, matrix);
        Object.entries(list).forEach(([workName, ranking]) => {
          films[workName] = addMetricToScore(films[workName], ranking, matrix);
        });
      });
      return Object.entries(films).sort((a, b) => b[1] - a[1]);
    };

    const getHighestWithoutNumberOne = (processedList, data) =>
      (processedList.find(([v]) => data.works[v].firsts.length === 0) || [])[0];

    const getLowestNumberOne = (processedList, data) =>
      ([...processedList].reverse().find(([v]) => data.works[v].firsts.length > 0) || [])[0];

    const getLowestNumberOneValidator = (processedList, data) =>
      ([...processedList].reverse()
        .find(([v]) => (
          data.works[v].firsts.length > 0 && data.works[v].critics.length > 3
        )) || []
      )[0];

    // likely not working corretly
    const getMostDivisivePair = (processedList, data) => {
      let i = 1;
      let j = 2;
      let a = null;
      let b = null;
      while (j < processedList.length) {
        a = data.works[processedList[i][0]];
        b = data.works[processedList[j][0]];
        let containsNoMatches = true;
        a.critics.forEach(critic => {
          if (b.critics.includes(critic)) {
            containsNoMatches = false;
          }
        });
        if (containsNoMatches) {
          return [
            processedList[i][0],
            processedList[j][0],
          ];
        }
        if (j - i === 2) {
          i += 1;
        }
        if (j - i === 1) {
          j += 1;
        }
      }
      if (
        i === processedList.length
        || j === processedList.length
      ) {
        return [];
      } 

      return [
        processedList[i][0],
        processedList[j][0],
      ];

      // for (let i = 0; i < processedList.length; i++) {
      //   const a = data.works[processedList[i][0]];
      //   for (let j = i+1; j < processedList.length; j++) {
      //     const b = data.works[processedList[j][0]];
      //     let noMatch = true;
      //     a.critics.forEach(critic => {
      //       if (b.critics.includes(critic)) {
      //         noMatch = false;
      //       }
      //     });
      //     if (noMatch) {
      //     }
      //   }
      // }
      // return pair;
    };

    const getFilmsInOneList = (data) => (
      Object.keys(data.works)
        .filter(workKey => data.works[workKey].critics.length === 1)
        .reduce((acc, key) => ([
          ...acc,
          key,
        ]), [])
    );

    const getMostContrarianCritic = (processedList, data, maxUniqueEntries) => {
      const processedListObj = processedList.reduce((acc, val) => ({
        ...acc,
        [val[0]]: val[1],
      }), {});

      let totalVal = 0;
      let biggestContrarian = {
        name: null,
        score: Number.MAX_SAFE_INTEGER,
      };

      Object.entries(data.critics).forEach(([critic, { list }]) => {
        const criticListVal = Object.keys(list).reduce((acc, val) => 
          acc + processedListObj[val], 0
        );
        totalVal += (criticListVal || 0);

        if (
          Object.keys(list).length >= 10
          && criticListVal < biggestContrarian.score
          && (
            !maxUniqueEntries
            || (
              Object.keys(list)
                .filter(v => data.works[v].critics.length === 1)
                .length <= maxUniqueEntries
            )
          )
        ) {
          biggestContrarian = {
            name: critic,
            score: criticListVal,
          };
        }
      });
      return {
        ...biggestContrarian,
        totalVal,
      };
    };

    const deriveAdditionalDataFromProcessedList = (processedList, data) => {
      const biggestLoser = getHighestWithoutNumberOne(processedList, data);
      const smallestWinner = getLowestNumberOne(processedList, data);
      const smallestWinnerValidator = getLowestNumberOneValidator(processedList, data);
      const divisivePair = getMostDivisivePair(processedList, data);
      const onlyInOneList = getFilmsInOneList(data);
      const mostContrarianCritic = getMostContrarianCritic(processedList, data);
      const mostContrarianCriticValidator = getMostContrarianCritic(processedList, data, 3);

      return {
        biggestLoser,
        smallestWinner,
        smallestWinnerValidator,
        divisivePair,
        onlyInOneList,
        mostContrarianCritic,
        mostContrarianCriticValidator,
      };
    };

    /* src/DataList.svelte generated by Svelte v3.17.1 */

    const { Object: Object_1 } = globals;
    const file$2 = "src/DataList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (33:2) {#each dataList as entry   }
    function create_each_block$1(ctx) {
    	let current;

    	const datablock = new DataBlock({
    			props: { entry: /*entry*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(datablock.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(datablock, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const datablock_changes = {};
    			if (dirty & /*dataList*/ 1) datablock_changes.entry = /*entry*/ ctx[5];
    			datablock.$set(datablock_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datablock.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datablock.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(datablock, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(33:2) {#each dataList as entry   }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let dl;
    	let current;
    	let each_value = /*dataList*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			dl = element("dl");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(dl, file$2, 31, 0, 1613);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dl, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(dl, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*dataList*/ 1) {
    				each_value = /*dataList*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(dl, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dl);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { yearData } = $$props;
    	let { listData } = $$props;
    	let derivedData;
    	let dataList = [];

    	const getDerivedData = () => {
    		derivedData = deriveAdditionalDataFromProcessedList(listData, yearData);

    		$$invalidate(0, dataList = [
    			{
    				title: "Number of list:",
    				data: Object.keys(yearData.critics).length
    			},
    			{
    				title: "Number of unique entries: ",
    				data: Object.keys(yearData.works).length
    			},
    			{
    				title: "Highest ranked with no number 1's",
    				data: derivedData.biggestLoser
    			},
    			{
    				title: "Lowest ranked with number 1's",
    				data: derivedData.smallestWinner
    			},
    			{
    				title: "Lowest ranked with number 1 (and more than one nomination)",
    				data: derivedData.smallestWinnerValidator
    			},
    			{
    				title: "Highest ranked pair that are in no lists together",
    				data: derivedData.divisivePair
    			},
    			{
    				title: "Most contrarian critic (lowest points for overall list) ",
    				data: ` ${derivedData.mostContrarianCritic.name} with ${derivedData.mostContrarianCritic.score}
    against an average of ${derivedData.mostContrarianCritic.totalVal / Object.keys(yearData.critics).length}`
    			},
    			{
    				title: "Most contrarian critic with &lt;4 unique entries",
    				data: ` ${derivedData.mostContrarianCriticValidator.name} with ${derivedData.mostContrarianCriticValidator.score}
    against an average of ${derivedData.mostContrarianCriticValidator.totalVal / Object.keys(yearData.critics).length}`
    			}
    		]);
    	};

    	beforeUpdate(getDerivedData);
    	const writable_props = ["yearData", "listData"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DataList> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("yearData" in $$props) $$invalidate(1, yearData = $$props.yearData);
    		if ("listData" in $$props) $$invalidate(2, listData = $$props.listData);
    	};

    	$$self.$capture_state = () => {
    		return {
    			yearData,
    			listData,
    			derivedData,
    			dataList
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("yearData" in $$props) $$invalidate(1, yearData = $$props.yearData);
    		if ("listData" in $$props) $$invalidate(2, listData = $$props.listData);
    		if ("derivedData" in $$props) derivedData = $$props.derivedData;
    		if ("dataList" in $$props) $$invalidate(0, dataList = $$props.dataList);
    	};

    	return [dataList, yearData, listData];
    }

    class DataList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, { yearData: 1, listData: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataList",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*yearData*/ ctx[1] === undefined && !("yearData" in props)) {
    			console.warn("<DataList> was created without expected prop 'yearData'");
    		}

    		if (/*listData*/ ctx[2] === undefined && !("listData" in props)) {
    			console.warn("<DataList> was created without expected prop 'listData'");
    		}
    	}

    	get yearData() {
    		throw new Error("<DataList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yearData(value) {
    		throw new Error("<DataList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get listData() {
    		throw new Error("<DataList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listData(value) {
    		throw new Error("<DataList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ListBreakdown.svelte generated by Svelte v3.17.1 */
    const file$3 = "src/ListBreakdown.svelte";

    // (34:2) {#if derivedData && yearData && listData}
    function create_if_block_1(ctx) {
    	let current;

    	const datalist = new DataList({
    			props: {
    				derivedData: /*derivedData*/ ctx[2],
    				yearData: /*yearData*/ ctx[1],
    				listData: /*listData*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(datalist.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(datalist, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const datalist_changes = {};
    			if (dirty & /*derivedData*/ 4) datalist_changes.derivedData = /*derivedData*/ ctx[2];
    			if (dirty & /*yearData*/ 2) datalist_changes.yearData = /*yearData*/ ctx[1];
    			if (dirty & /*listData*/ 1) datalist_changes.listData = /*listData*/ ctx[0];
    			datalist.$set(datalist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datalist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datalist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(datalist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(34:2) {#if derivedData && yearData && listData}",
    		ctx
    	});

    	return block;
    }

    // (44:4) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(44:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (42:4) {#if listData.length}
    function create_if_block(ctx) {
    	let current;

    	const list = new List({
    			props: {
    				listData: /*listData*/ ctx[0],
    				yearData: /*yearData*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(list.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(list, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const list_changes = {};
    			if (dirty & /*listData*/ 1) list_changes.listData = /*listData*/ ctx[0];
    			if (dirty & /*yearData*/ 2) list_changes.yearData = /*yearData*/ ctx[1];
    			list.$set(list_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(list, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(42:4) {#if listData.length}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let if_block0 = /*derivedData*/ ctx[2] && /*yearData*/ ctx[1] && /*listData*/ ctx[0] && create_if_block_1(ctx);
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*listData*/ ctx[0].length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			div0 = element("div");
    			if_block1.c();
    			attr_dev(div0, "class", "ListBreakdown__list");
    			add_location(div0, file$3, 40, 2, 1322);
    			attr_dev(div1, "class", "ListBreakdown");
    			add_location(div1, file$3, 32, 0, 1135);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*derivedData*/ ctx[2] && /*yearData*/ ctx[1] && /*listData*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div0, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { params = params } = $$props;
    	let listData = [];
    	let yearData;
    	let derivedData;

    	const loadFile = async () => {
    		const fileName = `/data/${params.year}-${params.format}.json`;

    		axios$1.get(fileName).then(({ data }) => {
    			$$invalidate(1, yearData = data);
    			$$invalidate(0, listData = processListsWithRankings(data.critics));
    			$$invalidate(2, derivedData = deriveAdditionalDataFromProcessedList(listData, data));
    		});
    	};

    	beforeUpdate(loadFile);
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ListBreakdown> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(3, params = $$props.params);
    	};

    	$$self.$capture_state = () => {
    		return { params, listData, yearData, derivedData };
    	};

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(3, params = $$props.params);
    		if ("listData" in $$props) $$invalidate(0, listData = $$props.listData);
    		if ("yearData" in $$props) $$invalidate(1, yearData = $$props.yearData);
    		if ("derivedData" in $$props) $$invalidate(2, derivedData = $$props.derivedData);
    	};

    	return [listData, yearData, derivedData, params];
    }

    class ListBreakdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, { params: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListBreakdown",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get params() {
    		throw new Error("<ListBreakdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<ListBreakdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.17.1 */

    const { Error: Error_1, Object: Object_1$1 } = globals;

    function create_fragment$5(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	const qsPosition = location.indexOf("?");
    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(getLocation(), function start(set) {
    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function instance$4($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	class RouteItem {
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		match(path) {
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	const routesIterable = routes instanceof Map ? routes : Object.entries(routes);
    	const routesList = [];

    	for (const [path, route] of routesIterable) {
    		routesList.push(new RouteItem(path, route));
    	}

    	let component = null;
    	let componentParams = {};
    	const dispatch = createEventDispatcher();

    	const dispatchNextTick = (name, detail) => {
    		setTimeout(
    			() => {
    				dispatch(name, detail);
    			},
    			0
    		);
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => {
    		return {
    			routes,
    			prefix,
    			component,
    			componentParams,
    			$loc
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("$loc" in $$props) loc.set($loc = $$props.$loc);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			 {
    				$$invalidate(0, component = null);
    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						if (!routesList[i].checkConditions(detail)) {
    							dispatchNextTick("conditionsFailed", detail);
    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);
    						$$invalidate(1, componentParams = match);
    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [component, componentParams, routes, prefix];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var critics = {
    	"Bill Goodykoontz": {
    		link: "http://www.azcentral.com/review/2010/ent/articles/2010/12/08/20101208-year-review-best-movies-social-network-inception-winters-bone.html",
    		publication: "The Arizona Republic",
    		list: {
    			"The Social Network": 1,
    			Inception: 2,
    			"Winter's Bone": 3,
    			"The King's Speech": 4,
    			"Toy Story 3": 5,
    			"Get Low": 6,
    			"127 Hours": 7,
    			"Animal Kingdom": 8,
    			"The Fighter": 9,
    			"Nowhere Boy": 10
    		}
    	},
    	"David Germain": {
    		link: "http://news.yahoo.com/s/ap/20101220/ap_en_mo/us_ye_top10_movies/",
    		publication: "Associated Press",
    		list: {
    			"Winter's Bone": 1,
    			"Four Lions": 2,
    			"Barney's Version": 3,
    			"The King's Speech": 4,
    			"Never Let Me Go": 5,
    			Inception: 6,
    			"Another Year": 7,
    			"True Grit": 8,
    			"127 Hours": 9,
    			"The Social Network": 10
    		}
    	},
    	"Christy Lemire": {
    		link: "http://news.yahoo.com/s/ap/20101220/ap_en_mo/us_ye_top10_movies/",
    		publication: "Associated Press",
    		list: {
    			"The Social Network": 1,
    			Inception: 2,
    			"Winter's Bone": 3,
    			"I Am Love": 4,
    			"Black Swan": 5,
    			"127 Hours": 6,
    			"Never Let Me Go": 7,
    			"Animal Kingdom": 8,
    			"The King's Speech": 9,
    			"Exit Through the Gift Shop": 10
    		}
    	},
    	"Marjorie Baumgarten": {
    		link: "http://www.austinchronicle.com/gyrobase/Issue/story?oid=oid%3A1132606",
    		publication: "Austin Chronicle",
    		list: {
    			"A Prophet": 1,
    			"The Fighter": 2,
    			"Black Swan": 3,
    			"Winter's Bone": 4,
    			"The Social Network": 5,
    			"Exit Through the Gift Shop": 6,
    			"Fish Tank": 7,
    			"The Kids Are All Right": 8,
    			"Inside Job": 9,
    			"Let Me In": 10
    		}
    	},
    	"Kimberley Jones": {
    		link: "http://www.austinchronicle.com/gyrobase/Issue/story?oid=oid%3A1132610",
    		publication: "Austin Chronicle",
    		list: {
    			"The Social Network": 1,
    			"Black Swan": 2,
    			"Everyone Else": 3,
    			"Red Riding Trilogy": 4,
    			Monsters: 5,
    			"Toy Story 3": 6,
    			"Winter's Bone": 7,
    			"It's Kind of a Funny Story": 8,
    			"The Exploding Girl": 9,
    			"Scott Pilgrim vs. The World": 10
    		}
    	},
    	"Marc Savlov": {
    		link: "http://www.austinchronicle.com/gyrobase/Issue/story?oid=oid%3A1132612",
    		publication: "Austin Chronicle",
    		list: {
    			"Black Swan": 1,
    			"The King's Speech": 2,
    			Monsters: 3,
    			Restrepo: 4,
    			"Exit Through the Gift Shop": 5,
    			"Winter's Bone": 6,
    			"The Fighter": 7,
    			"A Prophet": 8,
    			"Down Terrace": 9,
    			"Get Low": 10
    		}
    	},
    	"Michael Sragow": {
    		link: "http://www.baltimoresun.com/entertainment/movies/bal-best-10-movies-2010-pg,0,5040689.photogallery",
    		publication: "Baltimore Sun",
    		list: {
    			"The Social Network": 1,
    			Vincere: 2,
    			"The King's Speech": 3,
    			"The Kids Are All Right": 4,
    			"Toy Story 3": 5,
    			"Harry Potter and the Deathly Hallows: Part 1": 6,
    			"Winter's Bone": 7,
    			"True Grit": 8,
    			"The Tempest": 9,
    			"Inside Job": 10
    		}
    	},
    	"Ty Burr": {
    		link: "http://www.boston.com/ae/movies/articles/2010/12/26/ty_burrs_top_10_films_of_2010/",
    		publication: "Boston Globe",
    		list: {
    			"Exit Through the Gift Shop": 1,
    			"The Social Network": 2,
    			"The Kids Are All Right": 3,
    			"Toy Story 3": 4,
    			Marwencol: 5,
    			"Boxing Gym": 6,
    			"The Fighter": 7,
    			"A Film Unfinished": 8,
    			"Last Train Home": 9,
    			"True Grit": 10
    		}
    	},
    	"Wesley Morris": {
    		link: "http://www.boston.com/ae/movies/articles/2010/12/26/wesley_morriss_top_10_films_of_2010/",
    		publication: "Boston Globe",
    		list: {
    			"The Fighter": "_",
    			"Inside Job": "_",
    			"Jackass 3D": "_",
    			Machete: "_",
    			"Mother and Child": "_",
    			"Scott Pilgrim vs. The World": "_",
    			"The Social Network": "_",
    			Sweetgrass: "_",
    			"Toy Story 3": "_",
    			Vincere: "_"
    		}
    	},
    	"Pam Grady": {
    		link: "http://www.boxofficemagazine.com/articles/2010-12-boxoffice-picks-2010s-best-films",
    		publication: "Boxoffice Magazine",
    		list: {
    			"Animal Kingdom": 1,
    			Marwencol: 2,
    			"127 Hours": 3,
    			"The Trotsky": 4,
    			"Brighton Rock": 5,
    			"True Grit": 6,
    			Triage: 7,
    			"Soul Kitchen": 8,
    			Undertow: 9,
    			"Kick-Ass": 10
    		}
    	},
    	"Pete Hammond": {
    		link: "http://www.boxofficemagazine.com/articles/2010-12-boxoffice-picks-2010s-best-films",
    		publication: "Boxoffice Magazine",
    		list: {
    			"Another Year": "_",
    			Biutiful: "_",
    			"Black Swan": "_",
    			"The Ghost Writer": "_",
    			Inception: "_",
    			"The King's Speech": "_",
    			"Rabbit Hole": "_",
    			"Shutter Island": "_",
    			"The Social Network": "_",
    			"Toy Story 3": "_"
    		}
    	},
    	"Mark Keizer": {
    		link: "http://www.boxofficemagazine.com/articles/2010-12-boxoffice-picks-2010s-best-films",
    		publication: "Boxoffice Magazine",
    		list: {
    			"Another Year": 1,
    			"Black Swan": 2,
    			Carlos: 3,
    			Inception: 4,
    			"OSS 117: Lost in Rio": 5,
    			"The Juche Idea": 6,
    			"The King's Speech": 7,
    			"The Social Network": 8,
    			"The Tillman Story": 9,
    			"Winter's Bone": 10
    		}
    	},
    	"Wade Major": {
    		link: "http://www.boxofficemagazine.com/articles/2010-12-boxoffice-picks-2010s-best-films",
    		publication: "Boxoffice Magazine",
    		list: {
    			"The King's Speech": 1,
    			Ajami: 2,
    			"Rabbit Hole": 3,
    			"Mother and Child": 4,
    			"The Way Back": 5,
    			"Made in Dagenham": 6,
    			"Animal Kingdom": 7,
    			"Another Year": 8,
    			"It's Kind of a Funny Story": 9,
    			"Father of My Children": 10
    		}
    	},
    	"John P. McCarthy": {
    		link: "http://www.boxofficemagazine.com/articles/2010-12-boxoffice-picks-2010s-best-films",
    		publication: "Boxoffice Magazine",
    		list: {
    			"The Eclipse": 1,
    			Inception: 2,
    			"Another Year": 3,
    			"Winter's Bone": 4,
    			"Four Lions": 5,
    			Alamar: 6,
    			"Black Swan": 7,
    			Lebanon: 8,
    			"The Father of My Children": 9,
    			"The Social Network": 10
    		}
    	},
    	"Amy Nicholson": {
    		link: "http://www.boxofficemagazine.com/articles/2010-12-boxoffice-picks-2010s-best-films",
    		publication: "Boxoffice Magazine",
    		list: {
    			"Let Me In": 1,
    			"Life During Wartime": 2,
    			"The Illusionist": 3,
    			"Please Give": 4,
    			"The Square": 5,
    			"Scott Pilgrim vs. The World": 6,
    			"The King's Speech": 7,
    			Somewhere: 8,
    			Babies: 9,
    			"The Tempest": 10
    		}
    	},
    	"Steve Ramos": {
    		link: "http://www.boxofficemagazine.com/articles/2010-12-boxoffice-picks-2010s-best-films",
    		publication: "Boxoffice Magazine",
    		list: {
    			"Blue Valentine": 1,
    			"The Social Network": 2,
    			Carlos: 3,
    			Dogtooth: 4,
    			"Red Riding Trilogy": 5,
    			"Last Train Home": 6,
    			"A Prophet": 7,
    			"Scott Pilgrim vs. The World": 8,
    			"Daddy Longlegs": 9,
    			"Mesrine: Public Enemy No 1": 10
    		}
    	},
    	"Sara Maria Vizcarrondo": {
    		link: "http://www.boxofficemagazine.com/articles/2010-12-boxoffice-picks-2010s-best-films",
    		publication: "Boxoffice Magazine",
    		list: {
    			"Exit Through the Gift Shop": 1,
    			"I Love You Phillip Morris": 2,
    			"Red, White and Blue": 3,
    			"Biker Fox": 4,
    			"Audrey the Trainwreck": 5,
    			"Lover of Hate": 6,
    			"Jackass 3D": 7,
    			"Four Lions": 8,
    			"Flooding with Love for the Kid": 9,
    			"The Last Exorcism": 10
    		}
    	},
    	"Andrea Grunvall": {
    		publication: "Chicago Reader",
    		list: {
    			"The Social Network": 1,
    			"I Am Love": 2,
    			"A Prophet": 3,
    			Restrepo: 4,
    			"The Kids Are All Right": 5,
    			"Inside Job": 6,
    			"The Ghost Writer": 7,
    			"Winter's Bone": 8,
    			"Red Riding Trilogy": 9,
    			"True Grit": 10
    		}
    	},
    	"J.R. Jones": {
    		link: "http://www.chicagoreader.com/chicago/best-movies-2010-winters-bone-social-network-please-give/Content?oid=2889843",
    		publication: "Chicago Reader",
    		list: {
    			Carlos: "_",
    			Dogtooth: "_",
    			"Enter the Void": "_",
    			"Henri-Georges Clouzot's Inferno": "_",
    			"The Kids Are All Right": "_",
    			"Please Give": "_",
    			Restrepo: "_",
    			"The Social Network": "_",
    			"The Square": "_",
    			"Winter's Bone": "_"
    		}
    	},
    	"Roger Ebert": {
    		link: "http://blogs.suntimes.com/ebert/2010/12/the_best_feature_films_of_2010.html",
    		publication: "Chicago Sun Times",
    		list: {
    			"The Social Network": 1,
    			"The King's Speech": 2,
    			"Black Swan": 3,
    			"I Am Love": 4,
    			"Winter's Bone": 5,
    			Inception: 6,
    			"The Secret in Their Eyes": 7,
    			"The American": 8,
    			"The Kids Are All Right": 9,
    			"The Ghost Writer": 10
    		}
    	},
    	"Peter Rainer": {
    		link: "http://www.csmonitor.com/The-Culture/Movies/2010/1215/Ten-best-movies-of-2010/Winter-s-Bone",
    		publication: "Christian Science Monitor",
    		list: {
    			"Another Year": 1,
    			"I Am Love": 2,
    			"Inside Job": 3,
    			"Last Train Home": 4,
    			"The Ghost Writer": 5,
    			"The Illusionist": 6,
    			"The King's Speech": 7,
    			"Toy Story 3": 8,
    			Vincere: 9,
    			"Winter's Bone": 10
    		}
    	},
    	"Clint O'Connor": {
    		link: "http://www.cleveland.com/moviebuff/index.ssf/2010/12/the_plain_dealers_top_10_movie.html",
    		publication: "Cleveland Plain Dealer",
    		list: {
    			"Winter's Bone": 1,
    			"The King's Speech": 2,
    			"The Social Network": 3,
    			"Nowhere Boy": 4,
    			Inception: 5,
    			"Toy Story 3": 6,
    			"Blue Valentine": 7,
    			Marwencol: 8,
    			"Let Me In": 9,
    			"Robin Hood": 10
    		}
    	},
    	"Chris Vognar": {
    		link: "http://www.dallasnews.com/sharedcontent/dws/ent/stories/0103glmonlede.2fa10a8.html",
    		publication: "Dallas Morning News",
    		list: {
    			"127 Hours": 1,
    			"A Prophet": 2,
    			"Winter's Bone": 3,
    			"The Social Network": 4,
    			"Exit Through the Gift Shop": 5,
    			"Toy Story 3": 6,
    			"Red Riding Trilogy": 7,
    			Inception: 8,
    			"True Grit": 9,
    			"The Fighter": 10
    		}
    	},
    	"Luke Y. Thompson": {
    		link: "http://www.eonline.com/uberblog/movies/b216800_The_10_Best_Movies_of_2010An_E_Online_Critics_List.html",
    		publication: "E! Online",
    		list: {
    			"Four Lions": 1,
    			"Enter the Void": 2,
    			"The Ghost Writer": 3,
    			"Harry Potter and the Deathly Hallows: Part 1": 4,
    			"I'm Still Here": 5,
    			"Idiots and Angels": 6,
    			"Legend of the Guardians: the Owls of Ga'Hoole": 7,
    			Inception: 8,
    			"The Illusionist": 9,
    			"Piranha 3D": 10
    		}
    	},
    	"": {
    		link: "http://www.empireonline.com/features/films-of-the-year-2010/",
    		publication: "Empire",
    		list: {
    			Inception: 1,
    			"The Social Network": 2,
    			"Toy Story 3": 3,
    			"Up in the Air": 4,
    			"A Prophet": 5,
    			"Scott Pilgrim vs. The World": 6,
    			"Bad Lieutenant: Port of Call New Orleans": 7,
    			"Shutter Island": 8,
    			"Winter's Bone": 9,
    			"Kick-Ass": 10
    		}
    	},
    	"Owen Gleiberman": {
    		link: "http://www.ew.com/ew/gallery/0,,20326356_20451387,00.html",
    		publication: "Entertainment Weekly",
    		list: {
    			"The Social Network": 1,
    			"The Kids Are All Right": 2,
    			"Toy Story 3": 3,
    			"Exit Through the Gift Shop": 4,
    			"The Ghost Writer": 5,
    			"Another Year": 6,
    			"Blue Valentine": 7,
    			"The Town": 8,
    			Ajami: 9,
    			"127 Hours": 10
    		}
    	},
    	"Lisa Schwarzbaum": {
    		link: "http://www.ew.com/ew/gallery/0,,20326356_20451419,00.html",
    		publication: "Entertainment Weekly",
    		list: {
    			"The Social Network": 1,
    			"The Kids Are All Right": 2,
    			"Winter's Bone": 3,
    			"Toy Story 3": 4,
    			"Last Train Home": 5,
    			"Animal Kingdom": 6,
    			"The Ghost Writer": 7,
    			"A Prophet": 8,
    			"Another Year": 9,
    			"127 Hours": 10
    		}
    	},
    	"Neil Miller": {
    		link: "http://www.filmschoolrejects.com/features/ten-best-films-of-2010.php/all/1",
    		publication: "Film School Rejects",
    		list: {
    			"Black Swan": 1,
    			"A Prophet": 2,
    			"Four Lions": 3,
    			"The King's Speech": 4,
    			"The Good, The Bad, The Weird": 5,
    			"Scott Pilgrim vs. The World": 6,
    			Inception: 7,
    			Micmacs: 8,
    			Merantau: 9,
    			"Thunder Soul": 10
    		}
    	},
    	"Rick Groen and Liam Lacey": {
    		link: "http://www.theglobeandmail.com/news/arts/movies/rick-groen-and-liam-laceys-best-films-of-2010/article1853765/",
    		publication: "The Globe and Mail",
    		list: {
    			"Another Year": "_",
    			Carlos: "_",
    			"Despicable Me": "_",
    			"Inside Job": "_",
    			"The King's Speech": "_",
    			Marwencol: "_",
    			"Rabbit Hole": "_",
    			"The Social Network": "_",
    			"Uncle Boonmee Who Can Recall His Past Lives": "_",
    			"Winter's Bone": "_"
    		}
    	},
    	"Gregory Ellwood": {
    		link: "http://www.hitfix.com/blogs/awards-campaign-2009/posts/an-awards-worthy-view-of-the-top-10-movies-of-2010",
    		publication: "HitFix",
    		list: {
    			"I Am Love": 1,
    			Inception: 2,
    			"127 Hours": 3,
    			"Black Swan": 4,
    			"Rabbit Hole": 5,
    			"The Kids Are All Right": 6,
    			"The Ghost Writer": 7,
    			"Another Year": 8,
    			"True Grit": 9,
    			"How to Train Your Dragon": 10
    		}
    	},
    	"Drew McWeeny": {
    		link: "http://www.hitfix.com/blogs/motion-captured/posts/movies-top-10-of-2010-drews-ten-favorite-films-of-the-year",
    		publication: "HitFix",
    		list: {
    			"Black Swan": 1,
    			"Blue Valentine": 2,
    			"Scott Pilgrim vs. The World": 3,
    			"Rabbit Hole": 4,
    			"I Saw the Devil": 5,
    			"Toy Story 3": 6,
    			"Four Lions": 7,
    			"True Grit": 8,
    			Inception: 9,
    			"A Serbian Film": 10
    		}
    	},
    	"Kirk Honeycutt": {
    		link: "http://www.hollywoodreporter.com/news/thr-critics-inception-carlos-films-61344",
    		publication: "The Hollywood Reporter",
    		list: {
    			Inception: 1,
    			"The Social Network": 2,
    			"The King's Speech": 3,
    			"127 Hours": 4,
    			"True Grit": 5,
    			Carlos: 6,
    			"A Prophet": 7,
    			"The Kids Are All Right": 8,
    			"Winter's Bone": 9,
    			"The Way Back": 10
    		}
    	},
    	"Todd McCarthy": {
    		link: "http://www.hollywoodreporter.com/news/thr-critics-inception-carlos-films-61344",
    		publication: "The Hollywood Reporter",
    		list: {
    			Carlos: 1,
    			"The Social Network": 2,
    			"Wild Grass": 3,
    			"A Prophet": 4,
    			Sweetgrass: 5,
    			"Inside Job": 6,
    			"Toy Story 3": 7,
    			"Animal Kingdom": 8,
    			"The Kids Are All Right": 9,
    			Unstoppable: 10
    		}
    	},
    	"Anthony Quinn": {
    		link: "http://www.independent.co.uk/arts-entertainment/films/features/the-year-in-review-best-film-of-2010-2168018.html",
    		publication: "The Independent [UK]",
    		list: {
    			"The Kids Are All Right": 1,
    			"A Prophet": 2,
    			"The Secret in Their Eyes": 3,
    			"I Am Love": 4,
    			"Down Terrace": 5
    		}
    	},
    	"Peter Knegt": {
    		link: "http://www.indiewire.com/critic/peter_knegt",
    		publication: "IndieWire",
    		list: {
    			"Another Year": 1,
    			"Everyone Else": 2,
    			"I Am Love": 3,
    			Dogtooth: 4,
    			Carlos: 5,
    			"The Ghost Writer": 6,
    			"True Grit": 7,
    			"Black Swan": 8,
    			"Last Train Home": 9,
    			"The Kids Are All Right": 10
    		}
    	},
    	"Eric Kohn": {
    		link: "http://www.indiewire.com/critic/eric_kohn/",
    		publication: "IndieWire",
    		list: {
    			Dogtooth: 1,
    			"Exit Through the Gift Shop": 2,
    			"Winter's Bone": 3,
    			"Daddy Longlegs": 4,
    			"Another Year": 5,
    			"Animal Kingdom": 6,
    			Catfish: 7,
    			Alamar: 8,
    			"Prince of Broadway": 9,
    			"Enter the Void": 10
    		}
    	},
    	"Anne Thompson": {
    		link: "http://blogs.indiewire.com/thompsononhollywood/2010/12/13/ten_best_list/",
    		publication: "IndieWire/Thompson on Hollywood",
    		list: {
    			"Winter's Bone": 1,
    			"The Kids Are All Right": 2,
    			"The Social Network": 3,
    			"Toy Story 3": 4,
    			"Inside Job": 5,
    			Carlos: 6,
    			"Let Me In": 7,
    			"The King's Speech": 8,
    			"True Grit": 9,
    			"The Ghost Writer": 10
    		}
    	},
    	"David Ehrenstein": {
    		link: "http://www.villagevoice.com/filmpoll/view/critics/David+Ehrenstein/2010/",
    		publication: "LA Weekly",
    		list: {
    			"The Ghost Writer": 1,
    			Howl: 2,
    			"I Am Love": 3,
    			"Henri-Georges Clouzot's Inferno": 4,
    			"Guy and Madeline on a Park Bench": 5,
    			"The Social Network": 6,
    			"The City of Your Final Destination": 7,
    			"The Kids Are All Right": 8
    		}
    	},
    	"Karina Longworth": {
    		link: "http://www.laweekly.com/2010-12-23/film-tv/the-top-10-films-of-2010/",
    		publication: "LA Weekly",
    		list: {
    			"Trash Humpers": 1,
    			Greenberg: 2,
    			"Daddy Longlegs": 3,
    			Dogtooth: 4,
    			Somewhere: 5,
    			"The Red Chapel": 6,
    			"Everyone Else": 7,
    			"Shutter Island": 8,
    			"The Ghost Writer": 9,
    			"Enter the Void": 10
    		}
    	},
    	"Chuck Wilson": {
    		link: "http://www.villagevoice.com/filmpoll/view/critics/Chuck+Wilson/2010/",
    		publication: "LA Weekly",
    		list: {
    			"The Ghost Writer": 1,
    			"Please Give": 2,
    			"Toy Story 3": 3,
    			"I Am Love": 4,
    			Vincere: 5,
    			"Blue Valentine": 6,
    			"Daddy Longlegs": 7,
    			Greenberg: 8,
    			"Easier with Practice": 9,
    			"Breaking Upwards": 10
    		}
    	},
    	"Betsy Sharkey": {
    		link: "http://www.latimes.com/entertainment/news/la-et-betsy-sharkey-2010-tops-pictures,0,666022.photogallery",
    		publication: "Los Angeles Times",
    		list: {
    			"The Social Network": 1,
    			"Winter's Bone": 2,
    			Carlos: 3,
    			"The Kids Are All Right": 4,
    			"127 Hours": 5,
    			"Toy Story 3": 6,
    			"True Grit": 7,
    			"Black Swan": 8,
    			Restrepo: 9,
    			"The King's Speech": 10
    		}
    	},
    	"Kenneth Turan": {
    		link: "http://www.latimes.com/entertainment/news/la-et-kenneth-turan-2010-tops-pictures,0,4340632.photogallery",
    		publication: "Los Angeles Times",
    		list: {
    			Inception: 1,
    			"The Social Network": 1,
    			"Toy Story 3": 1,
    			"Animal Kingdom": 2,
    			"Inside Job": 3,
    			"The Tillman Story": 3,
    			Ajami: 4,
    			"Eyes Wide Open": 4,
    			Lebanon: 4,
    			"The King's Speech": 5,
    			"Night Catches Us": 6,
    			"Nora's Will": 6,
    			"A Prophet": 7,
    			"Mademoiselle Chambon": 7,
    			"White Material": 7,
    			Kisses: 8,
    			"Prince of Broadway": 8,
    			"A Town Called Panic": 8,
    			"The Secret of Kells": 8,
    			Unstoppable: 8,
    			"The Town": 8,
    			"True Grit": 9,
    			"Winter's Bone": 23
    		}
    	},
    	"Marc Doyle": {
    		publication: "Metacritic.com",
    		list: {
    			"Animal Kingdom": 1,
    			Carlos: 2,
    			"Blue Valentine": 3,
    			"The Girl with the Dragon Tattoo": 4,
    			"Exit Through the Gift Shop": 5,
    			"I Am Love": 6,
    			"Fish Tank": 7,
    			"The Town": 8,
    			"The King's Speech": 9,
    			"The Art of the Steal": 10
    		}
    	},
    	"Rene Rodriguez": {
    		link: "http://www.miami.com/the-ten-best-movies-2010-article",
    		publication: "Miami Herald",
    		list: {
    			"The Social Network": 1,
    			"The Fighter": 2,
    			"Black Swan": 3,
    			Carlos: 4,
    			"I Am Love": 5,
    			Inception: 6,
    			"Animal Kingdom": 7,
    			"Exit Through the Gift Shop": 8,
    			"Blue Valentine": 9,
    			Somewhere: 10
    		}
    	},
    	"Michelle Orange": {
    		link: "http://www.movieline.com/2010/12/michelle-oranges-top-10-films-of-2010.php",
    		publication: "Movieline",
    		list: {
    			"127 Hours": "_",
    			"Black Swan": "_",
    			"Exit Through the Gift Shop": "_",
    			"The Ghost Writer": "_",
    			Greenberg: "_",
    			"I Am Love": "_",
    			"Inside Job": "_",
    			"The Social Network": "_",
    			Sweetgrass: "_",
    			"Tiny Furniture": "_"
    		}
    	},
    	"Stephanie Zacharek": {
    		link: "http://www.movieline.com/2010/12/stephanie-zachareks-10-best-movies-of-2010.php?page=all",
    		publication: "Movieline",
    		list: {
    			Somewhere: 1,
    			"The Ghost Writer": 2,
    			"The Social Network": 3,
    			"The King's Speech": 4,
    			"I Am Love": 5,
    			"Despicable Me": 6,
    			"My Dog Tulip": 6,
    			Vincere: 7,
    			Carlos: 9,
    			Vengeance: 10,
    			"The American": 11,
    			"The Tourist": 10
    		}
    	},
    	"Sean Axmaker": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			Carlos: 1,
    			"The Social Network": 2,
    			"Let Me In": 3,
    			"White Material": 4,
    			"Red Riding Trilogy": 5,
    			"Winter's Bone": 6,
    			"Black Swan": 7,
    			"Wild Grass": 8,
    			"Eccentricities of a Blonde-Haired Girl": 9,
    			Sweetgrass: 10
    		}
    	},
    	"Jim Emerson": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			"The Social Network": 1,
    			Carlos: 2,
    			Sweetgrass: 3,
    			Mother: 4,
    			"Let Me In": 5,
    			"The Killer Inside Me": 6,
    			"Winter's Bone": 7,
    			Dogtooth: 8,
    			"The Kids Are All Right": 9,
    			"The American": 10
    		}
    	},
    	"Richard T. Jameson": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			"The Ghost Writer": 1,
    			"Let Me In": 2,
    			"Winter's Bone": 3,
    			"The Social Network": 4,
    			Sweetgrass: 5,
    			"The Kids Are All Right": 6,
    			Hereafter: 7,
    			"A Prophet": 8,
    			"Please Give": 9,
    			"The American": 10,
    			"White Material": 10
    		}
    	},
    	"Don Kaye": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			"Black Swan": 1,
    			Inception: 2,
    			"The Social Network": 3,
    			"A Prophet": 4,
    			Monsters: 5,
    			"Another Year": 6,
    			"Exit Through the Gift Shop": 7,
    			"Winter's Bone": 8,
    			"Animal Kingdom": 9,
    			"Rabbit Hole": 10
    		}
    	},
    	"Glenn Kenny": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			Carlos: 1,
    			"The Social Network": 2,
    			"Everyone Else": 3,
    			Bluebeard: 4,
    			"Toy Story 3": 5,
    			"Black Swan": 6,
    			"Wild Grass": 7,
    			"Fish Tank": 8,
    			"Shutter Island": 9,
    			"Scott Pilgrim vs. The World The Social Network": 10
    		}
    	},
    	"Dave McCoy": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			"The Social Network": 1,
    			"Black Swan": 2,
    			"Winter's Bone": 3,
    			"Red Riding Trilogy": 4,
    			Dogtooth: 5,
    			"Another Year": 6,
    			Splice: 7,
    			"The Ghost Writer": 8,
    			"Down Terrace": 9,
    			Carlos: 10
    		}
    	},
    	"Kim Morgan": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			"Black Swan": 1,
    			"The Social Network": 2,
    			Somewhere: 3,
    			"The Ghost Writer": 4,
    			"Enter the Void": 5,
    			Carlos: 6,
    			Mother: 7,
    			"Life During Wartime": 8,
    			Unstoppable: 9,
    			"Jackass 3D": 10
    		}
    	},
    	"Kat Murphy": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			"The Ghost Writer": 1,
    			"Winter's Bone": 2,
    			"Let Me In": 3,
    			Sweetgrass: 4,
    			"A Prophet": 5,
    			"The Social Network": 6,
    			"Please Give": 7,
    			"The Kids Are All Right": 8,
    			"White Material": 9,
    			"Black Swan": 10
    		}
    	},
    	"Frank Paiva": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			"Exit Through the Gift Shop": 1,
    			Mother: 2,
    			Dogtooth: 3,
    			"Black Swan": 4,
    			"Winnebago Man": 5,
    			"Last Train Home": 6,
    			"Endhiran (Robot)": 7,
    			"Toy Story 3": 8,
    			"The Social Network": 9,
    			"Joan Rivers: A Piece of Work": 10
    		}
    	},
    	"Mary Pols": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			"The Social Network": 1,
    			"Toy Story 3": 2,
    			"The Kids Are All Right": 3,
    			"Fish Tank": 4,
    			"I Am Love": 5,
    			"Black Swan": 6,
    			"Please Give": 7,
    			"Another Year": 8,
    			"True Grit": 9,
    			"Rabbit Hole": 10
    		}
    	},
    	"Bryan Reesman": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			Inception: 1,
    			"Remember Me": 2,
    			Predators: 3,
    			Micmacs: 4,
    			"The Ghost Writer": 5,
    			Daybreakers: 6,
    			"Iron Man 2": 7,
    			"Green Zone": 8,
    			"How Do You Know": 9,
    			"Toy Story 3": 10
    		}
    	},
    	"James Rocchi": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			"Black Swan": 1,
    			Dogtooth: 2,
    			"The Social Network": 3,
    			"Winter's Bone": 4,
    			"Exit Through the Gift Shop": 5,
    			"And Everything Is Going Fine": 6,
    			"True Grit": 7,
    			"How to Train Your Dragon": 8,
    			"Rabbit Hole": 9,
    			"White Material": 10
    		}
    	},
    	"Glenn Whipp": {
    		link: "http://movies.msn.com/movies/year-in-review/top-10-movies/?photoidx=12",
    		publication: "MSN Movies",
    		list: {
    			"True Grit": 1,
    			"Black Swan": 2,
    			"Another Year": 3,
    			"Winter's Bone": 4,
    			"Toy Story 3": 5,
    			"Last Train Home": 6,
    			"127 Hours": 7,
    			Cyrus: 8,
    			"The Ghost Writer": 9,
    			"Exit Through the Gift Shop": 10
    		}
    	},
    	"Mike Scott": {
    		link: "http://www.nola.com/movies/index.ssf/2010/12/2010_top_ten.html",
    		publication: "New Orleans Times-Picayune",
    		list: {
    			"127 Hours": 1,
    			Restrepo: 2,
    			"Winter's Bone": 3,
    			"The Social Network": 4,
    			"Toy Story 3": 5,
    			"Blue Valentine": 6,
    			"The King's Speech": 7,
    			Inception: 8,
    			"Get Low": 9,
    			"Easy A": 10
    		}
    	},
    	"David Edelstein": {
    		link: "http://nymag.com/arts/cultureawards/2010/69911/",
    		publication: "New York",
    		list: {
    			"Winter's Bone": 1,
    			"Client 9: The Rise and Fall of Eliot Spitzer": 2,
    			"Inside Job": 2,
    			"Please Give": 3,
    			"Toy Story 3": 5,
    			"Another Year": 6,
    			"Mother and Child": 7,
    			Vincere: 8,
    			"Exit Through the Gift Shop": 9,
    			Marwencol: 10,
    			"Despicable Me": 11
    		}
    	},
    	"Joe Neumaier": {
    		link: "http://www.nydailynews.com/entertainment/movies/2010/12/27/2010-12-27_blue_valentine_is_best_movie_of_2010_how_do_you_know_is_worst_neumaier.html",
    		publication: "New York Daily News",
    		list: {
    			"Blue Valentine": 1,
    			"The Kids Are All Right": 2,
    			"Toy Story 3": 3,
    			"The Social Network": 4,
    			"The King's Speech": 5,
    			"The Tillman Story": 6,
    			"The Fighter": 7,
    			"Let Me In": 8,
    			"Get Low": 9,
    			"Never Let Me Go": 10
    		}
    	},
    	"Elizabeth Weitzman": {
    		link: "http://www.nydailynews.com/entertainment/movies/2010/12/27/2010-12-27_kids_are_all_right_is_best_movie_of_2010_how_do_you_know_is_worst_elizabeth_weit.html",
    		publication: "New York Daily News",
    		list: {
    			"The Kids Are All Right": 1,
    			"Please Give": 2,
    			"Let Me In": 3,
    			"The Social Network": 4,
    			"Black Swan": 5,
    			Inception: 6,
    			"Animal Kingdom": 7,
    			"The Fighter": 8,
    			"True Grit": 9,
    			"Easy A": 10
    		}
    	},
    	"A.O. Scott": {
    		link: "http://www.nytimes.com/2010/12/19/movies/19scott.html?_r=1&ref=movies",
    		publication: "The New York Times",
    		list: {
    			"Inside Job": 1,
    			"Toy Story 3": 2,
    			Carlos: 3,
    			Somewhere: 4,
    			"The Kids Are All Right": 5,
    			Greenberg: 6,
    			"127 Hours": 7,
    			"Last Train Home": 8,
    			"Secret Sunshine": 9,
    			"Exit Through the Gift Shop": 10
    		}
    	},
    	"Stephen Holden": {
    		link: "http://www.nytimes.com/2010/12/19/movies/19holden.html?_r=1&ref=movies",
    		publication: "The New York Times",
    		list: {
    			"The Social Network": 1,
    			"Inside Job": 2,
    			Inception: 3,
    			Carlos: 4,
    			"Another Year": 5,
    			Vincere: 6,
    			"White Material": 7,
    			"The Kids Are All Right": 8,
    			"True Grit": 9,
    			"My Dog Tulip": 10
    		}
    	},
    	"Richard Brody": {
    		link: "http://www.newyorker.com/online/blogs/newsdesk/2010/12/richard-brody-films.html",
    		publication: "The New Yorker",
    		list: {
    			"Shutter Island": 1,
    			"The Social Network": 2,
    			Somewhere: 3,
    			Greenberg: 4,
    			"Black Swan": 5,
    			"Around a Small Mountain": 6,
    			"Daddy Longlegs": 7,
    			"The Strange Case of Angelica": 8,
    			"Tiny Furniture": 9,
    			"Our Beloved Month of August": 10
    		}
    	},
    	"David Denby": {
    		link: "http://www.newyorker.com/online/blogs/newsdesk/2010/12/david-denby-films.html",
    		publication: "The New Yorker",
    		note: "Denby did not rank films after his 1st choice (The Social Network), so the remaining titles are alphabetized",
    		list: {
    			"1. The Social Network": "_",
    			"Company Men": "_",
    			"Exit Through the Gift Shop": "_",
    			"The Fighter": "_",
    			"The Ghost Writer": "_",
    			"Inside Job": "_",
    			"Please Give": "_",
    			Restrepo: "_",
    			"Toy Story 3": "_",
    			"Winter's Bone": "_"
    		}
    	},
    	"Anthony Lane": {
    		link: "http://www.newyorker.com/online/blogs/newsdesk/2010/12/anthony-lane-film.html",
    		publication: "The New Yorker",
    		list: {
    			Dogtooth: "_",
    			"The Father of My Children": "_",
    			"I Am Love": "_",
    			"Life During Wartime": "_",
    			Mother: "_",
    			"A Prophet": "_",
    			"The Social Network": "_",
    			Sweetgrass: "_",
    			"Toy Story 3": "_",
    			"Winter's Bone": "_"
    		}
    	},
    	"David Ansen": {
    		link: "http://www.newsweek.com/2010/12/21/the-best-movies-of-2010.html",
    		publication: "Newsweek",
    		list: {
    			"A Prophet": 1,
    			"Winter's Bone": 2,
    			"Fish Tank": 3,
    			"The Kids Are All Right": 4,
    			"The King's Speech": 5,
    			"Toy Story 3": 6,
    			Carlos: 7,
    			"The Social Network": 8,
    			"Kawasaki's Rose": 9,
    			"The Fighter": 10
    		}
    	},
    	"-NOW Magazine (Toronto)": {
    		link: "http://www.nowtoronto.com/movies/story.cfm?content=178418",
    		publication: "NOW Magazine (Toronto)",
    		list: {
    			"The Social Network": 1,
    			"A Prophet": 2,
    			"Exit Through the Gift Shop": 3,
    			"True Grit": 4,
    			"Police, Adjective": 5,
    			Inception: 6,
    			"127 Hours": 7,
    			"Uncle Boonmee Who Can Recall His Past Lives": 8,
    			Marwencol: 9,
    			"Scott Pilgrim vs. The World": 10
    		}
    	},
    	"Philip French": {
    		link: "http://www.guardian.co.uk/world/2010/dec/12/philip-french-2010-best-films",
    		publication: "The Observer",
    		list: {
    			"Of Gods and Men": 1,
    			"The Social Network": 2,
    			Inception: 3,
    			"A Prophet": 4,
    			"Another Year": 5,
    			"Toy Story 3": 6,
    			"The Kids Are All Right": 7,
    			"Up in the Air": 8,
    			"Winter's Bone": 9,
    			"The Ghost Writer": 10
    		}
    	},
    	"Noel Murray": {
    		link: "http://www.avclub.com/articles/the-best-films-of-2010,49101",
    		publication: "The Onion A.V. Club",
    		list: {
    			"Black Swan": 1,
    			"Winter's Bone": 2,
    			"The Social Network": 3,
    			Mother: 4,
    			"The Illusionist": 5,
    			Greenberg: 6,
    			Inception: 7,
    			Carlos: 8,
    			Dogtooth: 9,
    			"True Grit": 10
    		}
    	},
    	"Keith Phipps": {
    		link: "http://www.avclub.com/articles/the-best-films-of-2010,49101",
    		publication: "The Onion A.V. Club",
    		list: {
    			"Winter's Bone": 1,
    			"Black Swan": 2,
    			"The Social Network": 3,
    			Inception: 4,
    			"Toy Story 3": 5,
    			"True Grit": 6,
    			"Exit Through the Gift Shop": 7,
    			Mother: 8,
    			"Rabbit Hole": 9,
    			Carlos: 10
    		}
    	},
    	"Nathan Rabin": {
    		link: "http://www.avclub.com/articles/the-best-films-of-2010,49101",
    		publication: "The Onion A.V. Club",
    		list: {
    			"Blue Valentine": 1,
    			"Black Swan": 2,
    			Greenberg: 3,
    			"Best Worst Movie": 4,
    			Inception: 5,
    			"Exit Through the Gift Shop": 6,
    			"The Social Network": 7,
    			"The King's Speech": 8,
    			"True Grit": 9,
    			"Scott Pilgrim vs. The World": 10
    		}
    	},
    	"Tasha Robinson": {
    		link: "http://www.avclub.com/articles/the-best-films-of-2010,49101",
    		publication: "The Onion A.V. Club",
    		list: {
    			Inception: 1,
    			"The Social Network": 2,
    			"Scott Pilgrim vs. The World": 3,
    			"Black Swan": 4,
    			"Toy Story 3": 5,
    			"Winter's Bone": 6,
    			"A Prophet": 7,
    			"Another Year": 8,
    			"Red Riding Trilogy": 9,
    			Mother: 10
    		}
    	},
    	"Scott Tobias": {
    		link: "http://www.avclub.com/articles/the-best-films-of-2010,49101",
    		publication: "The Onion A.V. Club",
    		list: {
    			Dogtooth: 1,
    			"Winter's Bone": 2,
    			Carlos: 3,
    			"The Social Network": 4,
    			"Exit Through the Gift Shop": 5,
    			"Everyone Else": 6,
    			"Shutter Island": 7,
    			Mother: 8,
    			"Toy Story 3": 9,
    			Restrepo: 10
    		}
    	},
    	"Stan Hall": {
    		link: "http://blog.oregonlive.com/madaboutmovies/2010/12/stan_halls_best_films_of_2010.html",
    		publication: "The Oregonian",
    		list: {
    			"About Elly": "_",
    			"The Agony and Ecstasy of Phil Spector": "_",
    			"Down Terrace": "_",
    			"Fish Tank": "_",
    			Marwencol: "_",
    			"Prodigal Sons": "_",
    			"A Prophet": "_",
    			"White Material": "_",
    			"The White Ribbon": "_",
    			"Winter's Bone": "_"
    		}
    	},
    	"Shawn Levy": {
    		link: "http://blog.oregonlive.com/madaboutmovies/2010/12/shawn_levys_top_ten_films_of_2.html",
    		publication: "The Oregonian",
    		list: {
    			Babies: "_",
    			"Black Swan": "_",
    			"The Fighter": "_",
    			"The Ghost Writer": "_",
    			Inception: "_",
    			"The Illusionist": "_",
    			"The King's Speech": "_",
    			"The Social Network": "_",
    			"A Town Called Panic": "_",
    			"Winter's Bone": "_"
    		}
    	},
    	"Marc Mohan": {
    		link: "http://blog.oregonlive.com/madaboutmovies/2010/12/marc_mohans_ten_best_films_of.html",
    		publication: "The Oregonian",
    		list: {
    			"127 Hours": "_",
    			"The Ghost Writer": "_",
    			"I'm Still Here": "_",
    			"The Kids Are All Right": "_",
    			"Mid-August Lunch": "_",
    			"A Prophet": "_",
    			"The Social Network": "_",
    			"A Town Called Panic": "_",
    			"Toy Story 3": "_",
    			"Winter's Bone": "_"
    		}
    	},
    	"Mike Russell": {
    		link: "http://blog.oregonlive.com/madaboutmovies/2010/12/post_7.html",
    		publication: "The Oregonian",
    		list: {
    			"127 Hours": 1,
    			"Black Swan": 2,
    			"The Fighter": 3,
    			Inception: 4,
    			"Let Me In": 5,
    			"Scott Pilgrim vs. The World": 6,
    			"The Secret in Their Eyes": 7,
    			"The Social Network": 8,
    			"Toy Story 3": 9,
    			"True Grit": 10
    		}
    	},
    	"Roger Moore": {
    		link: "http://www.orlandosentinel.com/entertainment/movies/os-movie-story-ten-best-2010-20101229,0,6157921.story",
    		publication: "Orlando Sentinel",
    		list: {
    			"127 Hours": 1,
    			"The Fighter": 2,
    			"The King's Speech": 3,
    			"The Social Network": 4,
    			"Black Swan": 5,
    			"Winter's Bone": 6,
    			"The Kids Are All Right": 7,
    			"Rabbit Hole": 8,
    			"I Love You Phillip Morris": 9,
    			Buried: 10
    		}
    	},
    	"Steven Rea": {
    		link: "http://www.philly.com/inquirer/columnists/steven_rea/20101226_Steven_Rea__The_best_films_of_2010.html",
    		publication: "Philadelphia Inquirer",
    		list: {
    			"127 Hours": "_",
    			"Black Swan": "_",
    			"Fish Tank": "_",
    			"I Am Love": "_",
    			"The Kids Are All Right": "_",
    			"The King's Speech": "_",
    			"Never Let Me Go": "_",
    			"A Prophet": "_",
    			"The Social Network": "_",
    			"Winter's Bone": "_"
    		}
    	},
    	"Carrie Rickey": {
    		link: "http://www.philly.com/inquirer/entertainment/20101226_Carrie_Rickey__The_best_films_of_2010.html?viewAll=y",
    		publication: "Philadelphia Inquirer",
    		list: {
    			"Inside Job": "_",
    			"The Kids Are All Right": "_",
    			"The King's Speech": "_",
    			"My Dog Tulip": "_",
    			"Night Catches Us": "_",
    			"Nowhere Boy": "_",
    			"Scott Pilgrim vs. The World": "_",
    			"Toy Story 3": "_",
    			"Waiting for 'Superman'": "_",
    			"Winter's Bone": "_"
    		}
    	},
    	"James Berardinelli": {
    		link: "http://www.reelviews.net/reelthoughts.php?identifier=657",
    		publication: "Reelviews",
    		list: {
    			"The King's Speech": 1,
    			Inception: 2,
    			"True Grit": 3,
    			"Toy Story 3": 4,
    			"Black Swan": 5,
    			"Rabbit Hole": 6,
    			Flipped: 7,
    			"The Millennium Trilogy": 8,
    			"The Social Network": 9,
    			"Love and Other Drugs": 10
    		}
    	},
    	"-Reverse Shot": {
    		link: "http://www.reverseshot.com/article/reverse_shots_best_2010",
    		publication: "Reverse Shot",
    		list: {
    			Alamar: 1,
    			Mother: 2,
    			"White Material": 3,
    			"Everyone Else": 4,
    			"Another Year": 5,
    			"Secret Sunshine": 6,
    			"Our Beloved Month of August": 7,
    			"The Social Network": 8,
    			Bluebeard: 9,
    			Sweetgrass: 10
    		}
    	},
    	"Peter Travers": {
    		link: "http://www.awardsdaily.com/2010/12/peter-travers-top-10-films-of-2010/",
    		publication: "Rolling Stone",
    		list: {
    			"The Social Network": 1,
    			Inception: 2,
    			"The King's Speech": 3,
    			"True Grit": 4,
    			"The Kids Are All Right": 5,
    			"127 Hours": 6,
    			"Black Swan": 7,
    			"The Fighter": 8,
    			"Winter's Bone": 9,
    			"Toy Story 3": 10
    		}
    	},
    	"Andrew O'Hehir": {
    		link: "http://www.salon.com/entertainment/movies/our_picks/index.html?story=/ent/movies/2010/09/29/movie_list",
    		publication: "Salon",
    		list: {
    			Carlos: 1,
    			"Black Swan": 2,
    			"Fish Tank": 3,
    			"Blue Valentine": 4,
    			Poetry: 5,
    			"Inside Job": 6,
    			"The Fighter": 7,
    			"Night Catches Us": 8,
    			"I Am Love": 9,
    			"The Kids Are All Right": 10
    		}
    	},
    	"Peter Hartlaub": {
    		link: "http://www.sfgate.com/cgi-bin/article.cgi?f=/c/a/2010/12/24/PK241GOTR4.DTL&type=movies",
    		publication: "San Francisco Chronicle",
    		list: {
    			"Winter's Bone": 1,
    			"Toy Story 3": 2,
    			"The Social Network": 3,
    			"Blue Valentine": 4,
    			"The Town": 5,
    			"True Grit": 6,
    			Mother: 7,
    			"The Tillman Story": 8,
    			"The Fighter": 9,
    			Inception: 10
    		}
    	},
    	"Mick LaSalle": {
    		link: "http://www.sfgate.com/cgi-bin/article.cgi?f=/c/a/2010/12/24/PKLA1GO7DV.DTL&type=movies",
    		publication: "San Francisco Chronicle",
    		list: {
    			"Blue Valentine": 1,
    			"The Ghost Writer": 2,
    			"Mademoiselle Chambon": 3,
    			"The King's Speech": 4,
    			Hereafter: 5,
    			"Toy Story 3": 6,
    			"The Social Network": 7,
    			"Black Swan": 8,
    			"The Kids Are All Right": 9,
    			"The Runaways": 10
    		}
    	},
    	"-Slant Magazine": {
    		link: "http://www.slantmagazine.com/film/feature/best-of-2010-film/246",
    		publication: "Slant Magazine",
    		list: {
    			Dogtooth: 1,
    			"The Ghost Writer": 2,
    			Lourdes: 3,
    			"Everyone Else": 4,
    			Mother: 5,
    			"Scott Pilgrim vs. The World": 6,
    			Vincere: 7,
    			"Wild Grass": 8,
    			Carlos: 9,
    			"Let Me In": 10
    		}
    	},
    	"Dana Stevens": {
    		link: "http://www.slate.com/id/2278793/",
    		publication: "Slate",
    		list: {
    			"Another Year": "_",
    			"Blue Valentine": "_",
    			"Exit Through the Gift Shop": "_",
    			"The Ghost Writer": "_",
    			"The Kids Are All Right": "_",
    			Marwencol: "_",
    			Mother: "_",
    			"Please Give": "_",
    			"The Social Network": "_",
    			"Toy Story 3": "_"
    		}
    	},
    	"Joe Williams": {
    		link: "http://www.stltoday.com/entertainment/movies/article_b58d0103-5c7f-5941-8eca-efabe318ccde.html",
    		publication: "St. Louis Post-Dispatch",
    		list: {
    			"127 Hours": "_",
    			"Black Swan": "_",
    			"Blue Valentine": "_",
    			"City Island": "_",
    			"The Kids Are All Right": "_",
    			"The King's Speech": "_",
    			"The Social Network": "_",
    			"Toy Story 3": "_",
    			"True Grit": "_",
    			"Winter's Bone": "_"
    		}
    	},
    	"Steve Persall": {
    		link: "http://www.tampabay.com/features/movies/top-films-of-2010-built-on-stories-not-technology/1141670",
    		publication: "St. Petersburg Times",
    		list: {
    			"The King's Speech": 1,
    			"Winter's Bone": 2,
    			"The Social Network": 3,
    			"Toy Story 3": 4,
    			"Blue Valentine": 5,
    			"127 Hours": 6,
    			"I Love You Phillip Morris": 7,
    			"Alice in Wonderland": 8,
    			"Rabbit Hole": 9,
    			"Inside Job": 10
    		}
    	},
    	"Tim Robey": {
    		link: "http://www.telegraph.co.uk/culture/film/8194018/Top-10-movies-of-2010.html",
    		publication: "Telegraph [UK]",
    		list: {
    			"The Social Network": 1,
    			"A Prophet": 2,
    			"Toy Story 3": 3,
    			"Another Year": 4,
    			"I Am Love": 5,
    			"The Kids Are All Right": 6,
    			Dogtooth: 7,
    			"How to Train Your Dragon": 8,
    			"The Ghost Writer": 9,
    			Inception: 10
    		}
    	},
    	"Richard Corliss": {
    		link: "http://www.time.com/time/specials/packages/article/0,28804,2035319_2035308,00.html",
    		publication: "Time",
    		list: {
    			"Toy Story 3": 1,
    			"Inside Job": 2,
    			"Never Let Me Go": 3,
    			"Life During Wartime": 4,
    			"The Social Network": 5,
    			"Rabbit Hole": 6,
    			"Wild Grass": 7,
    			"Green Zone": 8,
    			"Waiting for 'Superman'": 9,
    			"Four Lions": 10
    		}
    	},
    	"David Fear": {
    		link: "http://newyork.timeout.com/arts-culture/film/663133/best-and-worst-of-2010?package=660733",
    		publication: "Time Out New York",
    		list: {
    			"Winter's Bone": 1,
    			"The Social Network": 2,
    			"Red Riding Trilogy": 3,
    			"Another Year": 4,
    			"Exit Through the Gift Shop": 5,
    			"Guy and Madeline on a Park Bench": 6,
    			"The Exploding Girl": 7,
    			"Last Train Home": 8,
    			"I Am Love": 9,
    			"Enter the Void": 10
    		}
    	},
    	"Joshua Rothkopf": {
    		link: "http://newyork.timeout.com/arts-culture/film/663133/best-and-worst-of-2010?package=660733",
    		publication: "Time Out New York",
    		list: {
    			"The Social Network": 1,
    			"Exit Through the Gift Shop": 2,
    			Carlos: 3,
    			"Another Year": 4,
    			"Winter's Bone": 5,
    			Dogtooth: 6,
    			"The Kids Are All Right": 7,
    			Lourdes: 8,
    			"A Prophet": 9,
    			"127 Hours": 10
    		}
    	},
    	"Keith Uhlich": {
    		link: "http://newyork.timeout.com/arts-culture/film/663133/best-and-worst-of-2010?package=660733",
    		publication: "Time Out New York",
    		list: {
    			"Wild Grass": 1,
    			"The Ghost Writer": 2,
    			"Step Up 3-D": 3,
    			"Boxing Gym": 4,
    			"Shutter Island": 5,
    			"The Strange Case of Angelica": 6,
    			"Harry Potter and the Deathly Hallows: Part 1": 7,
    			"Another Year": 8,
    			"You Will Meet a Tall Dark Stranger": 9,
    			"Have You Heard from Johannesburg?": 10
    		}
    	},
    	"Claudia Puig": {
    		link: "http://www.usatoday.com/life/movies/reviews/2010-12-30-moviesyearender30_VA_N.htm?loc=interstitialskip",
    		publication: "USA Today",
    		list: {
    			"127 Hours": 1,
    			"Black Swan": 2,
    			"Blue Valentine": 3,
    			Inception: 4,
    			"The King's Speech": 5,
    			"Please Give": 6,
    			"The Social Network": 7,
    			"Toy Story 3": 8,
    			"True Grit": 9,
    			"Winter's Bone": 10
    		}
    	},
    	"Simon Abrams": {
    		link: "http://www.villagevoice.com/filmpoll/view/critics/Simon+Abrams/2010/",
    		publication: "Village Voice",
    		list: {
    			Dogtooth: 1,
    			Amer: 2,
    			"Let Me In": 3,
    			Oceans: 4,
    			"The Ghost Writer": 5,
    			"Eccentricities of a Blonde-haired Girl": 6,
    			Hadewijch: 7,
    			"Life During Wartime": 8,
    			Lourdes: 9,
    			"Black Swan": 10
    		}
    	},
    	"Melissa Anderson": {
    		link: "http://www.villagevoice.com/filmpoll/view/critics/Simon+Abrams/2010/",
    		publication: "Village Voice",
    		list: {
    			Carlos: 1,
    			Lourdes: 2,
    			"World on a Wire": 3,
    			Lebanon: 4,
    			"The Social Network": 5,
    			"White Material": 6,
    			Alamar: 7,
    			"Night Catches Us": 8,
    			"Daddy Longlegs": 9,
    			"I Love You Phillip Morris": 10
    		}
    	},
    	"Michael Atkinson": {
    		link: "http://www.villagevoice.com/filmpoll/view/critics/Michael+Atkinson/2010/",
    		publication: "Village Voice",
    		list: {
    			"Red Riding Trilogy": 1,
    			Dogtooth: 2,
    			"Never Let Me Go": 3,
    			Mother: 4,
    			"A Prophet": 5,
    			"I Am Love": 6,
    			Ajami: 7,
    			Vincere: 8,
    			Monsters: 9,
    			"The Good, The Bad, The Weird": 10
    		}
    	},
    	"FX Feeney": {
    		link: "http://www.villagevoice.com/filmpoll/view/critics/FX+Feeney/2010/",
    		publication: "Village Voice",
    		list: {
    			"The Ghost Writer": 1,
    			"Road to Nowhere": 2,
    			Inception: 3,
    			"Black Swan": 4,
    			"The King's Speech": 5,
    			"Fair Game": 6,
    			"Winter's Bone": 7,
    			"The Social Network": 8,
    			"127 Hours": 9,
    			Salt: 10
    		}
    	},
    	"J Hoberman": {
    		link: "http://www.washingtonpost.com/wp-dyn/content/gallery/2010/12/17/GA2010121702212.html?hpid=topnews#photo=1",
    		publication: "Village Voice",
    		list: {
    			"The Strange Case of Angelica": 1,
    			Carlos: 2,
    			"The Ghost Writer": 3,
    			Lebanon: 4,
    			"White Material": 5,
    			"Henri-Georges Clouzot's Inferno": 6,
    			"The Autobiography of Nicolae Ceausescu": 7,
    			"The Juche Idea": 8,
    			"Guy and Madeline on a Park Bench": 9,
    			"Inception (the last 40 minutes)": 10
    		}
    	},
    	"Nick Pinkerton": {
    		link: "http://www.villagevoice.com/filmpoll/view/critics/Nick+Pinkerton/2010/",
    		publication: "Village Voice",
    		list: {
    			"45365": "_",
    			Buried: "_",
    			"The City of Your Final Destination": "_",
    			"Ghost Town": "_",
    			"Piranha 3D": "_",
    			"The Portugese Nun": "_",
    			"The Runaways": "_",
    			"Shutter Island": "_",
    			"The Temptation of St. Tony": "_",
    			"World on a Wire": "_"
    		}
    	},
    	"Joe Morgenstern": {
    		link: "http://online.wsj.com/article/SB10001424052748703581204576033683480980572.html",
    		publication: "Wall Street Journal",
    		note: "Films 3-10 are unranked.",
    		list: {
    			"1. The Social Network": "_",
    			"2. The King's Speech": "_",
    			Carlos: "_",
    			"The Fighter": "_",
    			"The Kids Are All Right": "_",
    			Mother: "_",
    			"Please Give": "_",
    			"Precious Life": "_",
    			"Toy Story 3": "_",
    			"Winter's Bone": "_"
    		}
    	},
    	"Ann Hornaday": {
    		link: "http://www.washingtonpost.com/wp-dyn/content/gallery/2010/12/17/GA2010121702212.html?hpid=topnews#photo=1",
    		publication: "Washington Post",
    		list: {
    			"The Social Network": 1,
    			"127 Hours": 2,
    			"The Tillman Story": 3,
    			"I Am Love": 4,
    			"Please Give": 5,
    			Inception: 6,
    			"No One Knows About Persian Cats": 7,
    			"The Kids Are All Right": 8,
    			"The Ghost Writer": 9,
    			"Fair Game": 10
    		}
    	}
    };
    var works = {
    	"45365": {
    		critics: [
    			"Nick Pinkerton"
    		],
    		firsts: [
    		]
    	},
    	"The Social Network": {
    		critics: [
    			"Bill Goodykoontz",
    			"David Germain",
    			"Christy Lemire",
    			"Marjorie Baumgarten",
    			"Kimberley Jones",
    			"Michael Sragow",
    			"Ty Burr",
    			"Wesley Morris",
    			"Pete Hammond",
    			"Mark Keizer",
    			"John P. McCarthy",
    			"Steve Ramos",
    			"Andrea Grunvall",
    			"J.R. Jones",
    			"Roger Ebert",
    			"Clint O'Connor",
    			"Chris Vognar",
    			"",
    			"Owen Gleiberman",
    			"Lisa Schwarzbaum",
    			"Rick Groen and Liam Lacey",
    			"Kirk Honeycutt",
    			"Todd McCarthy",
    			"Anne Thompson",
    			"David Ehrenstein",
    			"Betsy Sharkey",
    			"Kenneth Turan",
    			"Rene Rodriguez",
    			"Michelle Orange",
    			"Stephanie Zacharek",
    			"Sean Axmaker",
    			"Jim Emerson",
    			"Richard T. Jameson",
    			"Don Kaye",
    			"Glenn Kenny",
    			"Dave McCoy",
    			"Kim Morgan",
    			"Kat Murphy",
    			"Frank Paiva",
    			"Mary Pols",
    			"James Rocchi",
    			"Mike Scott",
    			"Joe Neumaier",
    			"Elizabeth Weitzman",
    			"Stephen Holden",
    			"Richard Brody",
    			"Anthony Lane",
    			"David Ansen",
    			"-NOW Magazine (Toronto)",
    			"Philip French",
    			"Noel Murray",
    			"Keith Phipps",
    			"Nathan Rabin",
    			"Tasha Robinson",
    			"Scott Tobias",
    			"Shawn Levy",
    			"Marc Mohan",
    			"Mike Russell",
    			"Roger Moore",
    			"Steven Rea",
    			"James Berardinelli",
    			"-Reverse Shot",
    			"Peter Travers",
    			"Peter Hartlaub",
    			"Mick LaSalle",
    			"Dana Stevens",
    			"Joe Williams",
    			"Steve Persall",
    			"Tim Robey",
    			"Richard Corliss",
    			"David Fear",
    			"Joshua Rothkopf",
    			"Claudia Puig",
    			"Melissa Anderson",
    			"FX Feeney",
    			"Ann Hornaday"
    		],
    		firsts: [
    			"Bill Goodykoontz",
    			"Christy Lemire",
    			"Kimberley Jones",
    			"Michael Sragow",
    			"Andrea Grunvall",
    			"Roger Ebert",
    			"Owen Gleiberman",
    			"Lisa Schwarzbaum",
    			"Betsy Sharkey",
    			"Kenneth Turan",
    			"Rene Rodriguez",
    			"Jim Emerson",
    			"Dave McCoy",
    			"Mary Pols",
    			"Stephen Holden",
    			"-NOW Magazine (Toronto)",
    			"Peter Travers",
    			"Tim Robey",
    			"Joshua Rothkopf",
    			"Ann Hornaday"
    		]
    	},
    	Inception: {
    		critics: [
    			"Bill Goodykoontz",
    			"David Germain",
    			"Christy Lemire",
    			"Pete Hammond",
    			"Mark Keizer",
    			"John P. McCarthy",
    			"Roger Ebert",
    			"Clint O'Connor",
    			"Chris Vognar",
    			"Luke Y. Thompson",
    			"",
    			"Neil Miller",
    			"Gregory Ellwood",
    			"Drew McWeeny",
    			"Kirk Honeycutt",
    			"Kenneth Turan",
    			"Rene Rodriguez",
    			"Don Kaye",
    			"Bryan Reesman",
    			"Mike Scott",
    			"Elizabeth Weitzman",
    			"Stephen Holden",
    			"-NOW Magazine (Toronto)",
    			"Philip French",
    			"Noel Murray",
    			"Keith Phipps",
    			"Nathan Rabin",
    			"Tasha Robinson",
    			"Shawn Levy",
    			"Mike Russell",
    			"James Berardinelli",
    			"Peter Travers",
    			"Peter Hartlaub",
    			"Tim Robey",
    			"Claudia Puig",
    			"FX Feeney",
    			"Ann Hornaday"
    		],
    		firsts: [
    			"",
    			"Kirk Honeycutt",
    			"Kenneth Turan",
    			"Bryan Reesman",
    			"Tasha Robinson"
    		]
    	},
    	"Winter's Bone": {
    		critics: [
    			"Bill Goodykoontz",
    			"David Germain",
    			"Christy Lemire",
    			"Marjorie Baumgarten",
    			"Kimberley Jones",
    			"Marc Savlov",
    			"Michael Sragow",
    			"Mark Keizer",
    			"John P. McCarthy",
    			"Andrea Grunvall",
    			"J.R. Jones",
    			"Roger Ebert",
    			"Peter Rainer",
    			"Clint O'Connor",
    			"Chris Vognar",
    			"",
    			"Lisa Schwarzbaum",
    			"Rick Groen and Liam Lacey",
    			"Kirk Honeycutt",
    			"Eric Kohn",
    			"Anne Thompson",
    			"Betsy Sharkey",
    			"Kenneth Turan",
    			"Sean Axmaker",
    			"Jim Emerson",
    			"Richard T. Jameson",
    			"Don Kaye",
    			"Dave McCoy",
    			"Kat Murphy",
    			"James Rocchi",
    			"Glenn Whipp",
    			"Mike Scott",
    			"David Edelstein",
    			"David Denby",
    			"Anthony Lane",
    			"David Ansen",
    			"Philip French",
    			"Noel Murray",
    			"Keith Phipps",
    			"Tasha Robinson",
    			"Scott Tobias",
    			"Stan Hall",
    			"Shawn Levy",
    			"Marc Mohan",
    			"Roger Moore",
    			"Steven Rea",
    			"Carrie Rickey",
    			"Peter Travers",
    			"Peter Hartlaub",
    			"Joe Williams",
    			"Steve Persall",
    			"David Fear",
    			"Joshua Rothkopf",
    			"Claudia Puig",
    			"FX Feeney",
    			"Joe Morgenstern"
    		],
    		firsts: [
    			"David Germain",
    			"Clint O'Connor",
    			"Anne Thompson",
    			"David Edelstein",
    			"Keith Phipps",
    			"Peter Hartlaub",
    			"David Fear"
    		]
    	},
    	"The King's Speech": {
    		critics: [
    			"Bill Goodykoontz",
    			"David Germain",
    			"Christy Lemire",
    			"Marc Savlov",
    			"Michael Sragow",
    			"Pete Hammond",
    			"Mark Keizer",
    			"Wade Major",
    			"Amy Nicholson",
    			"Roger Ebert",
    			"Peter Rainer",
    			"Clint O'Connor",
    			"Neil Miller",
    			"Rick Groen and Liam Lacey",
    			"Kirk Honeycutt",
    			"Anne Thompson",
    			"Betsy Sharkey",
    			"Kenneth Turan",
    			"Marc Doyle",
    			"Stephanie Zacharek",
    			"Mike Scott",
    			"Joe Neumaier",
    			"David Ansen",
    			"Nathan Rabin",
    			"Shawn Levy",
    			"Roger Moore",
    			"Steven Rea",
    			"Carrie Rickey",
    			"James Berardinelli",
    			"Peter Travers",
    			"Mick LaSalle",
    			"Joe Williams",
    			"Steve Persall",
    			"Claudia Puig",
    			"FX Feeney"
    		],
    		firsts: [
    			"Wade Major",
    			"James Berardinelli",
    			"Steve Persall"
    		]
    	},
    	"Toy Story 3": {
    		critics: [
    			"Bill Goodykoontz",
    			"Kimberley Jones",
    			"Michael Sragow",
    			"Ty Burr",
    			"Wesley Morris",
    			"Pete Hammond",
    			"Peter Rainer",
    			"Clint O'Connor",
    			"Chris Vognar",
    			"",
    			"Owen Gleiberman",
    			"Lisa Schwarzbaum",
    			"Drew McWeeny",
    			"Todd McCarthy",
    			"Anne Thompson",
    			"Chuck Wilson",
    			"Betsy Sharkey",
    			"Kenneth Turan",
    			"Glenn Kenny",
    			"Frank Paiva",
    			"Mary Pols",
    			"Bryan Reesman",
    			"Glenn Whipp",
    			"Mike Scott",
    			"David Edelstein",
    			"Joe Neumaier",
    			"A.O. Scott",
    			"David Denby",
    			"Anthony Lane",
    			"David Ansen",
    			"Philip French",
    			"Keith Phipps",
    			"Tasha Robinson",
    			"Scott Tobias",
    			"Marc Mohan",
    			"Mike Russell",
    			"Carrie Rickey",
    			"James Berardinelli",
    			"Peter Travers",
    			"Peter Hartlaub",
    			"Mick LaSalle",
    			"Dana Stevens",
    			"Joe Williams",
    			"Steve Persall",
    			"Tim Robey",
    			"Richard Corliss",
    			"Claudia Puig",
    			"Joe Morgenstern"
    		],
    		firsts: [
    			"Kenneth Turan",
    			"Richard Corliss"
    		]
    	},
    	"Get Low": {
    		critics: [
    			"Bill Goodykoontz",
    			"Marc Savlov",
    			"Mike Scott",
    			"Joe Neumaier"
    		],
    		firsts: [
    		]
    	},
    	"127 Hours": {
    		critics: [
    			"Bill Goodykoontz",
    			"David Germain",
    			"Christy Lemire",
    			"Pam Grady",
    			"Chris Vognar",
    			"Owen Gleiberman",
    			"Lisa Schwarzbaum",
    			"Gregory Ellwood",
    			"Kirk Honeycutt",
    			"Betsy Sharkey",
    			"Michelle Orange",
    			"Glenn Whipp",
    			"Mike Scott",
    			"A.O. Scott",
    			"-NOW Magazine (Toronto)",
    			"Marc Mohan",
    			"Mike Russell",
    			"Roger Moore",
    			"Steven Rea",
    			"Peter Travers",
    			"Joe Williams",
    			"Steve Persall",
    			"Joshua Rothkopf",
    			"Claudia Puig",
    			"FX Feeney",
    			"Ann Hornaday"
    		],
    		firsts: [
    			"Chris Vognar",
    			"Mike Scott",
    			"Mike Russell",
    			"Roger Moore",
    			"Claudia Puig"
    		]
    	},
    	"Animal Kingdom": {
    		critics: [
    			"Bill Goodykoontz",
    			"Christy Lemire",
    			"Pam Grady",
    			"Wade Major",
    			"Lisa Schwarzbaum",
    			"Todd McCarthy",
    			"Eric Kohn",
    			"Kenneth Turan",
    			"Marc Doyle",
    			"Rene Rodriguez",
    			"Don Kaye",
    			"Elizabeth Weitzman"
    		],
    		firsts: [
    			"Pam Grady",
    			"Marc Doyle"
    		]
    	},
    	"The Fighter": {
    		critics: [
    			"Bill Goodykoontz",
    			"Marjorie Baumgarten",
    			"Marc Savlov",
    			"Ty Burr",
    			"Wesley Morris",
    			"Chris Vognar",
    			"Rene Rodriguez",
    			"Joe Neumaier",
    			"Elizabeth Weitzman",
    			"David Denby",
    			"David Ansen",
    			"Shawn Levy",
    			"Mike Russell",
    			"Roger Moore",
    			"Peter Travers",
    			"Andrew O'Hehir",
    			"Peter Hartlaub",
    			"Joe Morgenstern"
    		],
    		firsts: [
    		]
    	},
    	"Nowhere Boy": {
    		critics: [
    			"Bill Goodykoontz",
    			"Clint O'Connor",
    			"Carrie Rickey"
    		],
    		firsts: [
    		]
    	},
    	"Four Lions": {
    		critics: [
    			"David Germain",
    			"John P. McCarthy",
    			"Sara Maria Vizcarrondo",
    			"Luke Y. Thompson",
    			"Neil Miller",
    			"Drew McWeeny",
    			"Richard Corliss"
    		],
    		firsts: [
    			"Luke Y. Thompson"
    		]
    	},
    	"Barney's Version": {
    		critics: [
    			"David Germain"
    		],
    		firsts: [
    		]
    	},
    	"Never Let Me Go": {
    		critics: [
    			"David Germain",
    			"Christy Lemire",
    			"Joe Neumaier",
    			"Steven Rea",
    			"Richard Corliss",
    			"Michael Atkinson"
    		],
    		firsts: [
    		]
    	},
    	"Another Year": {
    		critics: [
    			"David Germain",
    			"Pete Hammond",
    			"Mark Keizer",
    			"Wade Major",
    			"John P. McCarthy",
    			"Peter Rainer",
    			"Owen Gleiberman",
    			"Lisa Schwarzbaum",
    			"Rick Groen and Liam Lacey",
    			"Gregory Ellwood",
    			"Peter Knegt",
    			"Eric Kohn",
    			"Don Kaye",
    			"Dave McCoy",
    			"Mary Pols",
    			"Glenn Whipp",
    			"David Edelstein",
    			"Stephen Holden",
    			"Philip French",
    			"Tasha Robinson",
    			"-Reverse Shot",
    			"Dana Stevens",
    			"Tim Robey",
    			"David Fear",
    			"Joshua Rothkopf",
    			"Keith Uhlich"
    		],
    		firsts: [
    			"Mark Keizer",
    			"Peter Rainer",
    			"Peter Knegt"
    		]
    	},
    	"True Grit": {
    		critics: [
    			"David Germain",
    			"Michael Sragow",
    			"Ty Burr",
    			"Pam Grady",
    			"Andrea Grunvall",
    			"Chris Vognar",
    			"Gregory Ellwood",
    			"Drew McWeeny",
    			"Kirk Honeycutt",
    			"Peter Knegt",
    			"Anne Thompson",
    			"Betsy Sharkey",
    			"Kenneth Turan",
    			"Mary Pols",
    			"James Rocchi",
    			"Glenn Whipp",
    			"Elizabeth Weitzman",
    			"Stephen Holden",
    			"-NOW Magazine (Toronto)",
    			"Noel Murray",
    			"Keith Phipps",
    			"Nathan Rabin",
    			"Mike Russell",
    			"James Berardinelli",
    			"Peter Travers",
    			"Peter Hartlaub",
    			"Joe Williams",
    			"Claudia Puig"
    		],
    		firsts: [
    			"Glenn Whipp"
    		]
    	},
    	"I Am Love": {
    		critics: [
    			"Christy Lemire",
    			"Andrea Grunvall",
    			"Roger Ebert",
    			"Peter Rainer",
    			"Gregory Ellwood",
    			"Anthony Quinn",
    			"Peter Knegt",
    			"David Ehrenstein",
    			"Chuck Wilson",
    			"Marc Doyle",
    			"Rene Rodriguez",
    			"Michelle Orange",
    			"Stephanie Zacharek",
    			"Mary Pols",
    			"Anthony Lane",
    			"Steven Rea",
    			"Andrew O'Hehir",
    			"Tim Robey",
    			"David Fear",
    			"Michael Atkinson",
    			"Ann Hornaday"
    		],
    		firsts: [
    			"Gregory Ellwood"
    		]
    	},
    	"Black Swan": {
    		critics: [
    			"Christy Lemire",
    			"Marjorie Baumgarten",
    			"Kimberley Jones",
    			"Marc Savlov",
    			"Pete Hammond",
    			"Mark Keizer",
    			"John P. McCarthy",
    			"Roger Ebert",
    			"Neil Miller",
    			"Gregory Ellwood",
    			"Drew McWeeny",
    			"Peter Knegt",
    			"Betsy Sharkey",
    			"Rene Rodriguez",
    			"Michelle Orange",
    			"Sean Axmaker",
    			"Don Kaye",
    			"Glenn Kenny",
    			"Dave McCoy",
    			"Kim Morgan",
    			"Kat Murphy",
    			"Frank Paiva",
    			"Mary Pols",
    			"James Rocchi",
    			"Glenn Whipp",
    			"Elizabeth Weitzman",
    			"Richard Brody",
    			"Noel Murray",
    			"Keith Phipps",
    			"Nathan Rabin",
    			"Tasha Robinson",
    			"Shawn Levy",
    			"Mike Russell",
    			"Roger Moore",
    			"Steven Rea",
    			"James Berardinelli",
    			"Peter Travers",
    			"Andrew O'Hehir",
    			"Mick LaSalle",
    			"Joe Williams",
    			"Claudia Puig",
    			"Simon Abrams",
    			"FX Feeney"
    		],
    		firsts: [
    			"Marc Savlov",
    			"Neil Miller",
    			"Drew McWeeny",
    			"Don Kaye",
    			"Kim Morgan",
    			"James Rocchi",
    			"Noel Murray"
    		]
    	},
    	"Exit Through the Gift Shop": {
    		critics: [
    			"Christy Lemire",
    			"Marjorie Baumgarten",
    			"Marc Savlov",
    			"Ty Burr",
    			"Sara Maria Vizcarrondo",
    			"Chris Vognar",
    			"Owen Gleiberman",
    			"Eric Kohn",
    			"Marc Doyle",
    			"Rene Rodriguez",
    			"Michelle Orange",
    			"Don Kaye",
    			"Frank Paiva",
    			"James Rocchi",
    			"Glenn Whipp",
    			"David Edelstein",
    			"A.O. Scott",
    			"David Denby",
    			"-NOW Magazine (Toronto)",
    			"Keith Phipps",
    			"Nathan Rabin",
    			"Scott Tobias",
    			"Dana Stevens",
    			"David Fear",
    			"Joshua Rothkopf"
    		],
    		firsts: [
    			"Ty Burr",
    			"Sara Maria Vizcarrondo",
    			"Frank Paiva"
    		]
    	},
    	"A Prophet": {
    		critics: [
    			"Marjorie Baumgarten",
    			"Marc Savlov",
    			"Steve Ramos",
    			"Andrea Grunvall",
    			"Chris Vognar",
    			"",
    			"Lisa Schwarzbaum",
    			"Neil Miller",
    			"Kirk Honeycutt",
    			"Todd McCarthy",
    			"Anthony Quinn",
    			"Kenneth Turan",
    			"Richard T. Jameson",
    			"Don Kaye",
    			"Kat Murphy",
    			"Anthony Lane",
    			"David Ansen",
    			"-NOW Magazine (Toronto)",
    			"Philip French",
    			"Tasha Robinson",
    			"Stan Hall",
    			"Marc Mohan",
    			"Steven Rea",
    			"Tim Robey",
    			"Joshua Rothkopf",
    			"Michael Atkinson"
    		],
    		firsts: [
    			"Marjorie Baumgarten",
    			"David Ansen"
    		]
    	},
    	"Fish Tank": {
    		critics: [
    			"Marjorie Baumgarten",
    			"Marc Doyle",
    			"Glenn Kenny",
    			"Mary Pols",
    			"David Ansen",
    			"Stan Hall",
    			"Steven Rea",
    			"Andrew O'Hehir"
    		],
    		firsts: [
    		]
    	},
    	"The Kids Are All Right": {
    		critics: [
    			"Marjorie Baumgarten",
    			"Michael Sragow",
    			"Ty Burr",
    			"Andrea Grunvall",
    			"J.R. Jones",
    			"Roger Ebert",
    			"Owen Gleiberman",
    			"Lisa Schwarzbaum",
    			"Gregory Ellwood",
    			"Kirk Honeycutt",
    			"Todd McCarthy",
    			"Anthony Quinn",
    			"Peter Knegt",
    			"Anne Thompson",
    			"David Ehrenstein",
    			"Betsy Sharkey",
    			"Jim Emerson",
    			"Richard T. Jameson",
    			"Kat Murphy",
    			"Mary Pols",
    			"Joe Neumaier",
    			"Elizabeth Weitzman",
    			"A.O. Scott",
    			"Stephen Holden",
    			"David Ansen",
    			"Philip French",
    			"Marc Mohan",
    			"Roger Moore",
    			"Steven Rea",
    			"Carrie Rickey",
    			"Peter Travers",
    			"Andrew O'Hehir",
    			"Mick LaSalle",
    			"Dana Stevens",
    			"Joe Williams",
    			"Tim Robey",
    			"Joshua Rothkopf",
    			"Joe Morgenstern",
    			"Ann Hornaday"
    		],
    		firsts: [
    			"Anthony Quinn",
    			"Elizabeth Weitzman"
    		]
    	},
    	"Inside Job": {
    		critics: [
    			"Marjorie Baumgarten",
    			"Michael Sragow",
    			"Wesley Morris",
    			"Andrea Grunvall",
    			"Peter Rainer",
    			"Rick Groen and Liam Lacey",
    			"Todd McCarthy",
    			"Anne Thompson",
    			"Kenneth Turan",
    			"Michelle Orange",
    			"David Edelstein",
    			"A.O. Scott",
    			"Stephen Holden",
    			"David Denby",
    			"Carrie Rickey",
    			"Andrew O'Hehir",
    			"Steve Persall",
    			"Richard Corliss"
    		],
    		firsts: [
    			"A.O. Scott"
    		]
    	},
    	"Let Me In": {
    		critics: [
    			"Marjorie Baumgarten",
    			"Amy Nicholson",
    			"Clint O'Connor",
    			"Anne Thompson",
    			"Sean Axmaker",
    			"Jim Emerson",
    			"Richard T. Jameson",
    			"Kat Murphy",
    			"Joe Neumaier",
    			"Elizabeth Weitzman",
    			"Mike Russell",
    			"-Slant Magazine",
    			"Simon Abrams"
    		],
    		firsts: [
    			"Amy Nicholson"
    		]
    	},
    	"Everyone Else": {
    		critics: [
    			"Kimberley Jones",
    			"Peter Knegt",
    			"Karina Longworth",
    			"Glenn Kenny",
    			"Scott Tobias",
    			"-Reverse Shot",
    			"-Slant Magazine"
    		],
    		firsts: [
    		]
    	},
    	"Red Riding Trilogy": {
    		critics: [
    			"Kimberley Jones",
    			"Steve Ramos",
    			"Andrea Grunvall",
    			"Chris Vognar",
    			"Sean Axmaker",
    			"Dave McCoy",
    			"Tasha Robinson",
    			"David Fear",
    			"Michael Atkinson"
    		],
    		firsts: [
    			"Michael Atkinson"
    		]
    	},
    	Monsters: {
    		critics: [
    			"Kimberley Jones",
    			"Marc Savlov",
    			"Don Kaye",
    			"Michael Atkinson"
    		],
    		firsts: [
    		]
    	},
    	"It's Kind of a Funny Story": {
    		critics: [
    			"Kimberley Jones",
    			"Wade Major"
    		],
    		firsts: [
    		]
    	},
    	"The Exploding Girl": {
    		critics: [
    			"Kimberley Jones",
    			"David Fear"
    		],
    		firsts: [
    		]
    	},
    	"Scott Pilgrim vs. The World": {
    		critics: [
    			"Kimberley Jones",
    			"Wesley Morris",
    			"Amy Nicholson",
    			"Steve Ramos",
    			"",
    			"Neil Miller",
    			"Drew McWeeny",
    			"-NOW Magazine (Toronto)",
    			"Nathan Rabin",
    			"Tasha Robinson",
    			"Mike Russell",
    			"Carrie Rickey",
    			"-Slant Magazine"
    		],
    		firsts: [
    		]
    	},
    	Restrepo: {
    		critics: [
    			"Marc Savlov",
    			"Andrea Grunvall",
    			"J.R. Jones",
    			"Betsy Sharkey",
    			"Mike Scott",
    			"David Denby",
    			"Scott Tobias"
    		],
    		firsts: [
    		]
    	},
    	"Down Terrace": {
    		critics: [
    			"Marc Savlov",
    			"Anthony Quinn",
    			"Dave McCoy",
    			"Stan Hall"
    		],
    		firsts: [
    		]
    	},
    	Vincere: {
    		critics: [
    			"Michael Sragow",
    			"Wesley Morris",
    			"Peter Rainer",
    			"Chuck Wilson",
    			"Stephanie Zacharek",
    			"David Edelstein",
    			"Stephen Holden",
    			"-Slant Magazine",
    			"Michael Atkinson"
    		],
    		firsts: [
    		]
    	},
    	"Harry Potter and the Deathly Hallows: Part 1": {
    		critics: [
    			"Michael Sragow",
    			"Luke Y. Thompson",
    			"Keith Uhlich"
    		],
    		firsts: [
    		]
    	},
    	"The Tempest": {
    		critics: [
    			"Michael Sragow",
    			"Amy Nicholson"
    		],
    		firsts: [
    		]
    	},
    	Marwencol: {
    		critics: [
    			"Ty Burr",
    			"Pam Grady",
    			"Clint O'Connor",
    			"Rick Groen and Liam Lacey",
    			"David Edelstein",
    			"-NOW Magazine (Toronto)",
    			"Stan Hall",
    			"Dana Stevens"
    		],
    		firsts: [
    		]
    	},
    	"Boxing Gym": {
    		critics: [
    			"Ty Burr",
    			"Keith Uhlich"
    		],
    		firsts: [
    		]
    	},
    	"A Film Unfinished": {
    		critics: [
    			"Ty Burr"
    		],
    		firsts: [
    		]
    	},
    	"Last Train Home": {
    		critics: [
    			"Ty Burr",
    			"Steve Ramos",
    			"Peter Rainer",
    			"Lisa Schwarzbaum",
    			"Peter Knegt",
    			"Frank Paiva",
    			"Glenn Whipp",
    			"A.O. Scott",
    			"David Fear"
    		],
    		firsts: [
    		]
    	},
    	"Jackass 3D": {
    		critics: [
    			"Wesley Morris",
    			"Sara Maria Vizcarrondo",
    			"Kim Morgan"
    		],
    		firsts: [
    		]
    	},
    	Machete: {
    		critics: [
    			"Wesley Morris"
    		],
    		firsts: [
    		]
    	},
    	"Mother and Child": {
    		critics: [
    			"Wesley Morris",
    			"Wade Major",
    			"David Edelstein"
    		],
    		firsts: [
    		]
    	},
    	Sweetgrass: {
    		critics: [
    			"Wesley Morris",
    			"Todd McCarthy",
    			"Michelle Orange",
    			"Sean Axmaker",
    			"Jim Emerson",
    			"Richard T. Jameson",
    			"Kat Murphy",
    			"Anthony Lane",
    			"-Reverse Shot"
    		],
    		firsts: [
    		]
    	},
    	"The Trotsky": {
    		critics: [
    			"Pam Grady"
    		],
    		firsts: [
    		]
    	},
    	"Brighton Rock": {
    		critics: [
    			"Pam Grady"
    		],
    		firsts: [
    		]
    	},
    	Triage: {
    		critics: [
    			"Pam Grady"
    		],
    		firsts: [
    		]
    	},
    	"Soul Kitchen": {
    		critics: [
    			"Pam Grady"
    		],
    		firsts: [
    		]
    	},
    	Undertow: {
    		critics: [
    			"Pam Grady"
    		],
    		firsts: [
    		]
    	},
    	"Kick-Ass": {
    		critics: [
    			"Pam Grady",
    			""
    		],
    		firsts: [
    		]
    	},
    	Biutiful: {
    		critics: [
    			"Pete Hammond"
    		],
    		firsts: [
    		]
    	},
    	"The Ghost Writer": {
    		critics: [
    			"Pete Hammond",
    			"Andrea Grunvall",
    			"Roger Ebert",
    			"Peter Rainer",
    			"Luke Y. Thompson",
    			"Owen Gleiberman",
    			"Lisa Schwarzbaum",
    			"Gregory Ellwood",
    			"Peter Knegt",
    			"Anne Thompson",
    			"David Ehrenstein",
    			"Karina Longworth",
    			"Chuck Wilson",
    			"Michelle Orange",
    			"Stephanie Zacharek",
    			"Richard T. Jameson",
    			"Dave McCoy",
    			"Kim Morgan",
    			"Kat Murphy",
    			"Bryan Reesman",
    			"Glenn Whipp",
    			"David Denby",
    			"Philip French",
    			"Shawn Levy",
    			"Marc Mohan",
    			"Mick LaSalle",
    			"-Slant Magazine",
    			"Dana Stevens",
    			"Tim Robey",
    			"Keith Uhlich",
    			"Simon Abrams",
    			"FX Feeney",
    			"J Hoberman",
    			"Ann Hornaday"
    		],
    		firsts: [
    			"David Ehrenstein",
    			"Chuck Wilson",
    			"Richard T. Jameson",
    			"Kat Murphy",
    			"FX Feeney"
    		]
    	},
    	"Rabbit Hole": {
    		critics: [
    			"Pete Hammond",
    			"Wade Major",
    			"Rick Groen and Liam Lacey",
    			"Gregory Ellwood",
    			"Drew McWeeny",
    			"Don Kaye",
    			"Mary Pols",
    			"James Rocchi",
    			"Keith Phipps",
    			"Roger Moore",
    			"James Berardinelli",
    			"Steve Persall",
    			"Richard Corliss"
    		],
    		firsts: [
    		]
    	},
    	"Shutter Island": {
    		critics: [
    			"Pete Hammond",
    			"",
    			"Karina Longworth",
    			"Glenn Kenny",
    			"Richard Brody",
    			"Scott Tobias",
    			"Keith Uhlich",
    			"Nick Pinkerton"
    		],
    		firsts: [
    			"Richard Brody"
    		]
    	},
    	Carlos: {
    		critics: [
    			"Mark Keizer",
    			"Steve Ramos",
    			"J.R. Jones",
    			"Rick Groen and Liam Lacey",
    			"Kirk Honeycutt",
    			"Todd McCarthy",
    			"Peter Knegt",
    			"Anne Thompson",
    			"Betsy Sharkey",
    			"Marc Doyle",
    			"Rene Rodriguez",
    			"Stephanie Zacharek",
    			"Sean Axmaker",
    			"Jim Emerson",
    			"Glenn Kenny",
    			"Dave McCoy",
    			"Kim Morgan",
    			"A.O. Scott",
    			"Stephen Holden",
    			"David Ansen",
    			"Noel Murray",
    			"Keith Phipps",
    			"Scott Tobias",
    			"Andrew O'Hehir",
    			"-Slant Magazine",
    			"Joshua Rothkopf",
    			"Melissa Anderson",
    			"J Hoberman",
    			"Joe Morgenstern"
    		],
    		firsts: [
    			"Todd McCarthy",
    			"Sean Axmaker",
    			"Glenn Kenny",
    			"Andrew O'Hehir",
    			"Melissa Anderson"
    		]
    	},
    	"OSS 117: Lost in Rio": {
    		critics: [
    			"Mark Keizer"
    		],
    		firsts: [
    		]
    	},
    	"The Juche Idea": {
    		critics: [
    			"Mark Keizer",
    			"J Hoberman"
    		],
    		firsts: [
    		]
    	},
    	"The Tillman Story": {
    		critics: [
    			"Mark Keizer",
    			"Kenneth Turan",
    			"Joe Neumaier",
    			"Peter Hartlaub",
    			"Ann Hornaday"
    		],
    		firsts: [
    		]
    	},
    	Ajami: {
    		critics: [
    			"Wade Major",
    			"Owen Gleiberman",
    			"Kenneth Turan",
    			"Michael Atkinson"
    		],
    		firsts: [
    		]
    	},
    	"The Way Back": {
    		critics: [
    			"Wade Major",
    			"Kirk Honeycutt"
    		],
    		firsts: [
    		]
    	},
    	"Made in Dagenham": {
    		critics: [
    			"Wade Major"
    		],
    		firsts: [
    		]
    	},
    	"Father of My Children": {
    		critics: [
    			"Wade Major"
    		],
    		firsts: [
    		]
    	},
    	"The Eclipse": {
    		critics: [
    			"John P. McCarthy"
    		],
    		firsts: [
    			"John P. McCarthy"
    		]
    	},
    	Alamar: {
    		critics: [
    			"John P. McCarthy",
    			"Eric Kohn",
    			"-Reverse Shot",
    			"Melissa Anderson"
    		],
    		firsts: [
    			"-Reverse Shot"
    		]
    	},
    	Lebanon: {
    		critics: [
    			"John P. McCarthy",
    			"Kenneth Turan",
    			"Melissa Anderson",
    			"J Hoberman"
    		],
    		firsts: [
    		]
    	},
    	"The Father of My Children": {
    		critics: [
    			"John P. McCarthy",
    			"Anthony Lane"
    		],
    		firsts: [
    		]
    	},
    	"Life During Wartime": {
    		critics: [
    			"Amy Nicholson",
    			"Kim Morgan",
    			"Anthony Lane",
    			"Richard Corliss",
    			"Simon Abrams"
    		],
    		firsts: [
    		]
    	},
    	"The Illusionist": {
    		critics: [
    			"Amy Nicholson",
    			"Peter Rainer",
    			"Luke Y. Thompson",
    			"Noel Murray",
    			"Shawn Levy"
    		],
    		firsts: [
    		]
    	},
    	"Please Give": {
    		critics: [
    			"Amy Nicholson",
    			"J.R. Jones",
    			"Chuck Wilson",
    			"Richard T. Jameson",
    			"Kat Murphy",
    			"Mary Pols",
    			"David Edelstein",
    			"Elizabeth Weitzman",
    			"David Denby",
    			"Dana Stevens",
    			"Claudia Puig",
    			"Joe Morgenstern",
    			"Ann Hornaday"
    		],
    		firsts: [
    		]
    	},
    	"The Square": {
    		critics: [
    			"Amy Nicholson",
    			"J.R. Jones"
    		],
    		firsts: [
    		]
    	},
    	Somewhere: {
    		critics: [
    			"Amy Nicholson",
    			"Karina Longworth",
    			"Rene Rodriguez",
    			"Stephanie Zacharek",
    			"Kim Morgan",
    			"A.O. Scott",
    			"Richard Brody"
    		],
    		firsts: [
    			"Stephanie Zacharek"
    		]
    	},
    	Babies: {
    		critics: [
    			"Amy Nicholson",
    			"Shawn Levy"
    		],
    		firsts: [
    		]
    	},
    	"Blue Valentine": {
    		critics: [
    			"Steve Ramos",
    			"Clint O'Connor",
    			"Owen Gleiberman",
    			"Drew McWeeny",
    			"Chuck Wilson",
    			"Marc Doyle",
    			"Rene Rodriguez",
    			"Mike Scott",
    			"Joe Neumaier",
    			"Nathan Rabin",
    			"Andrew O'Hehir",
    			"Peter Hartlaub",
    			"Mick LaSalle",
    			"Dana Stevens",
    			"Joe Williams",
    			"Steve Persall",
    			"Claudia Puig"
    		],
    		firsts: [
    			"Steve Ramos",
    			"Joe Neumaier",
    			"Nathan Rabin",
    			"Mick LaSalle"
    		]
    	},
    	Dogtooth: {
    		critics: [
    			"Steve Ramos",
    			"J.R. Jones",
    			"Peter Knegt",
    			"Eric Kohn",
    			"Karina Longworth",
    			"Jim Emerson",
    			"Dave McCoy",
    			"Frank Paiva",
    			"James Rocchi",
    			"Anthony Lane",
    			"Noel Murray",
    			"Scott Tobias",
    			"-Slant Magazine",
    			"Tim Robey",
    			"Joshua Rothkopf",
    			"Simon Abrams",
    			"Michael Atkinson"
    		],
    		firsts: [
    			"Eric Kohn",
    			"Scott Tobias",
    			"-Slant Magazine",
    			"Simon Abrams"
    		]
    	},
    	"Daddy Longlegs": {
    		critics: [
    			"Steve Ramos",
    			"Eric Kohn",
    			"Karina Longworth",
    			"Chuck Wilson",
    			"Richard Brody",
    			"Melissa Anderson"
    		],
    		firsts: [
    		]
    	},
    	"Mesrine: Public Enemy No 1": {
    		critics: [
    			"Steve Ramos"
    		],
    		firsts: [
    		]
    	},
    	"I Love You Phillip Morris": {
    		critics: [
    			"Sara Maria Vizcarrondo",
    			"Roger Moore",
    			"Steve Persall",
    			"Melissa Anderson"
    		],
    		firsts: [
    		]
    	},
    	"Red, White and Blue": {
    		critics: [
    			"Sara Maria Vizcarrondo"
    		],
    		firsts: [
    		]
    	},
    	"Biker Fox": {
    		critics: [
    			"Sara Maria Vizcarrondo"
    		],
    		firsts: [
    		]
    	},
    	"Audrey the Trainwreck": {
    		critics: [
    			"Sara Maria Vizcarrondo"
    		],
    		firsts: [
    		]
    	},
    	"Lover of Hate": {
    		critics: [
    			"Sara Maria Vizcarrondo"
    		],
    		firsts: [
    		]
    	},
    	"Flooding with Love for the Kid": {
    		critics: [
    			"Sara Maria Vizcarrondo"
    		],
    		firsts: [
    		]
    	},
    	"The Last Exorcism": {
    		critics: [
    			"Sara Maria Vizcarrondo"
    		],
    		firsts: [
    		]
    	},
    	"Enter the Void": {
    		critics: [
    			"J.R. Jones",
    			"Luke Y. Thompson",
    			"Eric Kohn",
    			"Karina Longworth",
    			"Kim Morgan",
    			"David Fear"
    		],
    		firsts: [
    		]
    	},
    	"Henri-Georges Clouzot's Inferno": {
    		critics: [
    			"J.R. Jones",
    			"David Ehrenstein",
    			"J Hoberman"
    		],
    		firsts: [
    		]
    	},
    	"The Secret in Their Eyes": {
    		critics: [
    			"Roger Ebert",
    			"Anthony Quinn",
    			"Mike Russell"
    		],
    		firsts: [
    		]
    	},
    	"The American": {
    		critics: [
    			"Roger Ebert",
    			"Stephanie Zacharek",
    			"Jim Emerson",
    			"Richard T. Jameson"
    		],
    		firsts: [
    		]
    	},
    	"Robin Hood": {
    		critics: [
    			"Clint O'Connor"
    		],
    		firsts: [
    		]
    	},
    	"I'm Still Here": {
    		critics: [
    			"Luke Y. Thompson",
    			"Marc Mohan"
    		],
    		firsts: [
    		]
    	},
    	"Idiots and Angels": {
    		critics: [
    			"Luke Y. Thompson"
    		],
    		firsts: [
    		]
    	},
    	"Legend of the Guardians: the Owls of Ga'Hoole": {
    		critics: [
    			"Luke Y. Thompson"
    		],
    		firsts: [
    		]
    	},
    	"Piranha 3D": {
    		critics: [
    			"Luke Y. Thompson",
    			"Nick Pinkerton"
    		],
    		firsts: [
    		]
    	},
    	"Up in the Air": {
    		critics: [
    			"",
    			"Philip French"
    		],
    		firsts: [
    		]
    	},
    	"Bad Lieutenant: Port of Call New Orleans": {
    		critics: [
    			""
    		],
    		firsts: [
    		]
    	},
    	"The Town": {
    		critics: [
    			"Owen Gleiberman",
    			"Kenneth Turan",
    			"Marc Doyle",
    			"Peter Hartlaub"
    		],
    		firsts: [
    		]
    	},
    	"The Good, The Bad, The Weird": {
    		critics: [
    			"Neil Miller",
    			"Michael Atkinson"
    		],
    		firsts: [
    		]
    	},
    	Micmacs: {
    		critics: [
    			"Neil Miller",
    			"Bryan Reesman"
    		],
    		firsts: [
    		]
    	},
    	Merantau: {
    		critics: [
    			"Neil Miller"
    		],
    		firsts: [
    		]
    	},
    	"Thunder Soul": {
    		critics: [
    			"Neil Miller"
    		],
    		firsts: [
    		]
    	},
    	"Despicable Me": {
    		critics: [
    			"Rick Groen and Liam Lacey",
    			"Stephanie Zacharek",
    			"David Edelstein"
    		],
    		firsts: [
    		]
    	},
    	"Uncle Boonmee Who Can Recall His Past Lives": {
    		critics: [
    			"Rick Groen and Liam Lacey",
    			"-NOW Magazine (Toronto)"
    		],
    		firsts: [
    		]
    	},
    	"How to Train Your Dragon": {
    		critics: [
    			"Gregory Ellwood",
    			"James Rocchi",
    			"Tim Robey"
    		],
    		firsts: [
    		]
    	},
    	"I Saw the Devil": {
    		critics: [
    			"Drew McWeeny"
    		],
    		firsts: [
    		]
    	},
    	"A Serbian Film": {
    		critics: [
    			"Drew McWeeny"
    		],
    		firsts: [
    		]
    	},
    	"Wild Grass": {
    		critics: [
    			"Todd McCarthy",
    			"Sean Axmaker",
    			"Glenn Kenny",
    			"-Slant Magazine",
    			"Richard Corliss",
    			"Keith Uhlich"
    		],
    		firsts: [
    			"Keith Uhlich"
    		]
    	},
    	Unstoppable: {
    		critics: [
    			"Todd McCarthy",
    			"Kenneth Turan",
    			"Kim Morgan"
    		],
    		firsts: [
    		]
    	},
    	Catfish: {
    		critics: [
    			"Eric Kohn"
    		],
    		firsts: [
    		]
    	},
    	"Prince of Broadway": {
    		critics: [
    			"Eric Kohn",
    			"Kenneth Turan"
    		],
    		firsts: [
    		]
    	},
    	Howl: {
    		critics: [
    			"David Ehrenstein"
    		],
    		firsts: [
    		]
    	},
    	"Guy and Madeline on a Park Bench": {
    		critics: [
    			"David Ehrenstein",
    			"David Fear",
    			"J Hoberman"
    		],
    		firsts: [
    		]
    	},
    	"The City of Your Final Destination": {
    		critics: [
    			"David Ehrenstein",
    			"Nick Pinkerton"
    		],
    		firsts: [
    		]
    	},
    	"Trash Humpers": {
    		critics: [
    			"Karina Longworth"
    		],
    		firsts: [
    			"Karina Longworth"
    		]
    	},
    	Greenberg: {
    		critics: [
    			"Karina Longworth",
    			"Chuck Wilson",
    			"Michelle Orange",
    			"A.O. Scott",
    			"Richard Brody",
    			"Noel Murray",
    			"Nathan Rabin"
    		],
    		firsts: [
    		]
    	},
    	"The Red Chapel": {
    		critics: [
    			"Karina Longworth"
    		],
    		firsts: [
    		]
    	},
    	"Easier with Practice": {
    		critics: [
    			"Chuck Wilson"
    		],
    		firsts: [
    		]
    	},
    	"Breaking Upwards": {
    		critics: [
    			"Chuck Wilson"
    		],
    		firsts: [
    		]
    	},
    	"Eyes Wide Open": {
    		critics: [
    			"Kenneth Turan"
    		],
    		firsts: [
    		]
    	},
    	"Night Catches Us": {
    		critics: [
    			"Kenneth Turan",
    			"Carrie Rickey",
    			"Andrew O'Hehir",
    			"Melissa Anderson"
    		],
    		firsts: [
    		]
    	},
    	"Nora's Will": {
    		critics: [
    			"Kenneth Turan"
    		],
    		firsts: [
    		]
    	},
    	"Mademoiselle Chambon": {
    		critics: [
    			"Kenneth Turan",
    			"Mick LaSalle"
    		],
    		firsts: [
    		]
    	},
    	"White Material": {
    		critics: [
    			"Kenneth Turan",
    			"Sean Axmaker",
    			"Richard T. Jameson",
    			"Kat Murphy",
    			"James Rocchi",
    			"Stephen Holden",
    			"Stan Hall",
    			"-Reverse Shot",
    			"Melissa Anderson",
    			"J Hoberman"
    		],
    		firsts: [
    		]
    	},
    	Kisses: {
    		critics: [
    			"Kenneth Turan"
    		],
    		firsts: [
    		]
    	},
    	"A Town Called Panic": {
    		critics: [
    			"Kenneth Turan",
    			"Shawn Levy",
    			"Marc Mohan"
    		],
    		firsts: [
    		]
    	},
    	"The Secret of Kells": {
    		critics: [
    			"Kenneth Turan"
    		],
    		firsts: [
    		]
    	},
    	"The Girl with the Dragon Tattoo": {
    		critics: [
    			"Marc Doyle"
    		],
    		firsts: [
    		]
    	},
    	"The Art of the Steal": {
    		critics: [
    			"Marc Doyle"
    		],
    		firsts: [
    		]
    	},
    	"Tiny Furniture": {
    		critics: [
    			"Michelle Orange",
    			"Richard Brody"
    		],
    		firsts: [
    		]
    	},
    	"My Dog Tulip": {
    		critics: [
    			"Stephanie Zacharek",
    			"Stephen Holden",
    			"Carrie Rickey"
    		],
    		firsts: [
    		]
    	},
    	Vengeance: {
    		critics: [
    			"Stephanie Zacharek"
    		],
    		firsts: [
    		]
    	},
    	"The Tourist": {
    		critics: [
    			"Stephanie Zacharek"
    		],
    		firsts: [
    		]
    	},
    	"Eccentricities of a Blonde-Haired Girl": {
    		critics: [
    			"Sean Axmaker"
    		],
    		firsts: [
    		]
    	},
    	Mother: {
    		critics: [
    			"Jim Emerson",
    			"Kim Morgan",
    			"Frank Paiva",
    			"Anthony Lane",
    			"Noel Murray",
    			"Keith Phipps",
    			"Tasha Robinson",
    			"Scott Tobias",
    			"-Reverse Shot",
    			"Peter Hartlaub",
    			"-Slant Magazine",
    			"Dana Stevens",
    			"Michael Atkinson",
    			"Joe Morgenstern"
    		],
    		firsts: [
    		]
    	},
    	"The Killer Inside Me": {
    		critics: [
    			"Jim Emerson"
    		],
    		firsts: [
    		]
    	},
    	Hereafter: {
    		critics: [
    			"Richard T. Jameson",
    			"Mick LaSalle"
    		],
    		firsts: [
    		]
    	},
    	Bluebeard: {
    		critics: [
    			"Glenn Kenny",
    			"-Reverse Shot"
    		],
    		firsts: [
    		]
    	},
    	"Scott Pilgrim vs. The World The Social Network": {
    		critics: [
    			"Glenn Kenny"
    		],
    		firsts: [
    		]
    	},
    	Splice: {
    		critics: [
    			"Dave McCoy"
    		],
    		firsts: [
    		]
    	},
    	"Winnebago Man": {
    		critics: [
    			"Frank Paiva"
    		],
    		firsts: [
    		]
    	},
    	"Endhiran (Robot)": {
    		critics: [
    			"Frank Paiva"
    		],
    		firsts: [
    		]
    	},
    	"Joan Rivers: A Piece of Work": {
    		critics: [
    			"Frank Paiva"
    		],
    		firsts: [
    		]
    	},
    	"Remember Me": {
    		critics: [
    			"Bryan Reesman"
    		],
    		firsts: [
    		]
    	},
    	Predators: {
    		critics: [
    			"Bryan Reesman"
    		],
    		firsts: [
    		]
    	},
    	Daybreakers: {
    		critics: [
    			"Bryan Reesman"
    		],
    		firsts: [
    		]
    	},
    	"Iron Man 2": {
    		critics: [
    			"Bryan Reesman"
    		],
    		firsts: [
    		]
    	},
    	"Green Zone": {
    		critics: [
    			"Bryan Reesman",
    			"Richard Corliss"
    		],
    		firsts: [
    		]
    	},
    	"How Do You Know": {
    		critics: [
    			"Bryan Reesman"
    		],
    		firsts: [
    		]
    	},
    	"And Everything Is Going Fine": {
    		critics: [
    			"James Rocchi"
    		],
    		firsts: [
    		]
    	},
    	Cyrus: {
    		critics: [
    			"Glenn Whipp"
    		],
    		firsts: [
    		]
    	},
    	"Easy A": {
    		critics: [
    			"Mike Scott",
    			"Elizabeth Weitzman"
    		],
    		firsts: [
    		]
    	},
    	"Client 9: The Rise and Fall of Eliot Spitzer": {
    		critics: [
    			"David Edelstein"
    		],
    		firsts: [
    		]
    	},
    	"Secret Sunshine": {
    		critics: [
    			"A.O. Scott",
    			"-Reverse Shot"
    		],
    		firsts: [
    		]
    	},
    	"Around a Small Mountain": {
    		critics: [
    			"Richard Brody"
    		],
    		firsts: [
    		]
    	},
    	"The Strange Case of Angelica": {
    		critics: [
    			"Richard Brody",
    			"Keith Uhlich",
    			"J Hoberman"
    		],
    		firsts: [
    			"J Hoberman"
    		]
    	},
    	"Our Beloved Month of August": {
    		critics: [
    			"Richard Brody",
    			"-Reverse Shot"
    		],
    		firsts: [
    		]
    	},
    	"1. The Social Network": {
    		critics: [
    			"David Denby",
    			"Joe Morgenstern"
    		],
    		firsts: [
    		]
    	},
    	"Company Men": {
    		critics: [
    			"David Denby"
    		],
    		firsts: [
    		]
    	},
    	"Kawasaki's Rose": {
    		critics: [
    			"David Ansen"
    		],
    		firsts: [
    		]
    	},
    	"Police, Adjective": {
    		critics: [
    			"-NOW Magazine (Toronto)"
    		],
    		firsts: [
    		]
    	},
    	"Of Gods and Men": {
    		critics: [
    			"Philip French"
    		],
    		firsts: [
    			"Philip French"
    		]
    	},
    	"Best Worst Movie": {
    		critics: [
    			"Nathan Rabin"
    		],
    		firsts: [
    		]
    	},
    	"About Elly": {
    		critics: [
    			"Stan Hall"
    		],
    		firsts: [
    		]
    	},
    	"The Agony and Ecstasy of Phil Spector": {
    		critics: [
    			"Stan Hall"
    		],
    		firsts: [
    		]
    	},
    	"Prodigal Sons": {
    		critics: [
    			"Stan Hall"
    		],
    		firsts: [
    		]
    	},
    	"The White Ribbon": {
    		critics: [
    			"Stan Hall"
    		],
    		firsts: [
    		]
    	},
    	"Mid-August Lunch": {
    		critics: [
    			"Marc Mohan"
    		],
    		firsts: [
    		]
    	},
    	Buried: {
    		critics: [
    			"Roger Moore",
    			"Nick Pinkerton"
    		],
    		firsts: [
    		]
    	},
    	"Waiting for 'Superman'": {
    		critics: [
    			"Carrie Rickey",
    			"Richard Corliss"
    		],
    		firsts: [
    		]
    	},
    	Flipped: {
    		critics: [
    			"James Berardinelli"
    		],
    		firsts: [
    		]
    	},
    	"The Millennium Trilogy": {
    		critics: [
    			"James Berardinelli"
    		],
    		firsts: [
    		]
    	},
    	"Love and Other Drugs": {
    		critics: [
    			"James Berardinelli"
    		],
    		firsts: [
    		]
    	},
    	Poetry: {
    		critics: [
    			"Andrew O'Hehir"
    		],
    		firsts: [
    		]
    	},
    	"The Runaways": {
    		critics: [
    			"Mick LaSalle",
    			"Nick Pinkerton"
    		],
    		firsts: [
    		]
    	},
    	Lourdes: {
    		critics: [
    			"-Slant Magazine",
    			"Joshua Rothkopf",
    			"Simon Abrams",
    			"Melissa Anderson"
    		],
    		firsts: [
    		]
    	},
    	"City Island": {
    		critics: [
    			"Joe Williams"
    		],
    		firsts: [
    		]
    	},
    	"Alice in Wonderland": {
    		critics: [
    			"Steve Persall"
    		],
    		firsts: [
    		]
    	},
    	"Step Up 3-D": {
    		critics: [
    			"Keith Uhlich"
    		],
    		firsts: [
    		]
    	},
    	"You Will Meet a Tall Dark Stranger": {
    		critics: [
    			"Keith Uhlich"
    		],
    		firsts: [
    		]
    	},
    	"Have You Heard from Johannesburg?": {
    		critics: [
    			"Keith Uhlich"
    		],
    		firsts: [
    		]
    	},
    	Amer: {
    		critics: [
    			"Simon Abrams"
    		],
    		firsts: [
    		]
    	},
    	Oceans: {
    		critics: [
    			"Simon Abrams"
    		],
    		firsts: [
    		]
    	},
    	"Eccentricities of a Blonde-haired Girl": {
    		critics: [
    			"Simon Abrams"
    		],
    		firsts: [
    		]
    	},
    	Hadewijch: {
    		critics: [
    			"Simon Abrams"
    		],
    		firsts: [
    		]
    	},
    	"World on a Wire": {
    		critics: [
    			"Melissa Anderson",
    			"Nick Pinkerton"
    		],
    		firsts: [
    		]
    	},
    	"Road to Nowhere": {
    		critics: [
    			"FX Feeney"
    		],
    		firsts: [
    		]
    	},
    	"Fair Game": {
    		critics: [
    			"FX Feeney",
    			"Ann Hornaday"
    		],
    		firsts: [
    		]
    	},
    	Salt: {
    		critics: [
    			"FX Feeney"
    		],
    		firsts: [
    		]
    	},
    	"The Autobiography of Nicolae Ceausescu": {
    		critics: [
    			"J Hoberman"
    		],
    		firsts: [
    		]
    	},
    	"Inception (the last 40 minutes)": {
    		critics: [
    			"J Hoberman"
    		],
    		firsts: [
    		]
    	},
    	"Ghost Town": {
    		critics: [
    			"Nick Pinkerton"
    		],
    		firsts: [
    		]
    	},
    	"The Portugese Nun": {
    		critics: [
    			"Nick Pinkerton"
    		],
    		firsts: [
    		]
    	},
    	"The Temptation of St. Tony": {
    		critics: [
    			"Nick Pinkerton"
    		],
    		firsts: [
    		]
    	},
    	"2. The King's Speech": {
    		critics: [
    			"Joe Morgenstern"
    		],
    		firsts: [
    		]
    	},
    	"Precious Life": {
    		critics: [
    			"Joe Morgenstern"
    		],
    		firsts: [
    		]
    	},
    	"No One Knows About Persian Cats": {
    		critics: [
    			"Ann Hornaday"
    		],
    		firsts: [
    		]
    	}
    };
    var publications = {
    };
    var source = "https://www.metacritic.com/feature/film-critic-top-ten-lists";
    var data = {
    	critics: critics,
    	works: works,
    	publications: publications,
    	source: source
    };

    /* src/App.svelte generated by Svelte v3.17.1 */
    const file$4 = "src/App.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let strong;
    	let t1;
    	let a0;
    	let br0;
    	let t3;
    	let a1;
    	let br1;
    	let t5;
    	let a2;
    	let br2;
    	let t7;
    	let a3;
    	let br3;
    	let t9;
    	let current;

    	const router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			strong = element("strong");
    			strong.textContent = "Title";
    			t1 = space();
    			a0 = element("a");
    			a0.textContent = "Other Component A to see that it works going from A to B ";
    			br0 = element("br");
    			t3 = space();
    			a1 = element("a");
    			a1.textContent = "Films 2015";
    			br1 = element("br");
    			t5 = space();
    			a2 = element("a");
    			a2.textContent = "Films 2016";
    			br2 = element("br");
    			t7 = space();
    			a3 = element("a");
    			a3.textContent = "Album 2010s";
    			br3 = element("br");
    			t9 = space();
    			create_component(router.$$.fragment);
    			add_location(strong, file$4, 32, 2, 1072);
    			attr_dev(a0, "href", "#/CompA/");
    			add_location(a0, file$4, 33, 2, 1097);
    			add_location(br0, file$4, 33, 82, 1177);
    			attr_dev(a1, "href", "#/film/2015/");
    			add_location(a1, file$4, 34, 2, 1185);
    			add_location(br1, file$4, 34, 39, 1222);
    			attr_dev(a2, "href", "#/film/2016/");
    			add_location(a2, file$4, 35, 2, 1230);
    			add_location(br2, file$4, 35, 39, 1267);
    			attr_dev(a3, "href", "#/album/2010s/");
    			add_location(a3, file$4, 36, 2, 1275);
    			add_location(br3, file$4, 36, 42, 1315);
    			set_style(div, "display", "flex");
    			add_location(div, file$4, 31, 1, 1041);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, strong);
    			append_dev(div, t1);
    			append_dev(div, a0);
    			append_dev(div, br0);
    			append_dev(div, t3);
    			append_dev(div, a1);
    			append_dev(div, br1);
    			append_dev(div, t5);
    			append_dev(div, a2);
    			append_dev(div, br2);
    			append_dev(div, t7);
    			append_dev(div, a3);
    			append_dev(div, br3);
    			insert_dev(target, t9, anchor);
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t9);
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self) {
    	const routes = {
    		"/:format": ComponentA,
    		"/:format/:year": ListBreakdown,
    		"*": ComponentA
    	};

    	let jso = JSON.stringify(processListsWithRankings(data.critics));
    	let jso2;

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("jso" in $$props) jso = $$props.jso;
    		if ("jso2" in $$props) jso2 = $$props.jso2;
    	};

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
