import logo from './logo.svg';
import './App.css';
import {useEffect} from 'react'
function App() {
  useEffect(() => {
    window.__lc = window.__lc || {};
    window.__lc.license = '12520017';
    (function(n, t, c) {
      function i(n) {
        return e._h ? e._h.apply(null, n) : e._q.push(n);
      }
      var e = {
        _q: [],
        _h: null,
        _v: "2.0",
        on: function () { i(["on", c.call(arguments)]) },
        once: function () { i(["once", c.call(arguments)]) },
        off: function () { i(["off", c.call(arguments)]) },
        get: function () {
          if (!e._h) throw new Error("[LiveChatWidget] You can't use getters before load.");
          return i(["get", c.call(arguments)])
        },
        call: function () { i(["call", c.call(arguments)]) },
        init: function () {
          const s = t.createElement("script");
          s.async = 1;
          s.src = "https://cdn.livechatinc.com/tracking.js";
          t.head.appendChild(s);
        }
      };
      !n.__lc.asyncInit && e.init();
      n.LiveChatWidget = n.LiveChatWidget || e;
    })(window, document, [].slice);
  }, []);

  return (
    <div className="App">
     Hi
    </div>
  );
}

export default App;
