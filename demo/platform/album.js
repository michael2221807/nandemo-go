/* The album keeps its place (user, 2026-10-20, phone review: after 领取 or putting on a decoration the list jumped back
   to the top, and with two series ready in a row he scrolled down again for each). The prototype's album.js redraws the
   page after every tap and its render() sets the list's scrollTop to 0; that is right for a new tab, not for a tap that
   changes one row. So for the taps that stay on the same page (领取, 捎一件, wear, sticker, lucky cat), the list's scroll
   position is noted before the album's own click handler runs (capture on the document) and put back right after it
   (bubble on the document), before anything is painted. Tabs (data-sec, data-ktab) and 去装扮 (data-go) still start at
   the top. Same in the prototype in a desktop browser (v0.46.1). */
(() => {
  const album = document.getElementById('st-album'), body = document.getElementById('al-body');
  if (!album || !body) return;
  const SAME_PAGE = '[data-claim],[data-ask],[data-wear],[data-stick],[data-perch]';
  let keep = null;
  document.addEventListener('click', e => {
    keep = null;
    const t = e.target.closest && e.target.closest('button');
    // (a tap while a card is open only closes the card, which does not redraw; the next tap is the real one)
    if (t && body.contains(t) && t.matches(SAME_PAGE) && document.getElementById('al-detail').hidden) keep = body.scrollTop;
  }, true);
  document.addEventListener('click', () => {
    if (keep === null) return;
    body.scrollTop = keep; keep = null;
  });
})();

/* 捎一件 shows it can be tapped (user, 2026-10-20 phone review: nothing said the piece could be tapped; of three
   mock-ups he chose C on 10-21): the piece gets a pink frame, its own colours and a pink + on its corner, and the
   series page opens with one line saying what + does. Shown only while the page has such a piece. The prototype
   (v0.46.1) draws a grey dashed square with a small white +. Styles here, so the change stays in this one file.
   The + in the pink badges is drawn (two white bars as a background), not the + glyph: from the font its line box
   put it low and to one side on the phone (the owner, 10-21). Bar sizes in thirds of a point, so at 3x they land on
   whole pixels, centred. The 捎 badge (.on) keeps its character */
(() => {
  const body = document.getElementById('al-body');
  if (!body) return;
  const TXT = {
    zh: '带 + 的商品还没卖过，点一下，下次补货批发商会捎一件来',
    'zh-Hant': '帶 + 的商品還沒賣過，點一下，下次補貨批發商會帶一件來',
    en: 'Pieces with a + have not sold yet: tap it and the wholesaler will bring it along at the next restock',
    ja: '+ の付いた商品はまだ売れていません。タップすると、次の補充で問屋がひとつ持ってきます',
  };
  const css = document.createElement('style');
  css.textContent = `.al-s-i .al-ask{border:1.5px solid #ff4f8b;background:#fff}
.al-s-i .al-ask svg{filter:none;opacity:.6}
.al-s-i .al-ask::after{content:"";right:-5px;top:-6px;width:12px;height:12px;border:1.5px solid var(--dink);color:#fff;font:700 10px/11px var(--maru);background:linear-gradient(#fff,#fff) 50% 50%/5.667px 1.667px no-repeat,linear-gradient(#fff,#fff) 50% 50%/1.667px 5.667px no-repeat,#ff4f8b}
.al-s-i .al-ask.on{background:#ffe1ec} .al-s-i .al-ask.on svg{opacity:.85}
.al-s-i .al-ask.on::after{content:"捎";background:#ffd23f;color:var(--dink);font:700 7px/10px var(--maru)}
.al-tip{display:flex;align-items:center;gap:6px;text-align:left;margin:0 0 6px;padding:6px 8px;border:2px dashed #ff4f8b;border-radius:10px;background:#fff6f9;font:700 11px/1.35 var(--maru);color:var(--dink)}
.al-tip b{flex:none;display:grid;place-items:center;width:16px;height:16px;border-radius:50%;border:1.5px solid var(--dink);font-size:0;background:linear-gradient(#fff,#fff) 50% 50%/7px 1.667px no-repeat,linear-gradient(#fff,#fff) 50% 50%/1.667px 7px no-repeat,#ff4f8b}`;
  document.head.appendChild(css);
  // (the album redraws the page with innerHTML; the line goes in right after, before the album keeps its place above)
  const add = () => {
    const list = body.querySelector('.al-series');
    if (!list || body.querySelector('.al-tip') || !list.querySelector('.al-ask')) return;
    list.insertAdjacentHTML('beforebegin', `<p class="al-tip"><b>+</b><span>${TXT[I18N.code] || TXT.zh}</span></p>`);
  };
  new MutationObserver(add).observe(body, { childList: true });
  add();
})();
