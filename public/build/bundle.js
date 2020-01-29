
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
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

    const formatList = (smallData) => {
      const publications = {};
      const works = {};
      Object.entries(smallData).forEach(([critic, { list, publication }]) => {
        if (publications[publication]) {
           publications[publication].push(critic);
        } else {
          publications[publication] = [critic];
        }
        Object.entries(list).forEach(([work, rank]) => {
          if (works[work]) {
            works[work].critics.push(critic);
          } else {
            works[work] = { critics: [critic], firsts: [] };
          }
          if (rank === 1) {
            works[work].firsts.push(critic);
          }
        });
      });
      return {
        publications,
        works,
        critics: smallData,
      };
    };

    const format = writable('Format');
    const year = writable('Year');

    const scoringMatrix = writable(defaultScoringMatrix);

    const OPTIONS = {
      years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019],
      formats: ['film', 'album', 'tv'],
    };

    const SOURCE = {
      film: {
        2010: 'https://www.metacritic.com/feature/music-critic-top-ten-lists-best-of-2010',
        2011: 'https://www.metacritic.com/feature/music-critic-top-ten-lists-best-albums-of-2011',
        2012: 'https://www.metacritic.com/feature/top-ten-lists-best-albums-of-2012',
        2013: 'https://www.metacritic.com/feature/critics-pick-top-ten-albums-of-2013',
        2014: 'https://www.metacritic.com/feature/critics-pick-top-10-albums-of-2014',
        2015: 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2015',
        2016: 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2016',
        2017: 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2017',
        2018: 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2018',
        2019: 'https://www.metacritic.com/feature/critics-pick-top-10-best-albums-of-2019',
        '2010s': 'https://www.metacritic.com/feature/best-movies-of-the-decade-2010s',
      },
      tv: {
        2010: 'https://www.metacritic.com/feature/tv-critics-pick-ten-best-tv-shows-of-2010',
        2011: 'https://www.metacritic.com/feature/tv-critic-top-10-best-shows-of-2011',
        2012: 'https://www.metacritic.com/feature/top-ten-lists-best-tv-shows-of-2012',
        2013: 'https://www.metacritic.com/feature/tv-critics-pick-best-television-shows-of-2013',
        2014: 'https://www.metacritic.com/feature/tv-critics-pick-10-best-tv-shows-of-2014',
        2015: 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2015',
        2016: 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2016',
        2017: 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2017',
        2018: 'https://www.metacritic.com/feature/critics-pick-the-top-10-best-tv-shows-of-2018',
        2019: 'https://www.metacritic.com/feature/critics-pick-top-10-best-tv-shows-of-2019',
        '2010s': 'https://www.metacritic.com/feature/best-tv-shows-of-the-decade-2010s',
      },
      album: {
        2010: 'https://www.metacritic.com/feature/film-critic-top-ten-lists',
        2011: 'https://www.metacritic.com/feature/movie-critic-best-of-2011-top-ten-lists',
        2012: 'https://www.metacritic.com/feature/top-ten-lists-best-movies-of-2012',
        2013: 'https://www.metacritic.com/feature/film-critic-top-10-lists-best-movies-of-2013',
        2014: 'https://www.metacritic.com/feature/film-critic-top-10-lists-best-movies-of-2014',
        2015: 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2015',
        2016: 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2016',
        2017: 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2017',
        2018: 'https://www.metacritic.com/feature/film-critics-list-the-top-10-movies-of-2018',
        2019: 'https://www.metacritic.com/feature/critics-pick-top-10-best-movies-of-2019',
        '2010s': 'https://www.metacritic.com/feature/best-albums-of-the-decade-2010s',
      },
    };

    /* src/Landing.svelte generated by Svelte v3.17.1 */
    const file = "src/Landing.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (48:4) {#each OPTIONS.years as year}
    function create_each_block_1(ctx) {
    	let li;
    	let a0;
    	let t0_value = /*year*/ ctx[3] + "";
    	let t0;
    	let a0_href_value;
    	let t1;
    	let a1;
    	let t2;
    	let a1_href_value;
    	let t3;
    	let a2;
    	let t4;
    	let a2_href_value;
    	let t5;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a0 = element("a");
    			t0 = text(t0_value);
    			t1 = text(" – [");
    			a1 = element("a");
    			t2 = text("JSON");
    			t3 = text(",\n\t\t\t\t\t\t");
    			a2 = element("a");
    			t4 = text("Source");
    			t5 = text("]");
    			attr_dev(a0, "class", "tabularNumber");
    			attr_dev(a0, "href", a0_href_value = `/#/${/*format*/ ctx[0]}/${/*year*/ ctx[3]}`);
    			add_location(a0, file, 49, 6, 2867);
    			attr_dev(a1, "href", a1_href_value = `/${/*format*/ ctx[0]}/${/*year*/ ctx[3]}.json`);
    			add_location(a1, file, 51, 14, 2951);
    			attr_dev(a2, "href", a2_href_value = SOURCE[/*format*/ ctx[0]][/*year*/ ctx[3]]);
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file, 52, 6, 3003);
    			add_location(li, file, 48, 5, 2856);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a0);
    			append_dev(a0, t0);
    			append_dev(li, t1);
    			append_dev(li, a1);
    			append_dev(a1, t2);
    			append_dev(li, t3);
    			append_dev(li, a2);
    			append_dev(a2, t4);
    			append_dev(li, t5);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(48:4) {#each OPTIONS.years as year}",
    		ctx
    	});

    	return block;
    }

    // (45:2) {#each OPTIONS.formats as format}
    function create_each_block(ctx) {
    	let p;
    	let t0_value = /*format*/ ctx[0].toUpperCase() + "";
    	let t0;
    	let t1;
    	let ul;
    	let t2;
    	let each_value_1 = OPTIONS.years;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			add_location(p, file, 45, 3, 2779);
    			add_location(ul, file, 46, 3, 2812);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(ul, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*SOURCE, OPTIONS*/ 0) {
    				each_value_1 = OPTIONS.years;
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(45:2) {#each OPTIONS.formats as format}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let p0;
    	let t1;
    	let ul0;
    	let li0;
    	let t3;
    	let li1;
    	let t5;
    	let li2;
    	let t7;
    	let li3;
    	let t9;
    	let li4;
    	let t11;
    	let p1;
    	let t13;
    	let ul1;
    	let li5;
    	let strong0;
    	let t15;
    	let t16;
    	let li6;
    	let strong1;
    	let t18;
    	let t19;
    	let li7;
    	let strong2;
    	let t21;
    	let t22;
    	let li8;
    	let strong3;
    	let t24;
    	let t25;
    	let li9;
    	let strong4;
    	let t27;
    	let t28;
    	let p2;
    	let t29;
    	let br;
    	let t30;
    	let t31;
    	let p3;
    	let t33;
    	let p4;
    	let t35;
    	let div0;
    	let t36;
    	let each_value = OPTIONS.formats;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "This site collects data from a whole load of year end lists from over the last decade for the following purposes:";
    			t1 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "Gathering and presenting additional data than has been provided by other aggregators";
    			t3 = space();
    			li1 = element("li");
    			li1.textContent = "Allow custom rating metrics and modifications (e.g. omitting lists)";
    			t5 = space();
    			li2 = element("li");
    			li2.textContent = "Wuick searching of the listed entries (links only lead to searches on other sites, not direct links, sorry...)";
    			t7 = space();
    			li3 = element("li");
    			li3.textContent = "Make it easier for me to scroll down through it for some oddities";
    			t9 = space();
    			li4 = element("li");
    			li4.textContent = "Excuse to use Svelte kinda recklessly (I've done about 95% of this offline so been kinda guessing stuff from READMEs and the library source code)";
    			t11 = space();
    			p1 = element("p");
    			p1.textContent = "With respect to the data gathering, I'm mostly making it up as a go along.\n\t\tThe key one I want to do is a an aggregated list of all the end of year lists to compare directly with the decade list, I also might try and weigh things in different ways (e.g. average out critics from publications with more than one list)\n\t\tAs it stands there are a few metrics pulled from each list which I found interesting:";
    			t13 = space();
    			ul1 = element("ul");
    			li5 = element("li");
    			strong0 = element("strong");
    			strong0.textContent = "# Unique Entries";
    			t15 = text(" Obvious enough?");
    			t16 = space();
    			li6 = element("li");
    			strong1 = element("strong");
    			strong1.textContent = "Highest ranked with no #";
    			t18 = text(" Seems like a solid bet for an easy pleaser that potentially has slipped a bit under the radar? Alternatively it's just something people like to include in their list");
    			t19 = space();
    			li7 = element("li");
    			strong2 = element("strong");
    			strong2.textContent = "Lowest ranked with a #1";
    			t21 = text(" includes a validator for entries that only make a few lists. Not sure there's any one way to interpret this one.");
    			t22 = space();
    			li8 = element("li");
    			strong3 = element("strong");
    			strong3.textContent = "Highest ranked pair that share no list";
    			t24 = text(" Just a kinda cool contrast, potentially a means of signalling the biggest split in trends with mainstream critics");
    			t25 = space();
    			li9 = element("li");
    			strong4 = element("strong");
    			strong4.textContent = "Most contrarian critic";
    			t27 = text(" Person who's list matches up least with the overall weighted list, not sure there's anything of value from this, contains a validator for people who have totally obscure lists");
    			t28 = space();
    			p2 = element("p");
    			t29 = text("Other suggestions are extremely welcome, bear in mind that I only have access to the names and their rankings on lists here at the moment.");
    			br = element("br");
    			t30 = text("\n\t\tSome of the data points could undoubtedly be cleaned up but I have no real interest in trying to (e.g. `(Rock list)View metal albums list (not included in combined standings)` is obviously not a critic)");
    			t31 = space();
    			p3 = element("p");
    			p3.textContent = "Lists contain a very rudimentary set of bar charts, tbh they're probably not needed or should be weighted to prevent the list being so top heavy in terms of observable data from them. I dunno.";
    			t33 = space();
    			p4 = element("p");
    			p4.textContent = "Oh, and sorry about the obnoxious marquee element on the side.";
    			t35 = space();
    			div0 = element("div");
    			t36 = text("The full collection of lists available are\n\t\t");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(p0, file, 4, 1, 86);
    			add_location(li0, file, 7, 2, 216);
    			add_location(li1, file, 8, 2, 312);
    			add_location(li2, file, 9, 2, 391);
    			add_location(li3, file, 10, 2, 513);
    			add_location(li4, file, 11, 2, 590);
    			add_location(ul0, file, 6, 1, 209);
    			add_location(p1, file, 14, 1, 754);
    			add_location(strong0, file, 21, 6, 1185);
    			add_location(li5, file, 21, 2, 1181);
    			add_location(strong1, file, 22, 6, 1246);
    			add_location(li6, file, 22, 2, 1242);
    			add_location(strong2, file, 23, 6, 1465);
    			add_location(li7, file, 23, 2, 1461);
    			add_location(strong3, file, 24, 6, 1630);
    			add_location(li8, file, 24, 2, 1626);
    			add_location(strong4, file, 25, 6, 1811);
    			add_location(li9, file, 25, 2, 1807);
    			add_location(ul1, file, 20, 1, 1174);
    			add_location(br, file, 29, 140, 2185);
    			add_location(p2, file, 28, 1, 2041);
    			add_location(p3, file, 33, 1, 2404);
    			add_location(p4, file, 37, 1, 2611);
    			add_location(div0, file, 42, 1, 2689);
    			attr_dev(div1, "class", "Landing");
    			add_location(div1, file, 3, 0, 63);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p0);
    			append_dev(div1, t1);
    			append_dev(div1, ul0);
    			append_dev(ul0, li0);
    			append_dev(ul0, t3);
    			append_dev(ul0, li1);
    			append_dev(ul0, t5);
    			append_dev(ul0, li2);
    			append_dev(ul0, t7);
    			append_dev(ul0, li3);
    			append_dev(ul0, t9);
    			append_dev(ul0, li4);
    			append_dev(div1, t11);
    			append_dev(div1, p1);
    			append_dev(div1, t13);
    			append_dev(div1, ul1);
    			append_dev(ul1, li5);
    			append_dev(li5, strong0);
    			append_dev(li5, t15);
    			append_dev(ul1, t16);
    			append_dev(ul1, li6);
    			append_dev(li6, strong1);
    			append_dev(li6, t18);
    			append_dev(ul1, t19);
    			append_dev(ul1, li7);
    			append_dev(li7, strong2);
    			append_dev(li7, t21);
    			append_dev(ul1, t22);
    			append_dev(ul1, li8);
    			append_dev(li8, strong3);
    			append_dev(li8, t24);
    			append_dev(ul1, t25);
    			append_dev(ul1, li9);
    			append_dev(li9, strong4);
    			append_dev(li9, t27);
    			append_dev(div1, t28);
    			append_dev(div1, p2);
    			append_dev(p2, t29);
    			append_dev(p2, br);
    			append_dev(p2, t30);
    			append_dev(div1, t31);
    			append_dev(div1, p3);
    			append_dev(div1, t33);
    			append_dev(div1, p4);
    			append_dev(div1, t35);
    			append_dev(div1, div0);
    			append_dev(div0, t36);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*OPTIONS, SOURCE*/ 0) {
    				each_value = OPTIONS.formats;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
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
    			if (detaching) detach_dev(div1);
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

    class Landing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Landing",
    			options,
    			id: create_fragment$1.name
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

    /* src/Meter.svelte generated by Svelte v3.17.1 */

    const file$1 = "src/Meter.svelte";

    // (15:2) {#if icon}
    function create_if_block(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*icon*/ ctx[4]);
    			attr_dev(div, "class", "Meter__icon");
    			add_location(div, file$1, 15, 2, 321);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*icon*/ 16) set_data_dev(t, /*icon*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(15:2) {#if icon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div3;
    	let div0;

    	let t0_value = (/*value*/ ctx[0] >= 1
    	? /*value*/ ctx[0].toFixed(0)
    	: (/*value*/ ctx[0] || 0).toFixed(0)) + "";

    	let t0;
    	let t1_value = (/*key*/ ctx[2] || "") + "";
    	let t1;
    	let t2;
    	let t3;
    	let div2;
    	let div1;
    	let div1_style_value;
    	let div3_class_value;
    	let if_block = /*icon*/ ctx[4] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			attr_dev(div0, "class", "Meter__text");
    			add_location(div0, file$1, 11, 2, 197);
    			attr_dev(div1, "class", "Meter__graph__value");
    			attr_dev(div1, "style", div1_style_value = `width: ${/*value*/ ctx[0] / /*total*/ ctx[1] * 100}%`);
    			add_location(div1, file$1, 20, 4, 408);
    			attr_dev(div2, "class", "Meter__graph");
    			add_location(div2, file$1, 19, 2, 377);
    			attr_dev(div3, "class", div3_class_value = `Meter ${/*small*/ ctx[3] ? "Meter--small" : ""}`);
    			add_location(div3, file$1, 8, 0, 140);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div3, t2);
    			if (if_block) if_block.m(div3, null);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1 && t0_value !== (t0_value = (/*value*/ ctx[0] >= 1
    			? /*value*/ ctx[0].toFixed(0)
    			: (/*value*/ ctx[0] || 0).toFixed(0)) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*key*/ 4 && t1_value !== (t1_value = (/*key*/ ctx[2] || "") + "")) set_data_dev(t1, t1_value);

    			if (/*icon*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div3, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*value, total*/ 3 && div1_style_value !== (div1_style_value = `width: ${/*value*/ ctx[0] / /*total*/ ctx[1] * 100}%`)) {
    				attr_dev(div1, "style", div1_style_value);
    			}

    			if (dirty & /*small*/ 8 && div3_class_value !== (div3_class_value = `Meter ${/*small*/ ctx[3] ? "Meter--small" : ""}`)) {
    				attr_dev(div3, "class", div3_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
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

    function instance($$self, $$props, $$invalidate) {
    	let { value } = $$props;
    	let { total } = $$props;
    	let { key = null } = $$props;
    	let { small = false } = $$props;
    	let { icon = false } = $$props;
    	const writable_props = ["value", "total", "key", "small", "icon"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Meter> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("total" in $$props) $$invalidate(1, total = $$props.total);
    		if ("key" in $$props) $$invalidate(2, key = $$props.key);
    		if ("small" in $$props) $$invalidate(3, small = $$props.small);
    		if ("icon" in $$props) $$invalidate(4, icon = $$props.icon);
    	};

    	$$self.$capture_state = () => {
    		return { value, total, key, small, icon };
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("total" in $$props) $$invalidate(1, total = $$props.total);
    		if ("key" in $$props) $$invalidate(2, key = $$props.key);
    		if ("small" in $$props) $$invalidate(3, small = $$props.small);
    		if ("icon" in $$props) $$invalidate(4, icon = $$props.icon);
    	};

    	return [value, total, key, small, icon];
    }

    class Meter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment$2, safe_not_equal, {
    			value: 0,
    			total: 1,
    			key: 2,
    			small: 3,
    			icon: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Meter",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Meter> was created without expected prop 'value'");
    		}

    		if (/*total*/ ctx[1] === undefined && !("total" in props)) {
    			console.warn("<Meter> was created without expected prop 'total'");
    		}
    	}

    	get value() {
    		throw new Error("<Meter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Meter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get total() {
    		throw new Error("<Meter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set total(value) {
    		throw new Error("<Meter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<Meter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Meter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get small() {
    		throw new Error("<Meter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Meter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Meter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Meter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ListEntry.svelte generated by Svelte v3.17.1 */
    const file$2 = "src/ListEntry.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i].site;
    	child_ctx[16] = list[i].link;
    	child_ctx[17] = list[i].modify;
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (43:10) {#if i !== 0}
    function create_if_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("|");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(43:10) {#if i !== 0}",
    		ctx
    	});

    	return block;
    }

    // (42:8) {#each formats[format] as { site, link, modify }
    function create_each_block$1(ctx) {
    	let t0;
    	let a;
    	let t1_value = /*site*/ ctx[15] + "";
    	let t1;
    	let a_href_value;
    	let t2_value = " " + "";
    	let t2;
    	let if_block = /*i*/ ctx[19] !== 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			a = element("a");
    			t1 = text(t1_value);
    			t2 = text(t2_value);

    			attr_dev(a, "href", a_href_value = `${/*link*/ ctx[16]}${/*modify*/ ctx[17]
			? /*modify*/ ctx[17](/*title*/ ctx[1])
			: /*title*/ ctx[1]}`);

    			attr_dev(a, "target", "_blank");
    			add_location(a, file$2, 45, 10, 1654);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t1);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*format*/ 128 && t1_value !== (t1_value = /*site*/ ctx[15] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*format, title*/ 130 && a_href_value !== (a_href_value = `${/*link*/ ctx[16]}${/*modify*/ ctx[17]
			? /*modify*/ ctx[17](/*title*/ ctx[1])
			: /*title*/ ctx[1]}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(42:8) {#each formats[format] as { site, link, modify }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let li;
    	let div3;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let strong;
    	let t2;
    	let t3;
    	let ul;
    	let t4;
    	let div2;
    	let t5;
    	let t6;
    	let li_id_value;
    	let current;
    	let each_value = /*formats*/ ctx[8][/*format*/ ctx[7]];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const meter0 = new Meter({
    			props: {
    				value: /*points*/ ctx[3],
    				total: /*highestPoints*/ ctx[4],
    				key: "pts"
    			},
    			$$inline: true
    		});

    	const meter1 = new Meter({
    			props: {
    				value: /*entry*/ ctx[2].firsts.length,
    				total: /*mostFirsts*/ ctx[5],
    				small: true,
    				icon: "🏆"
    			},
    			$$inline: true
    		});

    	const meter2 = new Meter({
    			props: {
    				value: /*entry*/ ctx[2].critics.length,
    				total: /*mostLists*/ ctx[6],
    				small: true,
    				icon: "📋"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(/*placement*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			strong = element("strong");
    			t2 = text(/*title*/ ctx[1]);
    			t3 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div2 = element("div");
    			create_component(meter0.$$.fragment);
    			t5 = space();
    			create_component(meter1.$$.fragment);
    			t6 = space();
    			create_component(meter2.$$.fragment);
    			attr_dev(div0, "class", "ListEntry__placement");
    			add_location(div0, file$2, 37, 4, 1377);
    			add_location(strong, file$2, 39, 6, 1470);
    			attr_dev(ul, "class", "ListEntry__links");
    			add_location(ul, file$2, 40, 6, 1501);
    			attr_dev(div1, "class", "ListEntry__title");
    			add_location(div1, file$2, 38, 4, 1433);
    			attr_dev(div2, "class", "ListEntry__stats");
    			add_location(div2, file$2, 49, 4, 1782);
    			attr_dev(div3, "class", "ListEntry__data");
    			add_location(div3, file$2, 36, 2, 1343);
    			attr_dev(li, "class", "ListEntry");
    			attr_dev(li, "id", li_id_value = /*title*/ ctx[1].split(" ").join("_").replace(/[\[\]]/));
    			add_location(li, file$2, 35, 0, 1268);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div3);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, strong);
    			append_dev(strong, t2);
    			append_dev(div1, t3);
    			append_dev(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			mount_component(meter0, div2, null);
    			append_dev(div2, t5);
    			mount_component(meter1, div2, null);
    			append_dev(div2, t6);
    			mount_component(meter2, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*placement*/ 1) set_data_dev(t0, /*placement*/ ctx[0]);
    			if (!current || dirty & /*title*/ 2) set_data_dev(t2, /*title*/ ctx[1]);

    			if (dirty & /*formats, format, title*/ 386) {
    				each_value = /*formats*/ ctx[8][/*format*/ ctx[7]];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const meter0_changes = {};
    			if (dirty & /*points*/ 8) meter0_changes.value = /*points*/ ctx[3];
    			if (dirty & /*highestPoints*/ 16) meter0_changes.total = /*highestPoints*/ ctx[4];
    			meter0.$set(meter0_changes);
    			const meter1_changes = {};
    			if (dirty & /*entry*/ 4) meter1_changes.value = /*entry*/ ctx[2].firsts.length;
    			if (dirty & /*mostFirsts*/ 32) meter1_changes.total = /*mostFirsts*/ ctx[5];
    			meter1.$set(meter1_changes);
    			const meter2_changes = {};
    			if (dirty & /*entry*/ 4) meter2_changes.value = /*entry*/ ctx[2].critics.length;
    			if (dirty & /*mostLists*/ 64) meter2_changes.total = /*mostLists*/ ctx[6];
    			meter2.$set(meter2_changes);

    			if (!current || dirty & /*title*/ 2 && li_id_value !== (li_id_value = /*title*/ ctx[1].split(" ").join("_").replace(/[\[\]]/))) {
    				attr_dev(li, "id", li_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(meter0.$$.fragment, local);
    			transition_in(meter1.$$.fragment, local);
    			transition_in(meter2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(meter0.$$.fragment, local);
    			transition_out(meter1.$$.fragment, local);
    			transition_out(meter2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_each(each_blocks, detaching);
    			destroy_component(meter0);
    			destroy_component(meter1);
    			destroy_component(meter2);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { placement } = $$props;
    	let { title } = $$props;
    	let { entry } = $$props;
    	let { points } = $$props;
    	let { highestPoints } = $$props;
    	let { mostFirsts } = $$props;
    	let { mostLists } = $$props;
    	let { format } = $$props;
    	let listData = [];
    	let yearData;
    	let derivedData;

    	const film = [
    		{
    			site: "IMDb",
    			link: "https://www.imdb.com/find?s=tt&q="
    		},
    		{
    			site: "RT",
    			link: "https://www.rottentomatoes.com/search/?search="
    		},
    		{
    			site: "Letterboxd",
    			link: "https://letterboxd.com/search/films/"
    		}
    	];

    	const album = [
    		{
    			site: "Spotify",
    			link: "https://open.spotify.com/search/",
    			modify: v => v.replace(/\s/g, "%20").replace(/by/g, "")
    		},
    		{
    			site: "RYM",
    			link: "https://rateyouralbum.com/search?searchtype=l&searchterm=",
    			modify: v => v.replace(/\s/g, "+").replace(/by/g, "")
    		},
    		{
    			site: "Youtube",
    			link: "https://www.youtube.com/results?search_query=",
    			modify: v => v.replace(/\s/g, "%20")
    		}
    	];

    	const tv = [
    		{
    			site: "IMDb",
    			link: "https://www.imdb.com/find?s=tt&q=",
    			modify: v => v.replace(/\(.*\)/g, "%20")
    		},
    		{
    			site: "RT",
    			link: "https://www.rottentomatoes.com/search/?search=",
    			modify: v => v.replace(/\(.*\)/g, "%20")
    		}
    	];

    	const formats = { film, album, tv };

    	const writable_props = [
    		"placement",
    		"title",
    		"entry",
    		"points",
    		"highestPoints",
    		"mostFirsts",
    		"mostLists",
    		"format"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ListEntry> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("placement" in $$props) $$invalidate(0, placement = $$props.placement);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("entry" in $$props) $$invalidate(2, entry = $$props.entry);
    		if ("points" in $$props) $$invalidate(3, points = $$props.points);
    		if ("highestPoints" in $$props) $$invalidate(4, highestPoints = $$props.highestPoints);
    		if ("mostFirsts" in $$props) $$invalidate(5, mostFirsts = $$props.mostFirsts);
    		if ("mostLists" in $$props) $$invalidate(6, mostLists = $$props.mostLists);
    		if ("format" in $$props) $$invalidate(7, format = $$props.format);
    	};

    	$$self.$capture_state = () => {
    		return {
    			placement,
    			title,
    			entry,
    			points,
    			highestPoints,
    			mostFirsts,
    			mostLists,
    			format,
    			listData,
    			yearData,
    			derivedData
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("placement" in $$props) $$invalidate(0, placement = $$props.placement);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("entry" in $$props) $$invalidate(2, entry = $$props.entry);
    		if ("points" in $$props) $$invalidate(3, points = $$props.points);
    		if ("highestPoints" in $$props) $$invalidate(4, highestPoints = $$props.highestPoints);
    		if ("mostFirsts" in $$props) $$invalidate(5, mostFirsts = $$props.mostFirsts);
    		if ("mostLists" in $$props) $$invalidate(6, mostLists = $$props.mostLists);
    		if ("format" in $$props) $$invalidate(7, format = $$props.format);
    		if ("listData" in $$props) listData = $$props.listData;
    		if ("yearData" in $$props) yearData = $$props.yearData;
    		if ("derivedData" in $$props) derivedData = $$props.derivedData;
    	};

    	return [
    		placement,
    		title,
    		entry,
    		points,
    		highestPoints,
    		mostFirsts,
    		mostLists,
    		format,
    		formats
    	];
    }

    class ListEntry extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$3, safe_not_equal, {
    			placement: 0,
    			title: 1,
    			entry: 2,
    			points: 3,
    			highestPoints: 4,
    			mostFirsts: 5,
    			mostLists: 6,
    			format: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListEntry",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*placement*/ ctx[0] === undefined && !("placement" in props)) {
    			console.warn("<ListEntry> was created without expected prop 'placement'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<ListEntry> was created without expected prop 'title'");
    		}

    		if (/*entry*/ ctx[2] === undefined && !("entry" in props)) {
    			console.warn("<ListEntry> was created without expected prop 'entry'");
    		}

    		if (/*points*/ ctx[3] === undefined && !("points" in props)) {
    			console.warn("<ListEntry> was created without expected prop 'points'");
    		}

    		if (/*highestPoints*/ ctx[4] === undefined && !("highestPoints" in props)) {
    			console.warn("<ListEntry> was created without expected prop 'highestPoints'");
    		}

    		if (/*mostFirsts*/ ctx[5] === undefined && !("mostFirsts" in props)) {
    			console.warn("<ListEntry> was created without expected prop 'mostFirsts'");
    		}

    		if (/*mostLists*/ ctx[6] === undefined && !("mostLists" in props)) {
    			console.warn("<ListEntry> was created without expected prop 'mostLists'");
    		}

    		if (/*format*/ ctx[7] === undefined && !("format" in props)) {
    			console.warn("<ListEntry> was created without expected prop 'format'");
    		}
    	}

    	get placement() {
    		throw new Error("<ListEntry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placement(value) {
    		throw new Error("<ListEntry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ListEntry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ListEntry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get entry() {
    		throw new Error("<ListEntry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set entry(value) {
    		throw new Error("<ListEntry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get points() {
    		throw new Error("<ListEntry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set points(value) {
    		throw new Error("<ListEntry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highestPoints() {
    		throw new Error("<ListEntry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highestPoints(value) {
    		throw new Error("<ListEntry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mostFirsts() {
    		throw new Error("<ListEntry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mostFirsts(value) {
    		throw new Error("<ListEntry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mostLists() {
    		throw new Error("<ListEntry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mostLists(value) {
    		throw new Error("<ListEntry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get format() {
    		throw new Error("<ListEntry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set format(value) {
    		throw new Error("<ListEntry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/List.svelte generated by Svelte v3.17.1 */

    const { Object: Object_1 } = globals;
    const file$3 = "src/List.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i][0];
    	child_ctx[7] = list[i][1];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (12:2) {#each listData as [ key, points ], i}
    function create_each_block$2(ctx) {
    	let current;

    	const listentry = new ListEntry({
    			props: {
    				placement: /*i*/ ctx[9] + 1,
    				title: /*key*/ ctx[6],
    				points: /*points*/ ctx[7],
    				entry: /*yearData*/ ctx[1].works[/*key*/ ctx[6]],
    				highestPoints: /*listData*/ ctx[0][0][1],
    				mostLists: /*yearData*/ ctx[1].works[/*mostLists*/ ctx[4]].critics.length,
    				mostFirsts: /*yearData*/ ctx[1].works[/*mostFirsts*/ ctx[3]].firsts.length,
    				format: /*format*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(listentry.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(listentry, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const listentry_changes = {};
    			if (dirty & /*listData*/ 1) listentry_changes.title = /*key*/ ctx[6];
    			if (dirty & /*listData*/ 1) listentry_changes.points = /*points*/ ctx[7];
    			if (dirty & /*yearData, listData*/ 3) listentry_changes.entry = /*yearData*/ ctx[1].works[/*key*/ ctx[6]];
    			if (dirty & /*listData*/ 1) listentry_changes.highestPoints = /*listData*/ ctx[0][0][1];
    			if (dirty & /*yearData, mostLists*/ 18) listentry_changes.mostLists = /*yearData*/ ctx[1].works[/*mostLists*/ ctx[4]].critics.length;
    			if (dirty & /*yearData, mostFirsts*/ 10) listentry_changes.mostFirsts = /*yearData*/ ctx[1].works[/*mostFirsts*/ ctx[3]].firsts.length;
    			if (dirty & /*format*/ 4) listentry_changes.format = /*format*/ ctx[2];
    			listentry.$set(listentry_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listentry.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listentry.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listentry, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(12:2) {#each listData as [ key, points ], i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let ol;
    	let current;
    	let each_value = /*listData*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ol, "class", "List");
    			add_location(ol, file$3, 10, 0, 382);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ol, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*listData, yearData, mostLists, mostFirsts, format*/ 31) {
    				each_value = /*listData*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ol, null);
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
    			if (detaching) detach_dev(ol);
    			destroy_each(each_blocks, detaching);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { listData } = $$props;
    	let { yearData } = $$props;
    	let { format } = $$props;
    	const writable_props = ["listData", "yearData", "format"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("listData" in $$props) $$invalidate(0, listData = $$props.listData);
    		if ("yearData" in $$props) $$invalidate(1, yearData = $$props.yearData);
    		if ("format" in $$props) $$invalidate(2, format = $$props.format);
    	};

    	$$self.$capture_state = () => {
    		return {
    			listData,
    			yearData,
    			format,
    			iterativeWorks,
    			mostFirsts,
    			mostLists
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("listData" in $$props) $$invalidate(0, listData = $$props.listData);
    		if ("yearData" in $$props) $$invalidate(1, yearData = $$props.yearData);
    		if ("format" in $$props) $$invalidate(2, format = $$props.format);
    		if ("iterativeWorks" in $$props) $$invalidate(5, iterativeWorks = $$props.iterativeWorks);
    		if ("mostFirsts" in $$props) $$invalidate(3, mostFirsts = $$props.mostFirsts);
    		if ("mostLists" in $$props) $$invalidate(4, mostLists = $$props.mostLists);
    	};

    	let iterativeWorks;
    	let mostFirsts;
    	let mostLists;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*yearData*/ 2) {
    			 $$invalidate(5, iterativeWorks = Object.entries(yearData.works));
    		}

    		if ($$self.$$.dirty & /*iterativeWorks*/ 32) {
    			 $$invalidate(3, mostFirsts = iterativeWorks.sort((a, b) => b[1].firsts.length - a[1].firsts.length)[0][0]);
    		}

    		if ($$self.$$.dirty & /*iterativeWorks*/ 32) {
    			 $$invalidate(4, mostLists = iterativeWorks.sort((a, b) => b[1].critics.length - a[1].critics.length)[0][0]);
    		}
    	};

    	return [listData, yearData, format, mostFirsts, mostLists];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$4, safe_not_equal, { listData: 0, yearData: 1, format: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*listData*/ ctx[0] === undefined && !("listData" in props)) {
    			console.warn("<List> was created without expected prop 'listData'");
    		}

    		if (/*yearData*/ ctx[1] === undefined && !("yearData" in props)) {
    			console.warn("<List> was created without expected prop 'yearData'");
    		}

    		if (/*format*/ ctx[2] === undefined && !("format" in props)) {
    			console.warn("<List> was created without expected prop 'format'");
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

    	get format() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set format(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DataBlock.svelte generated by Svelte v3.17.1 */

    const file$4 = "src/DataBlock.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (12:4) {:else}
    function create_else_block_1(ctx) {
    	let t_value = /*entry*/ ctx[0].data + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && t_value !== (t_value = /*entry*/ ctx[0].data + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(12:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:4) {#if Array.isArray(entry.data)}
    function create_if_block_6(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*entry*/ ctx[0].data;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*entry*/ 1) {
    				each_value_1 = /*entry*/ ctx[0].data;
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(8:4) {#if Array.isArray(entry.data)}",
    		ctx
    	});

    	return block;
    }

    // (9:6) {#each entry.data as v}
    function create_each_block_1$1(ctx) {
    	let t_value = /*v*/ ctx[1] + "";
    	let t;
    	let br;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    			br = element("br");
    			add_location(br, file$4, 9, 11, 203);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && t_value !== (t_value = /*v*/ ctx[1] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(9:6) {#each entry.data as v}",
    		ctx
    	});

    	return block;
    }

    // (16:2) {#if entry.descriptor}
    function create_if_block_5(ctx) {
    	let em;
    	let t_value = /*entry*/ ctx[0].descriptor + "";
    	let t;

    	const block = {
    		c: function create() {
    			em = element("em");
    			t = text(t_value);
    			attr_dev(em, "class", "DataBlock__descriptor");
    			add_location(em, file$4, 16, 4, 306);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, em, anchor);
    			append_dev(em, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && t_value !== (t_value = /*entry*/ ctx[0].descriptor + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(em);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(16:2) {#if entry.descriptor}",
    		ctx
    	});

    	return block;
    }

    // (19:2) {#if entry.link}
    function create_if_block_4(ctx) {
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("_");
    			attr_dev(a, "href", a_href_value = /*entry*/ ctx[0].link);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$4, 19, 4, 397);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && a_href_value !== (a_href_value = /*entry*/ ctx[0].link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(19:2) {#if entry.link}",
    		ctx
    	});

    	return block;
    }

    // (22:2) {#if entry.validator && entry.validator.data !== entry.data}
    function create_if_block$2(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*entry*/ ctx[0].validator.text + "";
    	let t1;
    	let t2;
    	let show_if;
    	let t3;
    	let t4;
    	let t5;

    	function select_block_type_1(ctx, dirty) {
    		if (show_if == null || dirty & /*entry*/ 1) show_if = !!Array.isArray(/*entry*/ ctx[0].validator.data);
    		if (show_if) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx, -1);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*entry*/ ctx[0].validator.descriptor && create_if_block_2(ctx);
    	let if_block2 = /*entry*/ ctx[0].validator.link && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("[\n        ");
    			t1 = text(t1_value);
    			t2 = text(":\n        ");
    			if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			if (if_block2) if_block2.c();
    			t5 = text("\n      ]");
    			attr_dev(div, "class", "DataBlock__validator");
    			add_location(div, file$4, 22, 4, 515);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			if_block0.m(div, null);
    			append_dev(div, t3);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t4);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && t1_value !== (t1_value = /*entry*/ ctx[0].validator.text + "")) set_data_dev(t1, t1_value);

    			if (current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t3);
    				}
    			}

    			if (/*entry*/ ctx[0].validator.descriptor) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div, t4);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*entry*/ ctx[0].validator.link) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(div, t5);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(22:2) {#if entry.validator && entry.validator.data !== entry.data}",
    		ctx
    	});

    	return block;
    }

    // (30:8) {:else}
    function create_else_block(ctx) {
    	let t_value = /*entry*/ ctx[0].validator.data + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && t_value !== (t_value = /*entry*/ ctx[0].validator.data + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(30:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (26:8) {#if Array.isArray(entry.validator.data)}
    function create_if_block_3(ctx) {
    	let each_1_anchor;
    	let each_value = /*entry*/ ctx[0].data;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*entry*/ 1) {
    				each_value = /*entry*/ ctx[0].data;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(26:8) {#if Array.isArray(entry.validator.data)}",
    		ctx
    	});

    	return block;
    }

    // (27:10) {#each entry.data as v}
    function create_each_block$3(ctx) {
    	let t_value = /*v*/ ctx[1] + "";
    	let t;
    	let br;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    			br = element("br");
    			add_location(br, file$4, 27, 15, 689);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && t_value !== (t_value = /*v*/ ctx[1] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(27:10) {#each entry.data as v}",
    		ctx
    	});

    	return block;
    }

    // (33:8) {#if entry.validator.descriptor}
    function create_if_block_2(ctx) {
    	let em;
    	let t_value = /*entry*/ ctx[0].validator.descriptor + "";
    	let t;

    	const block = {
    		c: function create() {
    			em = element("em");
    			t = text(t_value);
    			attr_dev(em, "class", "DataBlock__descriptor");
    			add_location(em, file$4, 33, 10, 828);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, em, anchor);
    			append_dev(em, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && t_value !== (t_value = /*entry*/ ctx[0].validator.descriptor + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(em);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(33:8) {#if entry.validator.descriptor}",
    		ctx
    	});

    	return block;
    }

    // (36:8) {#if entry.validator.link}
    function create_if_block_1(ctx) {
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("_");
    			attr_dev(a, "href", a_href_value = /*entry*/ ctx[0].validator.link);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$4, 36, 10, 955);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && a_href_value !== (a_href_value = /*entry*/ ctx[0].validator.link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(36:8) {#if entry.validator.link}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let dt;
    	let t0_value = /*entry*/ ctx[0].title + "";
    	let t0;
    	let t1;
    	let dd;
    	let strong;
    	let show_if;
    	let t2;
    	let t3;
    	let t4;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*entry*/ 1) show_if = !!Array.isArray(/*entry*/ ctx[0].data);
    		if (show_if) return create_if_block_6;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*entry*/ ctx[0].descriptor && create_if_block_5(ctx);
    	let if_block2 = /*entry*/ ctx[0].link && create_if_block_4(ctx);
    	let if_block3 = /*entry*/ ctx[0].validator && /*entry*/ ctx[0].validator.data !== /*entry*/ ctx[0].data && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			dt = element("dt");
    			t0 = text(t0_value);
    			t1 = space();
    			dd = element("dd");
    			strong = element("strong");
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			t4 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(dt, "class", "DataBlock__tag");
    			add_location(dt, file$4, 4, 0, 40);
    			add_location(strong, file$4, 6, 2, 117);
    			attr_dev(dd, "class", "DataBlock__data");
    			add_location(dd, file$4, 5, 0, 86);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dt, anchor);
    			append_dev(dt, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, dd, anchor);
    			append_dev(dd, strong);
    			if_block0.m(strong, null);
    			append_dev(dd, t2);
    			if (if_block1) if_block1.m(dd, null);
    			append_dev(dd, t3);
    			if (if_block2) if_block2.m(dd, null);
    			append_dev(dd, t4);
    			if (if_block3) if_block3.m(dd, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*entry*/ 1 && t0_value !== (t0_value = /*entry*/ ctx[0].title + "")) set_data_dev(t0, t0_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(strong, null);
    				}
    			}

    			if (/*entry*/ ctx[0].descriptor) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					if_block1.m(dd, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*entry*/ ctx[0].link) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_4(ctx);
    					if_block2.c();
    					if_block2.m(dd, t4);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*entry*/ ctx[0].validator && /*entry*/ ctx[0].validator.data !== /*entry*/ ctx[0].data) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$2(ctx);
    					if_block3.c();
    					if_block3.m(dd, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dt);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(dd);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
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

    function instance$3($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$3, create_fragment$5, safe_not_equal, { entry: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataBlock",
    			options,
    			id: create_fragment$5.name
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

    /* src/DataList.svelte generated by Svelte v3.17.1 */

    const { Object: Object_1$1 } = globals;
    const file$5 = "src/DataList.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (51:2) {#each dataList as entry   }
    function create_each_block$4(ctx) {
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
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(51:2) {#each dataList as entry   }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let dl;
    	let current;
    	let each_value = /*dataList*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
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

    			attr_dev(dl, "class", "DataList");
    			add_location(dl, file$5, 49, 0, 2021);
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
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { yearData } = $$props;
    	let { listData } = $$props;
    	let derivedData;
    	let dataList = [];

    	const getDerivedData = () => {
    		derivedData = deriveAdditionalDataFromProcessedList(listData, yearData);

    		$$invalidate(0, dataList = [
    			{
    				title: "# Lists aggregated:",
    				data: Object.keys(yearData.critics).length
    			},
    			{
    				title: "# Publications",
    				data: Object.keys(yearData.publications).length
    			},
    			{
    				title: "# Unique entries",
    				data: Object.keys(yearData.works).length
    			},
    			{
    				title: "Highest ranked with no #1",
    				data: derivedData.biggestLoser
    			},
    			{
    				title: "Lowest ranked with a #1",
    				data: derivedData.smallestWinner,
    				validator: {
    					text: "in more than 2 lists",
    					data: derivedData.smallestWinnerValidator
    				}
    			},
    			{
    				title: "Highest ranked pair that share no lists",
    				data: derivedData.divisivePair
    			},
    			{
    				title: "Most contrarian critic (lowest points for overall list)",
    				data: derivedData.mostContrarianCritic.name,
    				descriptors: `with ${derivedData.mostContrarianCritic.score}
    against an average of ${(derivedData.mostContrarianCritic.totalVal / Object.keys(yearData.critics).length).toFixed(1)}`,
    				link: yearData.critics[derivedData.mostContrarianCritic.name].link,
    				validator: {
    					text: "Omitting lists with 3+ unique entries",
    					data: derivedData.mostContrarianCriticValidator.name,
    					descriptors: `with ${derivedData.mostContrarianCriticValidator.score}
    against an average of ${(derivedData.mostContrarianCriticValidator.totalVal / Object.keys(yearData.critics).length).toFixed(1)}`,
    					link: yearData.critics[derivedData.mostContrarianCriticValidator.name].link
    				}
    			}
    		]);
    	};

    	beforeUpdate(getDerivedData);
    	const writable_props = ["yearData", "listData"];

    	Object_1$1.keys($$props).forEach(key => {
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
    		init(this, options, instance$4, create_fragment$6, safe_not_equal, { yearData: 1, listData: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataList",
    			options,
    			id: create_fragment$6.name
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

    const { Error: Error_1 } = globals;
    const file$6 = "src/ListBreakdown.svelte";

    // (70:2) {#if derivedData && yearData && listData}
    function create_if_block_1$1(ctx) {
    	let current;

    	const datalist = new DataList({
    			props: {
    				derivedData: /*derivedData*/ ctx[3],
    				yearData: /*yearData*/ ctx[2],
    				listData: /*listData*/ ctx[1]
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
    			if (dirty & /*derivedData*/ 8) datalist_changes.derivedData = /*derivedData*/ ctx[3];
    			if (dirty & /*yearData*/ 4) datalist_changes.yearData = /*yearData*/ ctx[2];
    			if (dirty & /*listData*/ 2) datalist_changes.listData = /*listData*/ ctx[1];
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(70:2) {#if derivedData && yearData && listData}",
    		ctx
    	});

    	return block;
    }

    // (79:2) {:else}
    function create_else_block$1(ctx) {
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(79:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (77:2) {#if listData && listData.length && yearData}
    function create_if_block$3(ctx) {
    	let current;

    	const list = new List({
    			props: {
    				listData: /*listData*/ ctx[1],
    				yearData: /*yearData*/ ctx[2],
    				format: /*params*/ ctx[0].format
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
    			if (dirty & /*listData*/ 2) list_changes.listData = /*listData*/ ctx[1];
    			if (dirty & /*yearData*/ 4) list_changes.yearData = /*yearData*/ ctx[2];
    			if (dirty & /*params*/ 1) list_changes.format = /*params*/ ctx[0].format;
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(77:2) {#if listData && listData.length && yearData}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let if_block0 = /*derivedData*/ ctx[3] && /*yearData*/ ctx[2] && /*listData*/ ctx[1] && create_if_block_1$1(ctx);
    	const if_block_creators = [create_if_block$3, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*listData*/ ctx[1] && /*listData*/ ctx[1].length && /*yearData*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if_block1.c();
    			attr_dev(div, "class", "ListBreakdown");
    			add_location(div, file$6, 68, 0, 2167);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*derivedData*/ ctx[3] && /*yearData*/ ctx[2] && /*listData*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t);
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
    				if_block1.m(div, null);
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
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { params = params } = $$props;
    	let data;
    	let fileName = `/data/${params.year}-${params.format}.json`;
    	let matrix_value;

    	const processFile = json => {
    		$$invalidate(2, yearData = formatList(json));
    		$$invalidate(1, listData = processListsWithRankings(json, matrix_value));
    		$$invalidate(3, derivedData = deriveAdditionalDataFromProcessedList(listData, yearData));
    		return { yearData, listData, derivedData };
    	};

    	const getJsonData = async () => {
    		year.update(() => params.year);
    		format.update(() => params.format);
    		const localStorageItem = `${params.year}-${params.format}`;
    		const priorData = window.localStorage.getItem(localStorageItem);

    		if (priorData) {
    			return processFile(JSON.parse(priorData));
    		}

    		const resp = await fetch(fileName);
    		const json = await resp.json();

    		if (resp.ok) {
    			window.localStorage.setItem(`${params.year}-${params.format}`, JSON.stringify(json));
    			window.localStorage.setItem("latest", Date.now());
    			return processFile(json);
    		} else {
    			throw new Error("aaag");
    		}
    	};

    	afterUpdate(getJsonData);

    	scoringMatrix.subscribe(value => {
    		matrix_value = value;
    		getJsonData();
    	});

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ListBreakdown> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => {
    		return {
    			params,
    			data,
    			fileName,
    			matrix_value,
    			listData,
    			yearData,
    			derivedData
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("data" in $$props) data = $$props.data;
    		if ("fileName" in $$props) fileName = $$props.fileName;
    		if ("matrix_value" in $$props) matrix_value = $$props.matrix_value;
    		if ("listData" in $$props) $$invalidate(1, listData = $$props.listData);
    		if ("yearData" in $$props) $$invalidate(2, yearData = $$props.yearData);
    		if ("derivedData" in $$props) $$invalidate(3, derivedData = $$props.derivedData);
    	};

    	let listData;
    	let yearData;
    	let derivedData;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*params*/ 1) {
    			 fileName = `/data/${params.year}-${params.format}.json`;
    		}
    	};

    	 $$invalidate(1, listData = null);
    	 $$invalidate(2, yearData = null);
    	 $$invalidate(3, derivedData = null);
    	return [params, listData, yearData, derivedData];
    }

    class ListBreakdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$7, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListBreakdown",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get params() {
    		throw new Error_1("<ListBreakdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error_1("<ListBreakdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Modal.svelte generated by Svelte v3.17.1 */

    const file$7 = "src/Modal.svelte";

    function create_fragment$8(ctx) {
    	let div1;
    	let div0;
    	let button;
    	let t1;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			button = element("button");
    			button.textContent = "X";
    			t1 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", "Modal__close");
    			add_location(button, file$7, 6, 4, 91);
    			attr_dev(div0, "class", "Modal");
    			add_location(div0, file$7, 5, 2, 67);
    			attr_dev(div1, "class", "Modal-bg");
    			add_location(div1, file$7, 4, 0, 42);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(div0, t1);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    			dispose = listen_dev(button, "click", /*onclose*/ ctx[0], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { onclose } = $$props;
    	const writable_props = ["onclose"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("onclose" in $$props) $$invalidate(0, onclose = $$props.onclose);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { onclose };
    	};

    	$$self.$inject_state = $$props => {
    		if ("onclose" in $$props) $$invalidate(0, onclose = $$props.onclose);
    	};

    	return [onclose, $$scope, $$slots];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$8, safe_not_equal, { onclose: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*onclose*/ ctx[0] === undefined && !("onclose" in props)) {
    			console.warn("<Modal> was created without expected prop 'onclose'");
    		}
    	}

    	get onclose() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onclose(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
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

    const { Error: Error_1$1, Object: Object_1$2 } = globals;

    function create_fragment$9(ctx) {
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
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
    		id: create_fragment$9.name,
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

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	setTimeout(
    		() => {
    			window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    		},
    		0
    	);
    }

    function instance$7($$self, $$props, $$invalidate) {
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

    	Object_1$2.keys($$props).forEach(key => {
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
    		init(this, options, instance$7, create_fragment$9, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get routes() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
    var smallData = {
    	critics: critics,
    	works: works,
    	publications: publications,
    	source: source
    };

    /* src/App.svelte generated by Svelte v3.17.1 */
    const file$8 = "src/App.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i].link;
    	child_ctx[16] = list[i].text;
    	child_ctx[18] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    // (78:3) {#each ['Year', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2010s'] as year}
    function create_each_block_3(ctx) {
    	let option;
    	let t0;
    	let t1;
    	let option_value_value;
    	let option_disabled_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(/*year*/ ctx[22]);
    			t1 = space();
    			option.__value = option_value_value = /*year*/ ctx[22];
    			option.value = option.__value;
    			option.disabled = option_disabled_value = /*year*/ ctx[22] === "Year";
    			add_location(option, file$8, 78, 4, 2187);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(78:3) {#each ['Year', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2010s'] as year}",
    		ctx
    	});

    	return block;
    }

    // (85:3) {#each ['Format', 'film', 'tv', 'album'] as format}
    function create_each_block_2(ctx) {
    	let option;
    	let t0;
    	let t1;
    	let option_value_value;
    	let option_disabled_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(/*format*/ ctx[19]);
    			t1 = space();
    			option.__value = option_value_value = /*format*/ ctx[19];
    			option.value = option.__value;
    			option.disabled = option_disabled_value = /*format*/ ctx[19] === "Format";
    			add_location(option, file$8, 85, 4, 2403);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(85:3) {#each ['Format', 'film', 'tv', 'album'] as format}",
    		ctx
    	});

    	return block;
    }

    // (103:3) {#if i > 0}
    function create_if_block_2$1(ctx) {
    	let t0_value = " " + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text("—");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(103:3) {#if i > 0}",
    		ctx
    	});

    	return block;
    }

    // (97:2) {#each [    { link: 'github.com/padraigfl', text: 'Github' },    { link: 'github.com/padraigfl/critic-lists', text: 'Source code'},    { link: 'packard-belle.netlify.com', text: 'Windows98 Clone' },    { link: 'react-coursebuilder.netlify.com', text: 'Youtube App thing' },   ] as {link, text}
    function create_each_block_1$2(ctx) {
    	let t0;
    	let a;
    	let t1;
    	let a_href_value;
    	let if_block = /*i*/ ctx[18] > 0 && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			a = element("a");
    			t1 = text(/*text*/ ctx[16]);
    			attr_dev(a, "href", a_href_value = `https://${/*link*/ ctx[15]}`);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$8, 105, 3, 2944);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(97:2) {#each [    { link: 'github.com/padraigfl', text: 'Github' },    { link: 'github.com/padraigfl/critic-lists', text: 'Source code'},    { link: 'packard-belle.netlify.com', text: 'Windows98 Clone' },    { link: 'react-coursebuilder.netlify.com', text: 'Youtube App thing' },   ] as {link, text}",
    		ctx
    	});

    	return block;
    }

    // (110:1) {#if display}
    function create_if_block$4(ctx) {
    	let current;

    	const modal = new Modal({
    			props: {
    				onclose: /*toggle*/ ctx[7],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modal_changes = {};

    			if (dirty & /*$$scope, matrix*/ 33554440) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(110:1) {#if display}",
    		ctx
    	});

    	return block;
    }

    // (118:6) {:else}
    function create_else_block$2(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*entry*/ ctx[12]);
    			attr_dev(span, "class", "matrix__rank");
    			add_location(span, file$8, 118, 7, 3380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(118:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (116:6) {#if entry === '_'}
    function create_if_block_1$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Unranked";
    			attr_dev(span, "class", "matrix__rank ");
    			add_location(span, file$8, 116, 7, 3315);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(116:6) {#if entry === '_'}",
    		ctx
    	});

    	return block;
    }

    // (114:4) {#each [1,2,3,4,5,6,7,8,9,10,'_'] as entry}
    function create_each_block$5(ctx) {
    	let div;
    	let t0;
    	let input;
    	let input_updating = false;
    	let t1;
    	let div_class_value;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*entry*/ ctx[12] === "_") return create_if_block_1$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function input_input_handler() {
    		input_updating = true;
    		/*input_input_handler*/ ctx[11].call(input, /*entry*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			attr_dev(input, "max", "100");
    			attr_dev(input, "class", "matrix__input");
    			attr_dev(input, "type", "number");
    			add_location(input, file$8, 120, 6, 3440);

    			attr_dev(div, "class", div_class_value = `matrix__option ${/*entry*/ ctx[12] === "_"
			? "matrix__option--unranked"
			: ""}`);

    			add_location(div, file$8, 114, 5, 3202);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, input);
    			set_input_value(input, /*matrix*/ ctx[3][/*entry*/ ctx[12]]);
    			append_dev(div, t1);

    			dispose = [
    				listen_dev(input, "change", /*update*/ ctx[8](/*entry*/ ctx[12]), false, false, false),
    				listen_dev(input, "input", input_input_handler)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!input_updating && dirty & /*matrix*/ 8) {
    				set_input_value(input, /*matrix*/ ctx[3][/*entry*/ ctx[12]]);
    			}

    			input_updating = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(114:4) {#each [1,2,3,4,5,6,7,8,9,10,'_'] as entry}",
    		ctx
    	});

    	return block;
    }

    // (111:2) <Modal onclose={toggle}>
    function create_default_slot(ctx) {
    	let p;
    	let t1;
    	let div;
    	let t2;
    	let button;
    	let dispose;
    	let each_value = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "_"];
    	let each_blocks = [];

    	for (let i = 0; i < 11; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Update the values to recalculate lists across the site";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < 11; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			button.textContent = "Update";
    			add_location(p, file$8, 111, 3, 3063);
    			attr_dev(div, "class", "matrix");
    			add_location(div, file$8, 112, 3, 3128);
    			set_style(button, "float", "right");
    			add_location(button, file$8, 124, 3, 3585);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < 11; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);
    			dispose = listen_dev(button, "click", /*saveNewMatrix*/ ctx[9], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*matrix, update*/ 264) {
    				each_value = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "_"];
    				let i;

    				for (i = 0; i < 11; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < 11; i += 1) {
    					each_blocks[i].d(1);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(111:2) <Modal onclose={toggle}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div0;
    	let select0;
    	let select0_value_value;
    	let t0;
    	let select1;
    	let select1_value_value;
    	let t1;
    	let button;
    	let t3;
    	let div1;
    	let t4;
    	let t5;
    	let current;
    	let dispose;

    	let each_value_3 = [
    		"Year",
    		"2010",
    		"2011",
    		"2012",
    		"2013",
    		"2014",
    		"2015",
    		"2016",
    		"2017",
    		"2018",
    		"2019",
    		"2010s"
    	];

    	let each_blocks_2 = [];

    	for (let i = 0; i < 12; i += 1) {
    		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = ["Format", "film", "tv", "album"];
    	let each_blocks_1 = [];

    	for (let i = 0; i < 4; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = [
    		{
    			link: "github.com/padraigfl",
    			text: "Github"
    		},
    		{
    			link: "github.com/padraigfl/critic-lists",
    			text: "Source code"
    		},
    		{
    			link: "packard-belle.netlify.com",
    			text: "Windows98 Clone"
    		},
    		{
    			link: "react-coursebuilder.netlify.com",
    			text: "Youtube App thing"
    		}
    	];

    	let each_blocks = [];

    	for (let i = 0; i < 4; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let if_block = /*display*/ ctx[0] && create_if_block$4(ctx);

    	const router = new Router({
    			props: { routes: /*routes*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			select0 = element("select");

    			for (let i = 0; i < 12; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t0 = space();
    			select1 = element("select");

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			button = element("button");
    			button.textContent = "Scoring Metric";
    			t3 = space();
    			div1 = element("div");

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			create_component(router.$$.fragment);
    			add_location(select0, file$8, 76, 2, 2015);
    			add_location(select1, file$8, 83, 2, 2289);
    			add_location(button, file$8, 90, 2, 2513);
    			attr_dev(div0, "class", "nav");
    			add_location(div0, file$8, 75, 1, 1995);
    			attr_dev(div1, "class", "wasAMarquee");
    			add_location(div1, file$8, 95, 1, 2580);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, select0);

    			for (let i = 0; i < 12; i += 1) {
    				each_blocks_2[i].m(select0, null);
    			}

    			select0_value_value = /*year_value*/ ctx[1];

    			for (var i = 0; i < select0.options.length; i += 1) {
    				var option = select0.options[i];

    				if (option.__value === select0_value_value) {
    					option.selected = true;
    					break;
    				}
    			}

    			append_dev(div0, t0);
    			append_dev(div0, select1);

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks_1[i].m(select1, null);
    			}

    			select1_value_value = /*format_value*/ ctx[2];

    			for (var i_1 = 0; i_1 < select1.options.length; i_1 += 1) {
    				var option_1 = select1.options[i_1];

    				if (option_1.__value === select1_value_value) {
    					option_1.selected = true;
    					break;
    				}
    			}

    			append_dev(div0, t1);
    			append_dev(div0, button);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < 4; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(router, target, anchor);
    			current = true;

    			dispose = [
    				listen_dev(select0, "change", /*changeYear*/ ctx[5], false, false, false),
    				listen_dev(select1, "change", /*changeFormat*/ ctx[6], false, false, false),
    				listen_dev(button, "click", /*toggle*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*year_value*/ 2 && select0_value_value !== (select0_value_value = /*year_value*/ ctx[1])) {
    				for (var i = 0; i < select0.options.length; i += 1) {
    					var option = select0.options[i];

    					if (option.__value === select0_value_value) {
    						option.selected = true;
    						break;
    					}
    				}
    			}

    			if (!current || dirty & /*format_value*/ 4 && select1_value_value !== (select1_value_value = /*format_value*/ ctx[2])) {
    				for (var i_1 = 0; i_1 < select1.options.length; i_1 += 1) {
    					var option_1 = select1.options[i_1];

    					if (option_1.__value === select1_value_value) {
    						option_1.selected = true;
    						break;
    					}
    				}
    			}

    			if (/*display*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t5.parentNode, t5);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(router, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const routes = {
    		"/": Landing,
    		"/:format": ComponentA,
    		"/:format/:year": ListBreakdown,
    		"*": ComponentA
    	};

    	let display;
    	let year_value = "Year";
    	let format_value = "Format";
    	let matrix_value;
    	window.smallData = smallData;

    	year.subscribe(value => {
    		$$invalidate(1, year_value = value);
    	});

    	format.subscribe(value => {
    		$$invalidate(2, format_value = value);
    	});

    	scoringMatrix.subscribe(value => {
    		matrix_value = value;
    	});

    	const changeYear = e => {
    		push(`/${format_value}/${e.target.value}`);
    		window.scroll(0, 0);
    	};

    	const changeFormat = e => {
    		push(`/${e.target.value}/${year_value}`);
    		window.scroll(0, 0);
    	};

    	const toggle = () => {
    		$$invalidate(0, display = !display);
    	};

    	const update = key => e => {
    		$$invalidate(3, matrix = { ...matrix, [key]: +e.target.value });
    	};

    	const saveNewMatrix = () => {
    		scoringMatrix.update(() => matrix);
    		toggle();
    	};

    	function input_input_handler(entry) {
    		matrix[entry] = to_number(this.value);
    		$$invalidate(3, matrix);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("display" in $$props) $$invalidate(0, display = $$props.display);
    		if ("year_value" in $$props) $$invalidate(1, year_value = $$props.year_value);
    		if ("format_value" in $$props) $$invalidate(2, format_value = $$props.format_value);
    		if ("matrix_value" in $$props) matrix_value = $$props.matrix_value;
    		if ("matrix" in $$props) $$invalidate(3, matrix = $$props.matrix);
    	};

    	let matrix;
    	 $$invalidate(3, matrix = defaultScoringMatrix);

    	return [
    		display,
    		year_value,
    		format_value,
    		matrix,
    		routes,
    		changeYear,
    		changeFormat,
    		toggle,
    		update,
    		saveNewMatrix,
    		matrix_value,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
