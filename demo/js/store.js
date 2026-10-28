/* なんでも自販機 · storage (v0.41, for the port). Every save and preference goes through STORE: the four keys are
   nandemo-v6 (the game), nandemo-lang, nandemo-settings and nandemo-purchases. Values are strings, as with
   localStorage, which is the default. An app shell can define window.STORE before this file loads (or replace its
   methods before the game boots) to keep everything in native storage instead. */
window.STORE = window.STORE || (() => {
  const ls = () => { try { return window.localStorage; } catch (e) { return null; } };
  return {
    get(key) { try { const s = ls(); return s ? s.getItem(key) : null; } catch (e) { return null; } },
    set(key, value) { try { const s = ls(); if (s) s.setItem(key, value); } catch (e) { /* full or blocked */ } },
    remove(key) { try { const s = ls(); if (s) s.removeItem(key); } catch (e) { /* blocked */ } },
  };
})();
