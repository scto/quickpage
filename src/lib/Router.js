function Router() {
  const routes = {};
  const listeners = {
    navigate: [],
  };
  const locationChanged = () => { document.dispatchEvent(new CustomEvent('locationchange')); };
  let onnavigate;

  return {
    set onnavigate(listener) {
      onnavigate = listener;
    },
    get onnavigate() {
      return onnavigate;
    },
    /**
     * Adds new route
     * @param {string} path
     * @param {function(Object, Object):void} callback
     */
    add(path, callback) {
      routes[path] = callback;
    },
    /**
     * Nvigate to given path
     * @param {string} url
     */
    navigate(url) {
      const { location } = window;
      url = (typeof url === 'string' ? url : location.pathname);

      if (typeof this.onnavigate === 'function') this.onnavigate(url);
      listeners.navigate.forEach((listener) => listener(url));

      const route = (decodeURI(url)).split('/');
      let query = decodeURI(location.search.substr(1));
      const params = {};
      const queries = {};
      let callback;

      Object.keys(routes).every((path) => {
        let match = false;

        if (!path) {
          callback = routes[path];
          return false;
        }

        const navigation = path.split('/');
        for (let i = 0; i < navigation.length; ++i) {
          const nav = navigation[i];
          const routeSeg = route[i];
          if (nav === '*') {
            match = true;
            break;
          } else if (nav[0] === ':') {
            const IS_OPTIONAL = nav.substr(-1) === '?';
            const IS_ALLOWED = IS_OPTIONAL && !routeSeg;
            const cleanNav = IS_OPTIONAL ? nav.slice(1, -1) : nav.slice(1);
            const key = cleanNav.replace(/\(.*\)$/, '');
            const execValue = /\((.+)\)/.exec(cleanNav);
            if (Array.isArray(execValue)) {
              const regex = new RegExp(execValue[1]);
              if (IS_ALLOWED || regex.test(routeSeg)) {
                match = true;
              } else {
                match = false;
                break;
              }
            } else if (IS_ALLOWED || routeSeg) {
              match = true;
            } else {
              match = false;
              break;
            }
            params[key] = routeSeg || '';
          } else if (nav === routeSeg) {
            match = true;
          } else if (new RegExp(nav).test(routeSeg)) {
            match = true;
          } else if (nav !== routeSeg) {
            match = false;
            break;
          }
        }

        if (match) {
          callback = routes[path];
          return false;
        }

        return true;
      });

      if (callback) {
        if (query) {
          query = query.split('&');

          query.forEach((get) => {
            get = get.split('=');
            [, queries[get[0]]] = get;
          });
        }

        callback(params, queries);
      }
    },
    listen() {
      const { location, history } = window;
      this.navigate(location.pathname);
      document.addEventListener('locationchange', () => this.navigate());
      document.body.addEventListener('click', listenForAncher);
      window.addEventListener('popstate', locationChanged);

      /**
       *
       * @param {MouseEvent} e
       */
      function listenForAncher(e) {
        const $el = e.target;

        if (!($el instanceof HTMLAnchorElement)) return;

        /**
         * @type {string}
         */
        const href = $el.getAttribute('href');
        const thisSite = new RegExp(`(^https?://(www.)?${location.hostname}(/.*)?)|(^/)`);

        if (!thisSite.test(href)) return;

        e.preventDefault();

        if (href !== location.pathname) history.pushState(history.state, document.title, href);
        locationChanged();
      }
    },
    /**
     *
     * @param {"navigate"} event
     * @param {function(url):void} listener
     */
    on(event, listener) {
      listeners[event] = listener;
    },
    /**
     *
     * @param {"navigate"} event
     * @param {function(url):void} listener
     */
    off(event, listener) {
      const index = listeners[event].indexOf(listener);
      listeners[event].splice(index, 1);
    },
  };
}

export default Router;
