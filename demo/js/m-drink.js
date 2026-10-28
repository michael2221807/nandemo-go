/* Fig 1 registered as a machine: wraps DRINK and supplies the yellow crate for the dock. */
(() => {
  const { box, TOP, FRONT, SIDE, slits } = ISO;
  const L = DK.LANES;
  ['water', 'melon', 'peach', 'coffee', 'corn'].forEach((id, k) => { L[k].pid = L[k].pid || id; L[k].buy = L[k].buy || 70; L[k].tier = L[k].tier || 1; });   // the starting stock's goods
  const glyphUp = k => L[k].kind === 'bottle' ? 'g-bottle-up' : 'g-can-up';
  const vars = k => `--c:var(--${L[k].c});--cap:var(--${L[k].cap || 'ice'})`;
  const crateBack = () => `<g transform="${TOP(0, 0, 0)}"><rect class="cr top" width="96" height="62" rx="2"/>${slits(8, 88, 8, 2, 60, true, 'crrib')}</g>` + box(0, 0, 0, 96, 2.5, 13, 0, 'cr') + box(0, 2.5, 0, 2.5, 57, 13, 0, 'cr');
  const crateFront = () => box(0, 59.5, 0, 96, 2.5, 13, 0, 'cr') + box(93.5, 2.5, 0, 2.5, 57, 13, 0, 'cr')
    + `<g transform="${FRONT(0, 62, 13)}"><rect class="crhole" x="34" y="3" width="28" height="5" rx="2.5"/>${slits(6, 30, 6, 2, 11, true, 'crrib')}${slits(66, 90, 6, 2, 11, true, 'crrib')}</g>`
    + `<g transform="${SIDE(96, 62, 13)}"><rect class="crhole" x="20" y="3" width="20" height="5" rx="2.5"/></g>`;
  const flying = [0, 0, 0, 0, 0];
  const supply = {
    title: T`货框`, unit: T`件`, gap: 85, anyTarget: true,
    view: [[0, 0, 0], [96, 0, 0], [0, 62, 0], [96, 62, 0], [0, 0, 22], [96, 0, 22]],
    /* the crate carries what the lanes are missing (user, 2026-10-16: one empty lane took five trips with 6 of each in
       every crate): its 30 places are shared out by need, lane by lane, row after row. A full machine gets the usual mix */
    slots: () => {
      const need = [0, 1, 2, 3, 4].map(k => Math.max(0, DK.CAP - DRINK.lanes()[k].cans.length - flying[k])), total = need.reduce((a, b) => a + b, 0);
      let alloc = total ? need.slice() : [6, 6, 6, 6, 6];
      if (total > 30) { const raw = need.map(n => n * 30 / total); alloc = raw.map(Math.floor); let left = 30 - alloc.reduce((a, b) => a + b, 0);
        raw.map((r, k) => [r - alloc[k], k]).sort((a, b) => b[0] - a[0]).forEach(([, k]) => { if (left > 0 && alloc[k] < need[k]) { alloc[k]++; left--; } }); }
      const out = []; let p = 0;
      alloc.forEach((n, k) => { for (let j = 0; j < n; j++, p++) out.push({ glyph: glyphUp(k), vars: vars(k), pos: [9 + (p % 6) * 15.6, 7.5 + Math.floor(p / 6) * 11.8, 2], target: k }); });
      return out;
    },
    back: crateBack, front: crateFront,
    entry: k => DRINK.entryPoint(k),
    accept: k => DRINK.lanes()[k].cans.length + flying[k] < DK.CAP,
    cost: k => L[k].buy || 0, tier: k => L[k].tier || 1,
    // stocks() runs as a can leaves the crate: it is reserved in its lane until it lands (a fast pour, say ×14 in
    // 全部补货, would otherwise send and pay for more than the lane holds)
    isNew: k => !ECON.everStocked('drink', L[k].pid), stocks: k => { flying[k]++; return [['drink', L[k].pid]]; },
    arrive: k => { flying[k] = Math.max(0, flying[k] - 1); DRINK.receive(k); return false; },
    dropTarget: n => { const l = n.closest && n.closest('[data-hit="lane"]'); return l ? +l.dataset.k : null; },
    order: (a, b) => a.target - b.target || a.pos[0] - b.pos[0],
  };
  MACHINES.push({
    // opaque: a solid door, so its insides need not be drawn while it is shut and not X-rayed
    id: 'drink', fig: 1, name: T`罐装・瓶装饮料`, brand: 'ミズイロ', size: [120, 84, 240], opaque: true, catOffset: [0, 0, 6], tint: '#2f6bff', render: () => DRINK.render(), renderShell: () => DRINK.renderShell(),
    hint: { shut: T`点机器招呼客人，连点更快 · 左右拖动转视角 · 点门锁开门码货`, xray: T`点货道出货 · 点硬币管回收 · 拖动扫描线`, open: T`点一下放进对应货道 · 划过一排连放 · 点门或门锁关门` },
    build: (g, onSale) => DRINK.build(g, onSale),
    step: (now, dt) => DRINK.step(now, dt),
    tap: hit => DRINK.tap(hit),
    customerBuy: () => DRINK.customerBuy(),
    door: open => DRINK.door(open),
    get doorOpen() { return DRINK.doorOpen; }, get doorMoving() { return DRINK.doorMoving; },
    doorBounds: () => { const a = DRINK.OPEN; return [[120 * Math.cos(a), 84 + 120 * Math.sin(a), 0], [120 * Math.cos(a), 84 + 120 * Math.sin(a), 240]]; },
    openTap: hit => { if (hit.dataset.hit === 'lane') { DOCK.sendTo(+hit.dataset.k); return true; } return false; },
    supply, count: () => DRINK.count(), get capacity() { return DRINK.capacity; }, isBusy: () => DRINK.lanes().some(L => L.busy),
    save: () => DRINK.save(), load: d => DRINK.load(d), idleSell: () => DRINK.idleSell(),
    vendKey: k => DRINK.vend(k, 'player'),
    // X-ray tags: per lane, the goods at its front (they sell first) and how many are in it, pinned over the top can
    labels: () => DRINK.lanes().map((ln, k) => { const cans = ln.cans.slice().sort((a, b) => a.s - b.s), top = cans[cans.length - 1], p = cans.length ? cans[0].p : L[k];
      return { name: p.name, n: cans.length, c: `var(--${p.c})`, pt: top ? [DK.colX(k), top.y, top.z + 7] : [DK.colX(k), 20, 196] }; }),
    // upgrades (改造), each after a real mechanism; pin = where its pin sits in the X-ray view
    upgrades: [
      { id: 'rack', name: T`加深蛇形货道`, cost: [6000], effect: [T`容量 140 → 215`], kind: T`容量`, pin: [45.05, 78, 226],
        fact: T`真实的罐装自贩机里，罐子横躺在 S 形货道里，靠重力一路滚下来；出口有两个挡块交替动作，一次只放一罐。同样的高度折得越多，装得越多。` },
      { id: 'heatpump', name: T`热泵切换室`, cost: [25000], effect: [T`第 3 道可冷可热 · 新货 おでん缶`], kind: T`新货位`, pin: [45, 50, 100],
        fact: T`真实的热泵切换室：同一块换热器，制冷时当蒸发器，加热时变成冷凝器，能烧到 60～80℃。所以同一道货，夏天卖冰的，冬天卖热的。` },
    ],
    applyParts: lv => { DK.setRack(lv.rack || 0); DK.hp = (lv.heatpump || 0) > 0; },
    // goods: one drink per lane; switching rewrites the lane's definition (name, price, colours, can or bottle)
    goods: {
      kind: 'drink', defaults: ['water', 'melon', 'peach', 'coffee', 'corn'],
      // lanes 1-2 are in the cold room, 4-5 in the hot room; with the heat pump, lane 3 runs either way
      get slots() { return [0, 1, 2, 3, 4].map(k => ({ cap: DK.CAP, temp: k >= 3 ? 'hot' : k === 2 && DK.hp ? 'any' : 'cold' })); },
      units: k => DRINK.lanes()[k].cans.length,
      apply: list => list.forEach((g, k) => Object.assign(L[k], { pid: g.id, tier: g.tier, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, c: g.c, cap: g.cap, kind: g.kind, hot: !!g.hot })),
    },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n units of the planned goods, straight onto the shelves
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = DRINK.save(); let added = 0;
    d.lanes = d.lanes.map((l, k) => { const add = Math.max(0, Math.min(DK.CAP - l.length, n - added)); added += add; return l.concat(Array(add).fill(L[k].pid)); });
    if (added) DRINK.load(d); return added; };
})();
