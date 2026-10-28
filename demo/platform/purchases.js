/* Real purchases in the app (roadmap M2): the catalog in pay.js stays the game's; the native shell sells through
   StoreKit 2 behind PAY.useStore (v0.43):
   - buy(id): the shell runs the purchase; true when it went through, and the catalog hands the item over itself
     (chime, effects, the arrival card); pending / cancelled / failed leave the button as it was, with a short note
   - restore(): the store's restore, for the catalog's and the settings' 恢复购买
   - price(id): the store's own localised price (displayPrice), else the placeholder table
   Ownership that changes while the player is not buying (refund, Ask to Buy approved, a family member's purchase,
   restore) arrives from the shell as __ndPay.changed and is applied with PAY.grant(id, {quiet}) / PAY.revoke(id).
   Ids here are the catalog's (license, cat-ao, skin-sakura, goods-gotochi, m-bakery, m-teppan); the shell maps them to
   product ids. */
(() => {
  if (!window.NATIVE || !NATIVE.on || typeof PAY === 'undefined' || !PAY.useStore) return;   // (PAY is a top-level const: not on window)
  let prices = {}, waiting = null;

  // the notes in English and Japanese: the game's dictionaries (web/js/i18n-*.js) are the design side's, these three
  // are the app's own. Every character is in the bundled faces the buy button draws with (zh ND QingKe, en/ja ND Dela;
  // 認 is not, so Ask to Buy waits for 許可 rather than 承認)
  I18N.add('en', { '等待批准': 'Waiting for approval', '没有完成，再试一次': 'Didn’t go through — try again', '商店暂时连不上': 'Can’t reach the store now' });
  I18N.add('ja', { '等待批准': '許可待ち', '没有完成，再试一次': '完了しませんでした。もう一度どうぞ', '商店暂时连不上': 'ただいまストアにつながりません' });
  const NOTE = { pending: T`等待批准`, failed: T`没有完成，再试一次`, unavailable: T`商店暂时连不上` };
  function note(outcome, w) {   // the buy button back (cancelled), or a word on it for a moment when the purchase did not go through
    const b = w && w.b && w.b.isConnected ? w.b : document.querySelector('#pay-body [data-act="buy"]'); if (!b) return;
    const was = w && w.b === b ? w.label : b.textContent;
    b.textContent = NOTE[outcome] || was; b.disabled = !!NOTE[outcome];
    if (NOTE[outcome]) setTimeout(() => { if (b.isConnected) { b.textContent = was; b.disabled = false; } }, 2200);
  }
  const store = {
    // the store's sheet takes a moment to come up: meanwhile the button waits (…, greyed, as the prototype's own mock
    // sheet does) instead of looking untouched, and cannot start a second purchase
    buy: id => new Promise(resolve => { if (waiting) waiting.resolve(false); const b = document.querySelector('#pay-body [data-act="buy"]');
      waiting = { id, resolve, b, label: b && b.textContent }; if (b) { b.textContent = '…'; b.disabled = true; }
      NATIVE.post('buy', { id }); }),
    restore: () => NATIVE.post('restore', {}),
    price: id => prices[id] || '',
  };
  window.__ndPay = {
    // native: the store's prices arrived (the catalog reads them each time it draws; this redraws it if open)
    prices(p) { prices = p || {}; PAY.useStore(store); },
    // native: how the purchase went (purchased / pending / cancelled / failed / unavailable)
    bought(id, outcome) {
      const w = waiting; waiting = null;
      if (w) w.resolve(outcome === 'purchased');
      if (outcome !== 'purchased') note(outcome, w);
    },
    // native: ownership changed outside a purchase; after a restore (`restored`), the game's own message follows
    changed(granted, revoked, restored) {
      (revoked || []).forEach(id => PAY.revoke(id));
      (granted || []).forEach(id => PAY.grant(id, { quiet: true }));
      // (the catalog's own restore message is private to pay.js; a street card says the same)
      if (restored) { const n = PAY.ITEMS.filter(x => PAY.has(x.id)).length; STREET.card(n ? T`恢复了 ${n} 件购买` : T`没有找到要恢复的购买`, ''); }
    },
  };
  PAY.useStore(store);
})();
