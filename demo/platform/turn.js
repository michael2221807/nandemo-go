/* Turning a machine with pictures (iOS app; the user's choice 2026-10-20, "后台预画"). The game hands every turn to the
   shell through GAME.onTurn (v0.43): while the machine turns nothing is rebuilt and the shell shows the angle.

   The pictures come from a second, hidden web view (ios TurnRenderer, turn.html + platform/renderer.js): the same game
   with only this machine, on this save, drawing it at every angle of a 2° grid (and at the current angle exactly), each
   snapshotted with its transparency. Here they are kept as PNG, decoded near the angle shown (below), and drawn into a canvas that lies in the stage, over
   the machine's layers and under the rain, the vignette and the bars: during a turn the live machine is taken out of
   the layout and the canvas shows the picture nearest the finger's angle (2° apart); when the turn settles the game
   draws the final angle for real and the machine comes back under the canvas, a part a frame, before it goes.

   A set of pictures belongs to a look (machine, art style, parts, sticker, figure, cats, camera). Sales are saved up
   (the user's choice, 2026-10-20: "攒着再画"): a set is redrawn only once the stock differs from it in a way one can
   see — a slot sold out, or a slot 2 or more down — after 30 s without a sale and at most every 3 minutes per
   machine; a restock or new goods redraw it at once. The old pictures serve meanwhile. Without a complete set for the current look — or with the X-ray
   on — a turn is drawn by the game itself, as the prototype does. Devices with too little memory never get here.

   With the pictures kept and drawn ahead (turnAhead, the default) a machine turns in pictures from the first touch:
   the set of its look on disk from a moment ago, or the one baked into the app, stands in while its own is drawn,
   each of its own pictures taking the place of the stand-in at that angle (the owner, 2026-10-23, after trying an
   exact-only build that held the turn until they were drawn: the wait spoilt the game). A cat in a ring at the bottom
   left shows how much of its own set is there; it never stops a turn. A turn in pictures ends on the angle it
   shows (TURN.settle, build_www turn_settle). */
/* What changes with the save or with play is never in the model (the owner, 2026-10-30): the parts listed here are left
   out when it is made (tools/turn3d/export.mjs reads this list) and drawn from the page as they look now (Turn3D "live"):
   on a plane (a lamp, the digits, the heat pump's faces), painted as a picture on that plane; an outline in 3D (the coins
   in their tubes), as that shape in its colours. iso.js records the 3D behind both (build_www.py build_iso_js). Set before the shell check below:
   the exporter runs the page without the shell. */
window.__t3dLive = {
  drink: ['#dk-d0', '#dk-d1', '#dk-d2', '#dk-d3', '.btn .led', '.btn .soldout', '.g-int .coin', '[data-part="heatpump"] .hpbox', '[data-part="heatpump"] .hpfin',
    '.g-int rect[filter="url(#bloom)"][height="114"]', '.upin'],
  // teppan (platform/m-teppan*.js): the door's batter gauge, lamps and words; the coins; the pins (its moving parts: __t3dK)
  teppan: ['.tp-gauge', '.tp-cooklamp', '.tp-waitlamp', '.tp-ready', '.tp-lcd', '.g-int .coin', '.upin'],
  // frozen (m-frozen*.js): the door's 霜取り中, temperature, frost lamps and お取りください; what stands on the door by the
  // upgrades (the snow child until the extra shelf, the defrost and elevator badges); the heater glowing red as it
  // defrosts; the coins; the pins (its menu panels: T3D_DECALS; its moving parts: __t3dK)
  frozen: ['.fz-defrost', '.fz-temp', '.fz-fr', '.fz-ready', '.fz-door .door-out > g.nohit', '.fz-heater', '.g-int .coin', '.upin'],
  // ramen (m-ramen*.js): the door's countdown, 準備中 and できあがり; what stands on the door by the upgrades (their
  // badges); the boiler's thermometer and the dashi tank's sight glass (redrawn as heat and dashi change); the hot water
  // and the dashi pouring; the coins; the pins (its menu tiles: T3D_DECALS; its moving parts: __t3dK)
  // (the gauges' rects themselves, not their group: a part's key is its own attributes, and renderGauges sets a new
  // mercury's y and height, so the group's key never changed and the shell kept the first level, 2026-10-31)
  ramen: ['.ra-nixie', '.ra-prep', '.ra-ready', '.ra-door .door-out > g.nohit', '.g-int g:has(> rect[width="3"][height="44"]) > rect',
    '.g-int g:has(> rect[width="6"][height="48"]) > rect', '.ra-stream', '.g-int .coin', '.upin'],
  // cup (m-cup*.js): the door's できあがり and its sugar and milk bars; what stands on the door by the upgrades (the
  // turret's badge; the mill's, turned, a decal as the drink's stickers); the canisters' powder and the ice bin (their rects, redrawn as they are used and
  // filled); the drink pouring; the coins; the pins (its menu tiles and TURBO plate: T3D_DECALS; its moving parts: __t3dK)
  cup: ['.cu-readyt', '.cu-door .led.su', '.cu-door .led.mi', '.cu-door .door-out > g.nohit:not([transform*="rotate"])',
    '.g-int g:has(> rect[width="7"][height="52"]) > rect', '.g-int g:has(> rect[width="19"][height="16"]) > rect', '.cu-stream', '.g-int .coin', '.upin'],
  // juice (m-juice*.js): the door's LCD and its bar, 圧縮中 and できあがり; what stands on the door (the 4個1杯 sticker and
  // the upgrades' badges); the juice running into the cup; the cutter's blade flashing; the coins; the pins (its menu
  // tiles: T3D_DECALS; its moving parts: __t3dK)
  juice: ['.ju-lcd', '.ju-bar', '.ju-clean', '.ju-ready', '.ju-door .door-out > g.nohit', '.ju-stream', '.ju-blade', '.g-int .coin', '.upin'],
  // auto (m-auto*.js): the door's nixie, できあがり and the kitchens' lamps (トースト中, 加熱中, the curry's); the hot plate's
  // coil glowing (the press's own coil rides with the press, __t3dK), the timer's pilot lamp, the oven's light, the curry
  // poured; the coins; the pins (its menu tiles and the 両面焼 plate: T3D_DECALS; its moving parts: __t3dK)
  auto: ['.ra-nixie', '.au-ready', '.au-lamp-t', '.au-lamp-b', '.au-lamp-c', '.g-int > .au-coil', '.au-pilot', '.au-light', '.au-stream', '.g-int .coin', '.upin'],
  // digital (m-digital*.js): お取りください and 再起動中 on the door; what stands on the door (the upgrades' badges; not the
  // touchscreen's reboot screen: a decal, over the tiles); the PC's disk lamp; the coins; the pins (its touchscreen
  // tiles: T3D_DECALS; its moving parts: __t3dK)
  digital: ['.pk-ready', '.pk-reboot', '.pk-door .door-out > g.nohit:not(.pk-boot)', '.pk-hdd', '.g-int .coin', '.upin'],
  // locker (m-locker*.js): the ¥100 coins in each old cell's cup; the pins (its little doors, the goods and a bag on its
  // way out: __t3dK)
  locker: ['.g-int .coin', '.upin'],
  // spiral (m-spiral*.js): the keypad's screen and its keys' lamps; what stands on the door by the upgrades (their
  // stickers); the coins; the pins (its moving parts and the price strips, seen through the window: __t3dK)
  spiral: ['.sp-scr', '.sp-key .led', '.sp-door .door-out > g.nohit', '.g-int .coin', '.upin'],
  // teishoku (m-teishoku*.js): the door's LCD, the clean sets' count, 洗い物中 and できあがり; the ticket out of the front
  // slot; what stands on the door by the upgrades (their stickers); the dishwasher's lamp; the coins; the pins (its menu
  // tiles: T3D_DECALS; its kitchen, seen through the window: __t3dK)
  teishoku: ['.ob-lcd', '.ob-sets', '.ob-washing', '.ob-ready', '.ob-ticketout', '.ob-door .door-out > g.nohit', '.ob-washled', '.g-int .coin', '.upin'],
  // sushi (m-sushi*.js): the door's LCD, the plates' count, 半額 and できあがり lamps; the express sign's lamp (the upgrade);
  // what stands on the door by the upgrades (their stickers); the coins; the pins (its menu tiles: T3D_DECALS; the belt
  // and its stations, seen through the window: __t3dK)
  sushi: ['.su-lcd', '.su-count', '.su-halflamp', '.su-ready', '.su-explamp', '.su-exp', '.su-door .door-out > g.nohit', '.g-int .coin', '.upin'],
  // oden (m-oden*.js): the door's LCD, the broth gauge, だし少, できあがり and 二番かご lamps; what stands on the door by the
  // upgrades (their stickers); the coins; the pins (its menu tiles: T3D_DECALS; the pot, its pieces and the baskets, seen
  // through the round window: __t3dK)
  oden: ['.od-lcd', '.od-gauge', '.od-lowlamp', '.od-ready', '.od-b2lamp', '.od-door .door-out > g.nohit', '.g-int .coin', '.upin'],
  // taiyaki (m-taiyaki*.js): the door's LCD, the batter gauge, 焼成中, 焦げあり, 強火 and 焼きあがり; what stands on the door by
  // the upgrades (their stickers); the coins; the pins (its menu tiles: T3D_DECALS; the moulds, the pins, the blade and the
  // brush, seen through the window: __t3dK)
  taiyaki: ['.ty-lcd', '.ty-gauge', '.ty-bakelamp', '.ty-scorchlamp', '.ty-firelamp', '.ty-ready', '.ty-door .door-out > g.nohit', '.g-int .coin', '.upin'],
  // kakigori (m-kakigori*.js): the door's LCD, the ice gauge and the loader's two spare-block lights, 削り中, 氷切れ, 二枚刃
  // and できあがり; what stands on the door by the upgrades (their stickers); the coins; the pins (its menu tiles:
  // T3D_DECALS; the block, the presser, the carriage and its cup, seen through the arched window: __t3dK)
  kakigori: ['.kg-lcd', '.kg-gauge', '.kg-spare', '.kg-shavelamp', '.kg-outlamp', '.kg-dbladelamp', '.kg-ready', '.kg-door .door-out > g.nohit', '.g-int .coin', '.upin'],
  // gacha (m-gacha*.js): the door's LCD, シークレット, 急こう配 and でてきたよ; what stands on the door by the upgrades
  // (their stickers); the coins; the pins (its menu tiles, つまり on them: T3D_DECALS; the globes, the capsules rolling
  // down the run, seen through the capsule-shaped window: __t3dK)
  gacha: ['.gc-lcd', '.gc-secretlamp', '.gc-steeplamp', '.gc-ready', '.gc-door .door-out > g.nohit', '.g-int .coin', '.upin'],
  // kissa (m-kissa*.js): the door's LCD, the cloth filter's gauge, 抽出中, フィルター交換, ハロゲン×2 and できあがり; what stands
  // on the door by the upgrades (their stickers); the coins; the pins (its menu tiles: T3D_DECALS; the siphon, the pours, the
  // cup on the belt, what falls into it, the cup in the take-out window: __t3dK)
  kissa: ['.ks-lcd', '.ks-gauge', '.ks-brewlamp', '.ks-filterlamp', '.ks-halolamp', '.ks-ready', '.ks-door .door-out > g.nohit', '.g-int .coin', '.upin'],
  // bakery (platform/m-bakery*.js): the door's LCD, the dough gauge, 焼成中, 発酵中 and 焼きあがり; the round stickers the
  // upgrades put on its board; the depositor's dock lamp and the fryer's lamp, lit while they work; the coins; the pins
  // (its menu tiles: T3D_DECALS; the belt, the bread on it, the queue in the cabinet, the hoppers, the head, the blade, the
  // bags, the stations: __t3dK)
  bakery: ['.pb-lcd', '.pb-gauge', '.pb-bakelamp', '.pb-prooflamp', '.pb-ready', '.pb-door .door-out > g.nohit', '.pb-dock', '.pb-frylamp', '.g-int .coin', '.upin'],
};
// what the page draws anew as it works (handbook 2. K: group.innerHTML = a function of where the parts are now), each
// group sent to the shell as its 3D shapes whenever it changes (t3dK), left out of the model (tools/turn3d/export.mjs)
window.__t3dK = {
  // teppan: the griddle's rows, the carriage and its hoses, the sauce carousel, the belt, the boat on it, the toppers,
  // what rides along a path (UTIL.g in .tp-movers), the deck's stations, belt, packs and lift, the boat in the take-out window
  teppan: ['.tp-plate', '.tp-car', '.tp-hoses', '.tp-carousel', '.tp-beltg', '.tp-boats', '.tp-toppers', '.tp-movers', '.tp-st', '.tp-dbelt', '.tp-packs', '.tp-lift', '.tp-window'],
  // frozen: each shelf's packs (<use>s of the packs' glyphs) and its spirals behind and in front of them (turned a
  // pitch as it sells: renderCoil sets their paths), a pack on its way down, the elevator, the frost, the meltwater, the
  // pack in the take-out window (and the goods themselves as it clears)
  frozen: ['.fz-items', 'g:has(> .coil.back)', 'g:has(> .coil.front)', '.fz-movers', '.fz-liftg', '.fz-frost', '.fz-drips', '.fz-window'],
  // ramen: the bowls on each tier of the carousel (<use>s of the bowls' glyphs, turned round as it sells), the lift
  // (moved up and down, the spin plate on it), the bowl on the stand (filled, tipped or spun), a bowl on its way and the
  // drops off it, the bowl steaming in the take-out window
  ramen: ['.ra-tier', '.ra-carriage', '.ra-station', '.ra-movers', '.ra-window'],
  // cup: the three holders on the turntable (each an ellipse, turned round with it), the cups riding on them (filled,
  // steaming, lifted out), the canisters' augers (turned as they dose), the swirl in the mixing bowl, the ice and powder
  // on their way down, the cups in the tube (or the turret)
  cup: ['.g-int > ellipse.recess', '.cu-cups', '.cu-auger', '.cu-swirl', '.cu-movers', '.cu-stack'],
  // juice: each compartment's fruit (<use>s of the fruit's glyph), the press cups closing, the cup on the stand (filling,
  // sealed), the sealer coming down, a fruit or its halves on the way, the peel in its bag, the cup in the take-out window
  juice: ['.ju-pile', '.ju-press', '.ju-station', '.ju-sealer', '.ju-movers', '.ju-peel', '.ju-window'],
  // auto: the sandwiches in their magazines, the one on the plate, the press coming down (its coil with it), the burger
  // boxes in their column and the one in the oven, the column's pusher, the lift, the rice trays and the pouches, the
  // trays' pusher, the blade swinging through a pouch, a packet on its way, the goods in the window (the stacks are <use>s
  // of the goods' glyphs; the pushers and the blade have no class of their own: the group right after their stack)
  auto: ['.au-mag', '.au-onplate', '.au-pressg', '.au-col', '.au-col + g + g', '.au-inoven', '.au-lift', '.au-trays', '.au-trays + g',
    '.au-pouches', '.au-pouches + g + g', '.au-movers', '.au-window'],
  // digital: the boxes on each shelf (<use>s of the box glyph), the lift, the gantry (its carriages, rods, grippers and the
  // box they hold, drawn again every frame they move), a box on its way, the goods in the window
  digital: ['.pk-row', '.pk-lift', '.pk-gantry', '.pk-movers', '.pk-window'],
  // locker: the twenty little doors (each on a hinge plane of its own, LKB.setDoor: the knob turned, the LED lit, its back
  // shown past the half), the goods in each cell (<use>s of the goods' glyphs), a bag on its way out
  locker: ['.lk-cell', '.lk-goods', '.lk-movers'],
  // spiral: the goods on each coil (<use>s of the goods' glyphs, moved a pitch as it sells), each coil's two halves behind
  // and in front of them (turned round as it sells: renderCoil sets their paths), each in the page's order (one selector:
  // as three, every coil's back half came over the goods), and each shelf's price strips (the save's goods and prices;
  // inside, seen through the window: the shell draws the insides' live parts under the X-ray only); the goods on their
  // way (falling, hung on a coil's end, in the outlet), the lift (the drop sensor on it), the counterweight and its two
  // cables (the lift upgrade)
  spiral: ['.sp-coil > .coil.back, .sp-items, .sp-coil > .coil.front, .sp-row > g:has(> rect[height="3.8"])', '.sp-movers', '.sp-lift', '.sp-cw', '.sp-cable'],
  // teishoku: its kitchen, most of it seen through the door's window: the cooker's lid lifted, the soup in the pot, the
  // plates stacked in the warming cabinet (the save's menu), the fryer's bubbles, the belt's stripes run on (a dash
  // offset), the clean sets in the magazine, the tray on the belt, the ticket on the rail, the two arms and what they
  // hold, a pudding on its way; the dirty sets and the dishwasher's spray in the base; the tray in the serving window. In
  // the page's order (the cooker's lid was drawn over the magazine in front of it, 2026-10-31; the X-ray models' kdom
  // keys renumbered with it)
  teishoku: ['.ob-lid', '.ob-pottop', '.ob-stack', '.ob-bubbles', '.ob-stripes', '.ob-mag', '.ob-trays', '.ob-tickets', '.ob-arms', '.ob-movers', '.ob-dirty', '.ob-spray', '.ob-window'],
  // sushi: the belt going round all the time (its chain a dash offset, the plates on it each a <use> moved every step,
  // behind the island and before it), the turret's fish, the rice in the hopper, the plates' magazine, the drum, the
  // pusher, the burner's flame, the 半額 stamp, the paddle, the lift, the express shuttle, the plate on the deck, what
  // is carried down the chute; the plate in the take-out window
  sushi: ['.su-chain', '.su-rear > use, .su-front > use', '.su-turret', '.su-rice', '.su-mag', '.su-drum', '.su-pusher', '.su-flameg', '.su-stampg', '.su-paddle', '.su-lift', '.su-shuttle', '.su-deckplate', '.su-movers', '.su-window'],
  // oden: the pot (its broth sinking as it sells, its dividers turned round), the pieces in it (each a <use>, moved round
  // as it turns), its front wall and the hub's float (the broth's level), the steam as a basket comes up, the baskets
  // dipping, the carriage and its cup (moved along the rail by its transform), the broth or miso pouring, what slides down
  // the trough or the chute; the cup in the take-out window
  oden: ['.od-pot', '.od-pcs > use', '.od-potfront', '.od-hub', '.od-steamg', '.od-basket', '.od-basket2', '.od-cart > g', '.od-streamg', '.od-movers', '.od-window'],
  // taiyaki: the pins lifting the fish at the eject station, the seven moulds round the chain (each a group of its own, its
  // lid opening and shutting, turned over round the sprockets, what is in it: the page puts them far ones first as they
  // go round, and the lid behind or before its half), the roller brush turning (the upgrade), the blade sweeping, the
  // filling rack sliding its hoppers over, the batter or filling pouring, the paper sleeve's back, what goes down the
  // chute and the slide, the sleeve's front; the fish in the take-out window
  taiyaki: ['.ty-pins', '.ty-moulds > g', '.ty-brush', '.ty-blade', '.ty-rack', '.ty-streamg', '.ty-bag', '.ty-movers', '.ty-bagfront', '.ty-window'],
  // kakigori: the block of ice turning and shaving down, the presser on it, the block loader pushing a spare across (the
  // upgrade), the syrup bottles (the open valve's light), the carriage on the rail (moved along it by its transform, its
  // lift and turntable and the cup's dome redrawn), the topping drum turning, the snow falling, the syrup or milk pouring,
  // a cup dropping out of the magazine or down the slide, a topping falling; the cup in the take-out window
  kakigori: ['.kg-iceg', '.kg-presser', '.kg-loader', '.kg-syrups', '.kg-cart', '.kg-turret', '.kg-snowg', '.kg-streamg', '.kg-movers', '.kg-window'],
  // gacha: the four globes (each a group of its own: its capsules, its star wheel turning, the agitator stirring and the
  // jumbo wheel (the upgrades), shaken when it is knocked), the capsule rolling down the gutter, the run and the chute;
  // the capsule in the take-out window
  gacha: ['.gc-globes > g', '.gc-movers', '.gc-window'],
  // kissa: the siphon (its water climbing and falling, the grounds, the paddle, the halogen rings lit, the rinser's spray),
  // the streams poured, the cup or glass on the belt (moved along it), the cup dropping from the rack, the ice, the scoop and
  // the cherry falling, the cup down the chute; the cup in the take-out window
  kissa: ['.ks-siphon', '.ks-streamg', '.ks-cup', '.ks-movers', '.ks-window'],
  // bakery: the belt's slats, the piece on the belt (pushed out of the cabinet, through the oven, split and filled), the
  // dough rising in the cabinet (redrawn twice a second while it proves), the pusher, the hoppers sliding on their rail,
  // the depositor's head, the blade, the bag held open (behind and in front of what drops in), what rides along a path
  // (into the bag, the bag down to the window); the upgrades' stations: the paddles, the pie roller and its chute, the
  // fryer's basket, the sandwich table and its knife; the bag in the take-out window
  bakery: ['.pb-beltg', '.pb-breads', '.pb-queue', '.pb-pusher', '.pb-rack', '.pb-nozzle', '.pb-bladeg', '.pb-bag', '.pb-movers', '.pb-bagfront',
    '.pb-sweep', '.pb-lamchute', '.pb-lam', '.pb-fry', '.pb-table', '.pb-window'],
};
// the glows a sale lights a moment (the take-out pocket's warm light, the coin slot's, a sample's halo in the window,
// drink.js glow()): each painted once at full strength, only how strong it is now sent while it fades in and out (Turn3D
// "glow"); painted again each frame, a sale cost the page a picture a frame
window.__t3dGlow = {
  drink: ['#dk-trayglow', '#dk-slotglow', '.shalo'],
  teppan: ['.tp-slotglow', '.tp-tglow'],
  frozen: ['.fz-slotglow', '.fz-glow'],
  ramen: ['.ra-slotglow', '.ra-tglow'],
  cup: ['.cu-slotglow', '.cu-tglow'],
  juice: ['.ju-slotglow', '.ju-tglow'],
  auto: ['.au-slotglow', '.au-tglow'],
  digital: ['.pk-slotglow', '.pk-tglow'],
  spiral: ['.sp-slotglow', '.sp-outglow'],
  teishoku: ['.ob-slotglow', '.ob-tglow'],
  sushi: ['.su-slotglow', '.su-tglow'],
  oden: ['.od-slotglow', '.od-tglow'],
  taiyaki: ['.ty-slotglow', '.ty-tglow'],
  kakigori: ['.kg-slotglow', '.kg-tglow'],
  gacha: ['.gc-slotglow', '.gc-tglow'],
  kissa: ['.ks-slotglow', '.ks-tglow'],
  bakery: ['.pb-slotglow', '.pb-tglow'],
};
// what moves on its own while the insides show (the machine's step(), drink.js): played by the app from these, not
// sent per frame (tools/turn3d/export.mjs). spin: a part turning round its own origin, degrees a second; drift: specks
// rising along a world axis (0 x, 1 y, 2 z) from lo to hi at v units a second (the hot ones × hotK), fading in and out over
// fade units, swaying wob[1] units along axis wob[0] with a period of 2π × wob[2] ms, at most op opaque (the hot ones,
// those matching hot: hotOp); blink: a part switching a class on and off every ms; move: a part the page moves itself
// by its transform (one element each), a picture of its own at rest, moved as the page has it now (Turn3D "moves") and
// drawn over the live glows (the take-out flap swinging in as a can lands, over the pocket's warm light, drink.js flap())
window.__t3dMotion = {
  drink: {
    move: [{ sel: '#dk-flap' }],
    spin: [{ sel: '#dk-fan', rate: 420 }],
    drift: [{ sel: '#dk-particles > circle', axis: 2, lo: 112, hi: 226, v: [5, 11], fade: 20, wob: [0, 1.5, 900], op: .55, hot: '[r=".9"]', hotOp: .7, hotK: 1.3 }],
    blink: [{ sel: '#dk-led1', cls: 'on', ms: 900 }],
    // the door (CORE.hinge, drink.js door()): what stands on it or shows only while it is shut (hide) is marked in the
    // model (export.mjs door) and left out while it stands open; the door itself then a picture of each of its faces
    // (out: the front as the page shows it open, its flat display (flat) in; in: the inside face), turned round the hinge
    // at x, y, as the page has it (Turn3D "door")
    door: { el: '#dk-door', hide: ['#dk-door', '#dk-disp3d', '#dk-tray-out'], out: '.door-out', in: '.door-in', flat: '.flatdisp', hinge: [0, 84] },
    // what an upgrade's ceremony moves or lights (app.js installPart): marked in the model with its name (export.mjs
    // marks), drawn by the shell as the page has it now (Turn3D "marks"): the new part sliding in (its translate across
    // the screen and its opacity, on the first element matched), the deeper rack's rails lit a moment (.ubuilt: its stroke)
    marks: { heatpump: '[data-part="heatpump"]:not(.upin)', rail: '.lane .rail',
      btn0: '.btn[data-k="0"]', btn1: '.btn[data-k="1"]', btn2: '.btn[data-k="2"]', btn3: '.btn[data-k="3"]', btn4: '.btn[data-k="4"]', lockh: '.thandle' },
    // a raised part pressed (CORE.press: the selection buttons, the lock's T-handle): the page pushes its cap in across the
    // screen (.r3.down .capin, .6 of its height); the shell pushes the marked part into its face, n its outward normal, t
    // its height (CORE.raised), as far as the page has it pushed now
    press: { btn0: { t: 1.6, n: [0, 1, 0] }, btn1: { t: 1.6, n: [0, 1, 0] }, btn2: { t: 1.6, n: [0, 1, 0] }, btn3: { t: 1.6, n: [0, 1, 0] },
      btn4: { t: 1.6, n: [0, 1, 0] }, lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // teppan: the take-out flap; the door (its boat in the window shown only while it is shut, CORE.hinge shutOnly); the
  // menu tiles (their faces the save's menu: T3D_DECALS) and the lock's T-handle pressed. Its upgrades' ceremony moves
  // nothing in (app.js installPart: no [data-part] but the pins), the station there once rebuilt
  teppan: {
    move: [{ sel: '.tp-flap' }],
    door: { el: '.tp-door', hide: ['.tp-door', '.tp-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { tile0: '.tp-tile[data-k="0"]', tile1: '.tp-tile[data-k="1"]', tile2: '.tp-tile[data-k="2"]', tile3: '.tp-tile[data-k="3"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // frozen: the take-out flap; the door (its pack in the window shown only while it is shut, CORE.hinge shutOnly); the
  // menu panels (their faces the save's menu: T3D_DECALS) and the lock's T-handle pressed; the extra shelf and the
  // elevator slid in as they are fitted (app.js installPart: their [data-part])
  frozen: {
    move: [{ sel: '.fz-flap' }],
    door: { el: '.fz-door', hide: ['.fz-door', '.fz-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { shelf: '[data-part="shelf"]:not(.upin)', elev: '[data-part="elev"]:not(.upin)',
      row0: '.fz-row[data-k="0"]', row1: '.fz-row[data-k="1"]', row2: '.fz-row[data-k="2"]', row3: '.fz-row[data-k="3"]', row4: '.fz-row[data-k="4"]', lockh: '.thandle' },
    press: { row0: { t: 1, n: [0, 1, 0] }, row1: { t: 1, n: [0, 1, 0] }, row2: { t: 1, n: [0, 1, 0] }, row3: { t: 1, n: [0, 1, 0] }, row4: { t: 1, n: [0, 1, 0] },
      lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // ramen: the take-out flap; the door (its bowl in the window shown only while it is shut); the menu tiles (their faces
  // the save's menu: T3D_DECALS) and the lock's T-handle pressed; the bigger boiler and the third tier's plate slid in as
  // they are fitted (the spin plate rides on the lift, __t3dK)
  ramen: {
    move: [{ sel: '.ra-flap' }],
    door: { el: '.ra-door', hide: ['.ra-door', '.ra-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { boiler: '[data-part="boiler"]:not(.upin)', tier: '[data-part="tier"]:not(.upin)',
      tile0: '.ra-tile[data-k="0"]', tile1: '.ra-tile[data-k="1"]', tile2: '.ra-tile[data-k="2"]', tile3: '.ra-tile[data-k="3"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // cup: the take-out window sliding up; the door; the menu tiles (their faces the save's menu: T3D_DECALS), the sugar
  // and milk buttons and the lock's T-handle pressed; the turret's top, the turbo whipper and the mill slid in as they are
  // fitted (the turret's cups ride in .cu-stack, __t3dK)
  cup: {
    move: [{ sel: '.cu-win' }],
    door: { el: '.cu-door', hide: ['.cu-door'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { turret: '[data-part="turret"]:not(.upin):not(.cu-stack)', turbo: '[data-part="turbo"]:not(.upin)', mill: '[data-part="mill"]:not(.upin)',
      tile0: '.cu-tile[data-k="0"]', tile1: '.cu-tile[data-k="1"]', tile2: '.cu-tile[data-k="2"]', tile3: '.cu-tile[data-k="3"]', tile4: '.cu-tile[data-k="4"]', tile5: '.cu-tile[data-k="5"]',
      sum: '[data-hit="su-"]', sup: '[data-hit="su+"]', mim: '[data-hit="mi-"]', mip: '[data-hit="mi+"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, tile4: { t: 1, n: [0, 1, 0] },
      tile5: { t: 1, n: [0, 1, 0] }, sum: { t: 1, n: [0, 1, 0] }, sup: { t: 1, n: [0, 1, 0] }, mim: { t: 1, n: [0, 1, 0] }, mip: { t: 1, n: [0, 1, 0] }, lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // juice: the take-out flap; the door (its cup in the window shown only while it is shut); the menu tiles (their faces
  // the save's menu: T3D_DECALS) and the lock's T-handle pressed; the bigger peel bin and the fourth compartment's wall
  // slid in as they are fitted (the second press cups and the fourth pile are __t3dK)
  juice: {
    move: [{ sel: '.ju-flap' }],
    door: { el: '.ju-door', hide: ['.ju-door', '.ju-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { bin: '[data-part="bin"]:not(.upin)', hopper: '[data-part="hopper"]:not(.upin):not(.ju-pile)',
      tile0: '.ju-tile[data-k="0"]', tile1: '.ju-tile[data-k="1"]', tile2: '.ju-tile[data-k="2"]', tile3: '.ju-tile[data-k="3"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // auto: the take-out flap; the door (the goods in the window shown only while it is shut); the menu tiles (their faces
  // the save's menu: T3D_DECALS) and the lock's T-handle pressed; the kitchens slid in as they are fitted (their stacks,
  // pushers, lift and blade are __t3dK; the press's only part, its coil, rides with the press)
  auto: {
    move: [{ sel: '.au-flap' }],
    door: { el: '.au-door', hide: ['.au-door', '.au-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { burger: '[data-part="burger"]:not(.upin):not(.au-col):not(.au-col + g + g):not(.au-lift)',
      curry: '[data-part="curry"]:not(.upin):not(.au-trays):not(.au-trays + g):not(.au-pouches):not(.au-pouches + g + g)',
      tile0: '.au-tile[data-k="0"]', tile1: '.au-tile[data-k="1"]', tile2: '.au-tile[data-k="2"]', tile3: '.au-tile[data-k="3"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // locker: no door of its own (open and restock swing the little doors, __t3dK: kOpen, the restock drawn in 3D all the
  // same); the upgrades' parts put in
  locker: {
    kOpen: true,
    marks: { lock: '[data-part="lock"]:not(.upin)', cool: '[data-part="cool"]:not(.upin)', big: '[data-part="big"]:not(.upin)' },
  },
  // digital: the take-out flap; the door (the goods in the window shown only while it is shut); the lock's T-handle
  // pressed (the touchscreen's tiles are flat: nothing pressed); the new controller board slid in (the second arm is
  // the gantry's, __t3dK; the charging station is on the shell's side, a shell of its own)
  digital: {
    move: [{ sel: '.pk-flap' }],
    door: { el: '.pk-door', hide: ['.pk-door', '.pk-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { ctrl: '[data-part="ctrl"]:not(.upin)', lockh: '.thandle' },
    press: { lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // spiral: the compressor's fan (the page runs it in spells and while it sells; here always, as the drink machine's);
  // the glass door; the keypad's keys and the lock's T-handle pressed; the counterweight's kit and the twin lane's belt
  // and wall slid in as they are fitted (the drop sensor rides on the lift, __t3dK). The take-out flap only changes its
  // colour a moment as goods land: left as it stands
  spiral: {
    spin: [{ sel: '.sp-fan', rate: 380 }],
    door: { el: '.sp-door', hide: ['.sp-door'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { lift: '[data-part="lift"]:not(.upin)', twin: '[data-part="twin"]:not(.upin)',
      keyA: '.sp-key[data-key="A"]', keyB: '.sp-key[data-key="B"]', keyC: '.sp-key[data-key="C"]', keyD: '.sp-key[data-key="D"]', keyE: '.sp-key[data-key="E"]', key1: '.sp-key[data-key="1"]', key2: '.sp-key[data-key="2"]', key3: '.sp-key[data-key="3"]', key4: '.sp-key[data-key="4"]', lockh: '.thandle' },
    press: { keyA: { t: 1.2, n: [0, 1, 0] }, keyB: { t: 1.2, n: [0, 1, 0] }, keyC: { t: 1.2, n: [0, 1, 0] }, keyD: { t: 1.2, n: [0, 1, 0] }, keyE: { t: 1.2, n: [0, 1, 0] }, key1: { t: 1.2, n: [0, 1, 0] }, key2: { t: 1.2, n: [0, 1, 0] }, key3: { t: 1.2, n: [0, 1, 0] }, key4: { t: 1.2, n: [0, 1, 0] },
      lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // teishoku: the serving window's flap and the 返却口's, as the page swings them; the door; the menu tiles (their faces
  // the save's menu: T3D_DECALS) and the lock's T-handle pressed; the fryer and the dessert shelf put in as they are fitted
  // (the dishwasher only changes its colour and its sign)
  teishoku: {
    move: [{ sel: '.ob-flap' }, { sel: '.ob-retflap' }],
    door: { el: '.ob-door', hide: ['.ob-door', '.ob-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { fryer: '[data-part="fryer"]:not(.upin):not(.ob-basket)', dessert: '[data-part="dessert"]:not(.upin)',
      tile0: '.ob-tile[data-k="0"]', tile1: '.ob-tile[data-k="1"]', tile2: '.ob-tile[data-k="2"]', tile3: '.ob-tile[data-k="3"]', tile4: '.ob-tile[data-k="4"]', tile5: '.ob-tile[data-k="5"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, tile4: { t: 1, n: [0, 1, 0] }, tile5: { t: 1, n: [0, 1, 0] },
      lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // sushi: the take-out window's flap, as the page drops it; the door (the plate in its window with it); the menu tiles
  // (their faces the save's menu: T3D_DECALS) pressed; the upgrades put in as they are fitted
  sushi: {
    move: [{ sel: '.su-flap' }],
    door: { el: '.su-door', hide: ['.su-door', '.su-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { dome: '[data-part="dome"]:not(.upin)', express: '[data-part="express"]:not(.upin)', burner: '[data-part="burner"]:not(.upin)',
      tile0: '.su-tile[data-k="0"]', tile1: '.su-tile[data-k="1"]', tile2: '.su-tile[data-k="2"]', tile3: '.su-tile[data-k="3"]', tile4: '.su-tile[data-k="4"]' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, tile4: { t: 1, n: [0, 1, 0] } },
  },
  // oden: the take-out window's flap, as the page drops it; the door (the cup in its window with it); the menu tiles (their
  // faces the save's menu: T3D_DECALS) and the lock's T-handle pressed; the upgrades put in as they are fitted (the second
  // basket itself: __t3dK)
  oden: {
    move: [{ sel: '.od-flap' }],
    door: { el: '.od-door', hide: ['.od-door', '.od-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { refill: '[data-part="refill"]:not(.upin)', basket2: '[data-part="basket2"]:not(.upin):not(.od-basket2)', miso: '[data-part="miso"]:not(.upin)',
      tile0: '.od-tile[data-k="0"]', tile1: '.od-tile[data-k="1"]', tile2: '.od-tile[data-k="2"]', tile3: '.od-tile[data-k="3"]', tile4: '.od-tile[data-k="4"]', tile5: '.od-tile[data-k="5"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, tile4: { t: 1, n: [0, 1, 0] }, tile5: { t: 1, n: [0, 1, 0] },
      lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // taiyaki: the take-out window's flap, as the page drops it; the door (the fish in its window with it); the menu tiles
  // (their faces the save's menu: T3D_DECALS) and the lock's T-handle pressed; the second row of burners and the croissant
  // roll put in as they are fitted (the roller brush itself: __t3dK)
  taiyaki: {
    move: [{ sel: '.ty-flap' }],
    door: { el: '.ty-door', hide: ['.ty-door', '.ty-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { fire: '[data-part="fire"]:not(.upin)', cro: '[data-part="cro"]:not(.upin)',
      tile0: '.ty-tile[data-k="0"]', tile1: '.ty-tile[data-k="1"]', tile2: '.ty-tile[data-k="2"]', tile3: '.ty-tile[data-k="3"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // kakigori: the take-out window's flap, as the page drops it; the door (the cup in its window with it); the menu tiles
  // (their faces the save's menu: T3D_DECALS) and the lock's T-handle pressed; the second blade and the milk pump put in
  // as they are fitted (the block loader itself: __t3dK)
  kakigori: {
    move: [{ sel: '.kg-flap' }],
    door: { el: '.kg-door', hide: ['.kg-door', '.kg-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { dblade: '[data-part="dblade"]:not(.upin)', milk: '[data-part="milk"]:not(.upin)',
      tile0: '.kg-tile[data-k="0"]', tile1: '.kg-tile[data-k="1"]', tile2: '.kg-tile[data-k="2"]', tile3: '.kg-tile[data-k="3"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // gacha: the take-out window's flap, as the page drops it, and the big knob on the door turning once round with each
  // capsule; the door (the capsule in its window with it); the menu tiles (their faces the save's menu: T3D_DECALS) and the
  // lock's T-handle pressed; the steep rails' jack put in as it is fitted (the agitator and the jumbo wheels: in the
  // globes, __t3dK)
  gacha: {
    move: [{ sel: '.gc-flap' }, { sel: '.gc-knob' }],
    door: { el: '.gc-door', hide: ['.gc-door', '.gc-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { steep: '[data-part="steep"]:not(.upin)',
      tile0: '.gc-tile[data-k="0"]', tile1: '.gc-tile[data-k="1"]', tile2: '.gc-tile[data-k="2"]', tile3: '.gc-tile[data-k="3"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // kissa: the take-out window's flap, as the page drops it; the door (the cup in its window with it); the menu tiles (their
  // faces the save's menu: T3D_DECALS) and the lock's T-handle pressed; the rinser and the soda fountain put in as they are
  // fitted (the second halogen ring: in the siphon, __t3dK)
  kissa: {
    move: [{ sel: '.ks-flap' }],
    door: { el: '.ks-door', hide: ['.ks-door', '.ks-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { rinse: '[data-part="rinse"]:not(.upin)', soda: '[data-part="soda"]:not(.upin)',
      tile0: '.ks-tile[data-k="0"]', tile1: '.ks-tile[data-k="1"]', tile2: '.ks-tile[data-k="2"]', tile3: '.ks-tile[data-k="3"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, lockh: { t: 2.6, n: [0, 1, 0] } },
  },
  // bakery: the take-out flap, as the page drops it; the door (the bag in its window with it); the menu tiles (their faces
  // the save's menu: T3D_DECALS) and the lock's T-handle pressed. Its upgrades' ceremony moves nothing in (app.js
  // installPart: no [data-part] but the pins), the station there once rebuilt, as the teppan's
  bakery: {
    move: [{ sel: '.pb-flap' }],
    door: { el: '.pb-door', hide: ['.pb-door', '.pb-window'], out: '.door-out', in: '.door-in', hinge: [0, 84] },
    marks: { tile0: '.pb-tile[data-k="0"]', tile1: '.pb-tile[data-k="1"]', tile2: '.pb-tile[data-k="2"]', tile3: '.pb-tile[data-k="3"]', lockh: '.thandle' },
    press: { tile0: { t: 1, n: [0, 1, 0] }, tile1: { t: 1, n: [0, 1, 0] }, tile2: { t: 1, n: [0, 1, 0] }, tile3: { t: 1, n: [0, 1, 0] }, lockh: { t: 2.6, n: [0, 1, 0] } },
  },
};

(() => {
  if (!window.NATIVE || !NATIVE.on || !window.GAME || !GAME.onTurn || !window.__ND || !window.__ndTurnPictures) return;
  // SCALE: the pictures' pixels per point. At the screen's own 3 a set of 79 took ~380 MB of decoded bitmaps and the
  // system ended the game's web process on an iPhone 13 Pro (2026-10-20); at 2 it is ~170 MB, drawn up to the screen
  const GRID = 2, SOFT = 7, SCALE = 2, [LIM_L, LIM_R] = GAME.yawRange;
  const GRID_YAWS = []; for (let y = Math.floor((LIM_L - SOFT) / GRID) * GRID; y <= Math.ceil((LIM_R + SOFT) / GRID) * GRID; y += GRID) GRID_YAWS.push(y);
  const T = window.TURN = { active: false, mode: null };
  const device = document.querySelector('.device'), cam = document.getElementById('cam'), stage = document.getElementById('stage');
  // (the shell shows the machine and the page's is hidden: the machines' own ambient motion skips its writes then, build_www drink.js)
  T.holds = () => device.classList.contains('nd-t3d-full');
  const resetBtn = document.getElementById('reset');
  let off = false;

  /* ---------- the look a set of pictures belongs to, and what only redraws it ---------- */
  const M = () => MACHINES[__ND.cur];
  const zoomed = () => !!(__ND.cam && __ND.home && __ND.cam.w < __ND.home.w * .99);
  // (m: any machine, for the ones drawn ahead from the street; cats false: the family, the look without the cats, whose
  // latest set on disk serves while a new look is drawn; as: { xr, neon } for a look other than the one shown, drawn ahead)
  const xrFull = () => __ND.xr >= .998;
  // the set baked into the app for this look (ios TurnBake; tools/bake_turn.py): no upgrades or all of them (the nearer,
  // half or more fitted counting as all), 霓虹 or not, the X-ray or not
  function baked(as = {}, m = M()) {
    const parts = UPG.parts(m), fitted = parts.filter(p => UPG.level(m.id, p.id) > 0).length;
    const all = UPG.allIn(m) || (parts.length > 0 && fitted * 2 >= parts.length);
    const g = document.querySelector(`.mroot[data-m="${m.id}"]`), neon = as.neon ?? !!(g && g.classList.contains('nd-neon')), xr = as.xr ?? (m === M() && xrFull());
    return `${m.id}-${all ? 'all' : 'none'}-${neon && all ? 'neon' : 'comic'}-${xr ? 'xr' : 'plain'}`;
  }
  function lookKey(z = zoomed(), m = M(), cats = true, as = {}) {
    const c = __ND.cam || {};
    // (the look: the page's, and the machine's own 涂装, platform/skin.js; the X-ray scanned all the way, 2026-10-23)
    const g = document.querySelector(`.mroot[data-m="${m.id}"]`), neon = as.neon ?? !!(g && g.classList.contains('nd-neon')), xr = as.xr ?? (m === M() && xrFull());
    return JSON.stringify([m.id, device.dataset.art, neon, UPG.levels(m), COLLECT.stickerOn(m.id), COLLECT.figureOn(m.id), cats ? JSON.stringify(NEKO.here(m.id)) : '', xr ? 'xr' : '',
      z ? [Math.round(c.x * 10), Math.round(c.y * 10), Math.round(c.w * 10)] : 'home', innerWidth, innerHeight,
      typeof MTEXT !== 'undefined' && MTEXT.lang !== 'ja' ? MTEXT.lang + (I18N.full ? ':full' : '') : '']);
    // (the language: the machine's painted words follow it, platform/mtext.js; the sets kept on disk outlive a change)
    // (no clock in the key: it held a 25-minute bucket, which asked for a whole new set every 25 minutes even when
    // nothing at this machine had changed — the cats that move on the street's 25-minute slots are NEKO.here above)
  }
  // what a sale or a restock changes: each slot's stock (the machines' X-ray labels count it, belt plates included)
  // and the goods with their prices; not what moves by itself (a plate going round)
  // (only when every label has a number: the cup machine's are null, its stock is in count() alone)
  const slotsNow = (m = M()) => { try { const n = m.labels().map(l => l.n); if (n.length && n.every(Number.isFinite)) return n.map(x => x | 0); } catch (e) { /* none */ } return [m.count()]; };
  const sigNow = (m = M()) => { try { return JSON.stringify(ECON.sigOf(m)); } catch (e) { return ''; } };
  // (the stock as a set is asked with: its ver)
  const verNow = (m = M()) => JSON.stringify({ slots: slotsNow(m), sig: sigNow(m), total: m.count() });
  // EAGER: every sale redraws at once, as before: 性能模式 in the settings (the user's choice, 2026-10-20; the row is
  // added below), or TURN.eager for checks
  const EAGER = () => !!T.eager || !!(typeof SETTINGS !== 'undefined' && SETTINGS.prefs && SETTINGS.prefs.perf);   // (SETTINGS: a top-level const, not on window)
  const QUIET = 30e3, EVERY = 180e3;

  /* ---------- asking for pictures ---------- */
  // drawn: the stock and goods the current set was asked with; lastSale: when a slot last changed; lastDraw: per machine
  let asked = '', drawn = null, seen = '', lastSale = 0, lastTouch = 0, awaySince = 0;
  const lastDraw = new Map(), idle = new Map();   // (idle: per machine, its stock when last seen not busy)
  // fingers on the screen: no pictures are asked for while one is down (a pinch: each zoom level on the way asked for a
  // whole set of 79). A first finger clears any the page lost; one that seems held for 10 s without moving no longer
  // counts. (Not #cam's transform: the game leaves it on after a flight lands, until the camera is next applied)
  const fingers = new Set();
  addEventListener('pointerdown', e => { lastTouch = performance.now(); if (e.isPrimary) fingers.clear(); fingers.add(e.pointerId); }, true);
  addEventListener('pointermove', () => { lastTouch = performance.now(); }, { capture: true, passive: true });
  for (const t of ['pointerup', 'pointercancel']) addEventListener(t, e => { lastTouch = performance.now(); fingers.delete(e.pointerId); }, true);
  const touching = () => fingers.size > 0 && performance.now() - lastTouch < 10e3;
  const restocking = () => { const a = document.getElementById('allrun'); return !!a && !a.hidden; };
  let shownM = null;
  const tick = () => {
    // (the safety net: no turn, nothing coming back, yet a picture up or a part of a machine left out — or the machine in
    // view is another one: the live machine back and the picture gone)
    const mNow = __ND.view === 'machine' ? __ND.cur : -1;
    if (T.stuck() || (!T.active && mNow !== shownM && (hidden.length || (canvas && canvas.style.opacity === '1')))) dropPictures();
    shownM = mNow;
    // (during a turn the game draws itself, its set is asked for all the same: on the phone a player who kept turning
    // right after going in had none for 9 s)
    if (off || (T.active && T.mode !== 'live')) return;
    // on the street for half a minute: the pictures go from the page (they come back from disk on the next machine)
    if (__ND.view !== 'machine') { if (!awaySince) awaySince = performance.now(); else if ((sets.size || asked) && performance.now() - awaySince > 30000) release(); ahead(); return; }
    awaySince = 0;
    if (t3dLook(M(), { xr: __ND.xr > .002 })) { if (!T.active && !zoomed()) t3dCams(); return; }   // (the shell's model turns it: no pictures; its table ready)
    // (full 3D: no pictures for it while its model comes either — a turn before the 3D has it is the game's own, lighter
    // (nd-lod below), as in the cloud always. Drawn in the shell's second page, they took the phone's CPU, GPU and memory
    // from the model's loading at each machine, and were ready only after the 3D: the owner's yes, 2026-11-01; with
    // ios TurnRenderer.ahead off in full 3D, nothing drawn ahead either)
    if (t3dFull && device.dataset.art === 'zzz') return;
    { const id = M().id, k = opened.indexOf(id); if (k !== 0) { if (k > 0) opened.splice(k, 1); opened.unshift(id); } }
    if (!T.active && asked) { const [, k] = setFor(asked); if (k) keep(k, __ND.yaw); }   // (the camera can move without a turn: 复位视角)
    // (the X-ray scanned all the way has a set of its own, turnAhead: 2026-10-23; while it sweeps, none)
    // (a machine busy with a sale or with work of its own may be drawn meanwhile, turnAhead: the sushi machine making
    // plates one after another was busy for 5 s on opening, and its pictures were only asked for after)
    const busy = !!(M().isBusy && M().isBusy());
    if (__ND.mode !== 'shut' || (__ND.xr > .002 && !(window.__ndTurnAhead && xrFull())) || restocking() || GAME.paused || document.hidden || !(GAME.canTurn || (busy && window.__ndTurnAhead))) return;
    const now = performance.now(), look = lookKey();
    // (nothing asked for while a finger is down — a pinch asked for a set at every zoom on the way — unless at the home
    // view this look has no pictures at all yet: then at once, the finger may be turning it now)
    const none = !(sets.get(look) && sets.get(look).pics.size);
    if ((now - lastTouch < 400 || touching()) && (zoomed() || !none)) return;
    // (the total too: the ramen machine's labels count only the bowls of its current menu, not the old menu's left)
    // (busy, turnAhead: the stock as it stood between its sales — the sushi machine takes a slice out as it makes a plate
    // and counts it again once the plate is on the belt: a set asked for midway was of no use once it was done)
    const id = M().id; let slots = slotsNow(), sig = sigNow(), total = M().count();
    if (!busy) idle.set(id, { slots, sig, total }); else if (window.__ndTurnAhead && idle.has(id)) ({ slots, sig, total } = idle.get(id));
    if (JSON.stringify(slots) !== seen) { seen = JSON.stringify(slots); lastSale = now; }
    let reload = look !== asked || !drawn;
    // a look changed: only its set and the home view's stay (zoomed in and back out, the home set is there at once);
    // turnAhead, the machine's last few looks too (霓虹 or the X-ray switched off again: its set at once, the phone
    // turned the drink machine in the game's own drawing at 300 ms a step while the plain set came back from disk)
    if (look !== asked) {
      const home = lookKey(false), id = JSON.stringify(M().id), mine = [...sets].filter(([k]) => k.startsWith('[' + id + ',')).sort((a, b) => (b[1].used || 0) - (a[1].used || 0));
      const stay = new Set([look, home, ...(window.__ndTurnAhead ? mine.slice(0, 4).map(([k]) => k) : [])]);
      for (const [k, s] of sets) if (!stay.has(k) && !(s.coming && now - s.used < 10e3) && !(s.light && now - s.used < 60e3)) { closeSet(s); sets.delete(k); }
    }
    { const s = sets.get(look); if (s) { s.used = now; s.coming = false; } }
    // a set already there for this look (back at the home view): no new set, only what the stock asks for below
    const have = sets.get(look);
    if (reload && have && (have.complete || have.pre) && have.drawn && !have.light) { asked = look; drawn = have.drawn; reload = false; }
    if (!reload) {
      const was = drawn.slots, same = slots.length === was.length && slots.every((n, k) => n === was[k]);
      if (sig === drawn.sig && same && total === drawn.total) return;
      const restock = sig !== drawn.sig || slots.length !== was.length || slots.some((n, k) => n > was[k]) || total > drawn.total;
      const visible = slots.some((n, k) => (was[k] > 0 && n === 0) || was[k] - n >= 2);
      if (!EAGER() && !restock && !(visible && now - lastSale >= QUIET && now - (lastDraw.get(id) ?? -Infinity) >= EVERY)) return;
    }
    asked = look; drawn = { slots, sig, total }; lastDraw.set(id, now);
    let s = sets.get(look); if (!s) sets.set(look, s = { pics: new Map(), complete: false }); s.drawn = drawn; s.ver = JSON.stringify(drawn); s.light = false;
    const c = __ND.cam, y = __ND.yaw;
    const yaws = order(y);
    NATIVE.post('turnPrepare', { key: look, machine: M().id, state: JSON.stringify(__ND.state()), lang: STORE.get('nandemo-lang') || '', pay: STORE.get('nandemo-purchases') || '', reload,
      cam: zoomed() ? { x: c.x, y: c.y, w: c.w, h: c.h, zoomed: true } : {}, yaw: y, yaws, scale: SCALE, ver: JSON.stringify(drawn), family: lookKey(zoomed(), M(), false), grid: GRID_YAWS.length, xr: xrFull(), baked: zoomed() ? undefined : baked() });
  };
  setInterval(() => { tick(); loading(); readyAhead(); }, 250);
  // (a look changed by a tap: asked for at once, so a turn right after has its set from disk — the 涂装 chip, once the
  // chip has switched it; the X-ray as it is switched on, before its scan reaches the bottom: on the phone a turn 3.5 s
  // after the tap found the set still on its way, asked for only once the scan was done)
  function prefetch(as, m = M()) {
    if (!window.__ndTurnAhead || off || T.active || __ND.view !== 'machine' || (m === M() && zoomed())) return;
    if (t3dLook(m, as)) return;
    const look = lookKey(false, m, true, as), was = sets.get(look); if (was && !was.light) return;
    const s = was || { pics: new Map(), complete: false }; Object.assign(s, { pre: true, light: false, coming: m !== M(), used: performance.now(), drawn: { slots: slotsNow(m), sig: sigNow(m), total: m.count() } }); s.ver = JSON.stringify(s.drawn); sets.set(look, s);
    const y = __ND.yaw;
    NATIVE.post('turnPrepare', { key: look, machine: m.id, state: JSON.stringify(__ND.state()), lang: STORE.get('nandemo-lang') || '', pay: STORE.get('nandemo-purchases') || '', reload: true, cam: {}, yaw: y,
      yaws: order(y), scale: SCALE, ver: JSON.stringify(s.drawn), family: lookKey(false, m, false, as),
      grid: GRID_YAWS.length, xr: !!as.xr, baked: baked(as, m) });
  }
  /* the looks a player may show next, readied (turnAhead, 2026-10-23: on the phone the first drag right after opening a
     machine, switching 霓虹 or ‹ › found nothing decoded, and the game drew the turn at 250–400 ms a step): each street
     machine as it is, and the machine in view's other 涂装 and the X-ray — the few pictures nearest the angle it would
     come up at, from its own set on disk or a stand-in, nothing drawn for them (serveOnly), the nearest one decoded.
     Again once the angle has moved; not while a finger is down or a turn is on */
  let readiedAt = 0, readiedYaw = NaN;
  function readyAhead() {
    if (!window.__ndTurnAhead || off || T.active || touching() || GAME.paused || document.hidden || restocking()) return;
    const now = performance.now(); if (now - readiedAt < 1500) return;
    if (__ND.view === 'machine' && (__ND.mode !== 'shut' || zoomed())) return;
    readiedAt = now;
    if (Math.abs(__ND.yaw - readiedYaw) > .5) { readiedYaw = __ND.yaw; for (const [k, s] of sets) if (s.light && s.yaw !== undefined && Math.abs(s.yaw - __ND.yaw) > .5) { closeSet(s); sets.delete(k); } }
    const here = [...document.querySelectorAll('#street-svg .st-m')].map(g => MACHINES[+g.dataset.i]).filter(Boolean);
    const want = here.map(m => [m, {}]);
    if (__ND.view === 'machine') {
      const m = M(), g = document.querySelector(`.mroot[data-m="${m.id}"]`), neon = !!(g && g.classList.contains('nd-neon'));
      want.unshift([m, { xr: !(__ND.xr >= .998) }]); if (window.SKIN && SKIN.canWear && SKIN.canWear(m)) want.unshift([m, { neon: !neon }]);
    }
    for (const [m, as] of want) {
      if (t3dLook(m, as)) continue;
      const look = lookKey(false, m, true, as); if (sets.has(look)) continue;
      const drawnM = { slots: slotsNow(m), sig: sigNow(m), total: m.count() }, s = { pics: new Map(), complete: false, pre: true, light: true, used: now, yaw: __ND.yaw, drawn: drawnM, ver: JSON.stringify(drawnM) };
      sets.set(look, s);
      NATIVE.post('turnPrepare', { key: look, machine: m.id, state: '', lang: '', pay: '', reload: false, cam: {}, yaw: __ND.yaw, yaws: [], scale: SCALE, ver: s.ver,
        family: lookKey(false, m, false, as), grid: GRID_YAWS.length, xr: !!as.xr, baked: baked(as, m), serveOnly: true, near: 5 });
    }
  }
  // (the game, as ‹ › starts sliding to machine i, build_www turn_settle: its set asked for then, at its home view, not
  // once the slide is over — on the phone a drag 0.7 s after the tap found nothing yet and the game drew the turn)
  // (full 3D, the switching 2026-11-01: the machine leaving stays the shell's and slides out as the page moves its groups
  // (the hold's dx, as a sale's jolt), the one coming drawn by the page meanwhile (nd-t3d-web, ui.css), not the 3D standing
  // still 1.8 s and then cut to a machine with empty shelves; once it has come the page shows it whole and the shell takes
  // it when its pictures are all there, the see in the tick. Let go instead, the page's first frame of both machines took
  // 0.35–0.9 s, the slide a jump. And the models asked for around the machine coming, now, not once it has come, t3dWant)
  T.coming = (i, dir) => { const m = MACHINES[i]; if (!m) return; prefetch({ xr: false }, m);
    if (t3dFull && T3D.shellId) { T3D.slide = { i, at: performance.now() }; if (dir) T3D.dir = dir; t3dWebRoots(m.id); t3dWant(); } };
  // (and each step of that slide, build_www turn_settle: the machine leaving told where the page has just put it, in the
  // frame itself. Read by the hold tick, it was a frame late, the tick running before the slide's step: on the phone a
  // jump's first frames, long ones, stood the machine coming over the 3D one still where it was, 2026-11-01)
  T.slid = dx => { const s = T3D.holdBase; if (!t3dFull || !T3D.slide || !T3D.under || !T3D.held || T.active || !s || s.m !== M().id || T3D.heldM !== s.m) return;
    const row = s.row.slice(); row[2] += row[1] * dx; row[3] += row[1] * s.jolt;
    NATIVE.post('turn3d', { type: 'hold', machine: s.m, ...s.msg, cams: [row] }); };
  // (the page's groups of machine id drawn by the page while the shell holds another, none: back to the rule)
  function t3dWebRoots(id) { for (const r of cam.querySelectorAll('.mroot.nd-t3d-web')) if (r.dataset.m !== id) r.classList.remove('nd-t3d-web');
    if (id) for (const r of cam.querySelectorAll(`.mroot[data-m="${id}"]:not(.nd-t3d-web)`)) r.classList.add('nd-t3d-web'); }
  // (and a machine tapped on the street: its model asked for as it is tapped, not once the camera has flown in, 0.5 s on)
  document.addEventListener('click', e => { const g = t3dFull && T3D.shellId && __ND.view === 'street' && e.target.closest && e.target.closest('.st-m[data-i]');
    if (g) { T3D.toward = { i: +g.dataset.i, at: performance.now() }; t3dWant(); } }, true);
  document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('#nd-skin, #xray'); if (!t) return;
    if (t.id === 'xray') { if (__ND.xr < .5) prefetch({ xr: true }); setTimeout(tick, 1350); }
    else setTimeout(() => { prefetch({}); tick(); }, 0); }, true);

  /* ---------- drawn ahead, from the street (2026-10-23, the owner: players judge the game by its first turn) ----------
     While the player looks at the street, the sets of its machines are asked for in the background, the one opened last
     first: the shell draws each only when nothing else is asked for, and keeps it on disk with the stock it shows, so
     the machine opened next turns with pictures from the first touch. Asked again only when a machine's look or stock
     has changed since; not while a finger is down, during 全部补货, the cats' meal or with the game paused. Each machine
     its most turned-to angles first (within NEAR of the front), then all of them, the rest of its angles after. Then the
     same for the X-ray scanned all the way, and for the other 涂装 of each machine that may wear 霓虹 (the owner, 2026-10-23:
     turning under the X-ray, or right after switching the look, as smooth as any) */
  const aheadSent = new Map(), opened = [], NEAR = 30, AGAIN = 10 * 60e3;
  function ahead() {
    if (!window.__ndTurnAhead) return;   // (the way before: nothing drawn ahead; ios TurnRenderer.ahead)
    if (off || GAME.paused || document.hidden || restocking() || touching() || performance.now() - lastTouch < 1500) return;
    if (typeof STREET !== 'undefined' && STREET.dining) return;
    const here = [...document.querySelectorAll('#street-svg .st-m')].map(g => MACHINES[+g.dataset.i]).filter(Boolean);
    // (the machine opened last this session first; before any, the one the save was last on)
    const order = opened.length ? opened : [M().id];
    here.sort((a, b) => (order.indexOf(a.id) + 1 || 99) - (order.indexOf(b.id) + 1 || 99));
    let state = null; const rounds = [[], [], []];
    for (const m of here) {
      const g = document.querySelector(`.mroot[data-m="${m.id}"]`), neon = !!(g && g.classList.contains('nd-neon'));
      const looks = [{ xr: false, neon }, { xr: true, neon }];
      if (window.SKIN && SKIN.canWear && SKIN.canWear(m)) looks.push({ xr: false, neon: !neon });
      looks.forEach((as, r) => {
        if (t3dLook(m, as)) return;
        const key = lookKey(false, m, true, as), drawnM = { slots: slotsNow(m), sig: sigNow(m), total: m.count() }, ver = JSON.stringify(drawnM), tag = m.id + ':' + r;
        if (!r) idle.set(m.id, drawnM);   // (on the street a machine is never busy)
        // (a sale changes the stock, not the look: a look is asked again only after AGAIN. On the phone each sale on the
        // street had a set drawn anew, and the drawing hardly stopped: the phone went from cool to hot in 80 s. Opened,
        // a machine gets the latest set of its look at once and its own stock drawn over it there)
        const was = aheadSent.get(tag), now = performance.now();
        if (was && was.key === key && now - was.at < AGAIN) return;
        aheadSent.set(tag, { key, at: now });
        state = state || JSON.stringify(__ND.state());
        let st = state;
        if (as.neon !== neon) { const o = JSON.parse(state), n = new Set(o.neon || []); as.neon ? n.add(m.id) : n.delete(m.id); o.neon = [...n]; st = JSON.stringify(o); }   // (renderer.js reads 霓虹 from the save)
        rounds[r].push({ key, machine: m.id, state: st, lang: STORE.get('nandemo-lang') || '', pay: STORE.get('nandemo-purchases') || '', reload: true, cam: {}, yaw: 0, scale: SCALE, ver, family: lookKey(false, m, false, as),
          background: true, grid: GRID_YAWS.length, xr: as.xr });
      });
    }
    const all = GRID_YAWS.slice().sort((a, b) => Math.abs(a) - Math.abs(b));
    for (const asks of rounds) {
      asks.forEach(a => NATIVE.post('turnPrepare', { ...a, yaws: all.filter(y => Math.abs(y) <= NEAR) }));
      asks.forEach(a => NATIVE.post('turnPrepare', { ...a, yaws: all }));
    }
  }
  // a set drawn so far (nearest angles first) is enough for a turn that starts where its pictures cover ±COVER, one
  // every 4° at least (an angle missing between two that are there: the nearest shows)
  const COVER = 12;
  const covered = (s, y) => !!s && GRID_YAWS.filter(g => Math.abs(g - y) <= COVER).every(g => s.pics.has(g) || (s.pics.has(g - GRID) && s.pics.has(g + GRID)));
  // the order a set is drawn in, for the machine in view: the angle the camera stands at, then one every 4° within
  // COARSE of it (a turn has its pictures after ~7 of them, about a second on the phone), then the rest nearest first
  const COARSE = 24;
  function order(y) {
    const near = (a, b) => Math.abs(a - y) - Math.abs(b - y);
    const coarse = GRID_YAWS.filter(g => Math.abs(g - y) <= COARSE && Math.round(g / GRID) % 2 === 0).sort(near);
    return [y, ...coarse, ...GRID_YAWS.filter(g => !coarse.includes(g)).sort(near)];
  }

  /* ---------- the pictures ----------
     Kept as they come (PNG, compressed), and decoded only near the angle shown: WIDE pictures each side (2° apart),
     more of them ahead of the finger while it turns; the rest closed. A whole set decoded was ~640 MB of the game page's
     memory on an iPhone 13 Pro (78 bitmaps; 177 MB in the simulator). Drawing takes the nearest picture that is
     decoded, so a finger faster than the decoding shows the nearest one ready, never a blank. */
  const WIDE = 12, AHEAD = 8;
  const sets = new Map();   // look → { pics: Map(yaw → { blob, bmp, job, x, y, w, h }), complete }
  const drop = p => { p.dropped = true; if (p.bmp) { p.bmp.close(); p.bmp = null; } };
  const closeSet = s => { for (const p of s.pics.values()) drop(p); s.pics.clear(); };
  // the decoding is done by a worker, off the main thread (decoded there, a turn's frames waited on it: p95 445 ms
  // in the simulator), the bitmap handed back transferred, not copied. A worker that cannot decode: the main thread
  let worker = null, jobs = 0; const waiting = new Map();
  try {
    worker = new Worker(URL.createObjectURL(new Blob([`onmessage = e => { const { id, blob } = e.data;
      try { createImageBitmap(blob).then(b => postMessage({ id, bmp: b }, [b]), x => postMessage({ id, err: String(x) })); }
      catch (x) { postMessage({ id, err: String(x) }); } };`], { type: 'text/javascript' })));
    // (a reply that comes after its job gave up: its bitmap is closed, nothing else holds it)
    worker.onmessage = e => { const f = waiting.get(e.data.id); waiting.delete(e.data.id); if (f) f(e.data); else if (e.data.bmp) e.data.bmp.close(); };
    worker.onerror = worker.onmessageerror = () => { worker = null; for (const f of waiting.values()) f({ err: 'worker' }); waiting.clear(); };
  } catch (e) { worker = null; }
  T.decoder = () => worker ? 'worker' : 'main';   // (checks)
  // any failure (an error, no answer within 3 s, a blob it cannot be sent): this one and all later ones on the main thread
  const bitmapOf = blob => !worker ? createImageBitmap(blob) : new Promise(res => {
    const id = ++jobs;
    const timer = setTimeout(() => { const f = waiting.get(id); waiting.delete(id); if (f) f({ err: 'timeout' }); }, 3000);
    waiting.set(id, r => { clearTimeout(timer); if (r.bmp) res(r.bmp); else { worker = null; T.decodeErr = r.err; res(createImageBitmap(blob)); } });
    try { worker.postMessage({ id, blob }); } catch (x) { waiting.get(id)({ err: String(x) }); waiting.delete(id); }
  });
  // two at a time, the nearest to the angle first (a quick sweep asks for more than can be decoded: the ones it has
  // left behind are dropped from the queue, not decoded and closed)
  let queue = [], flying = 0;
  const pump = () => {
    while (flying < 2 && queue.length) {
      const p = queue.shift(); if (!p.want || p.bmp || p.job || p.dropped) continue;
      flying++;
      const done = b => { p.job = null; flying--; if (b) { if (p.dropped || !p.want) b.close(); else p.bmp = b; } pump(); };
      p.job = bitmapOf(p.blob).then(done, () => done(null));
    }
  };
  // the pictures to have decoded around angle y: WIDE each side, and AHEAD more in the direction it is going. Only for
  // the set of the look shown (the queue is that set's)
  function keep(s, y, dir = 0) {
    if (!s || !s.pics.size) return;
    const keys = [...s.pics.keys()].sort((a, b) => a - b);
    let i = 0; for (let k = 0; k < keys.length; k++) if (Math.abs(keys[k] - y) < Math.abs(keys[i] - y)) i = k;
    if (i === s.keptAt && dir === s.keptDir) return;
    s.keptAt = i; s.keptDir = dir;
    // (the other set kept, the home view's while zoomed in: none of it decoded meanwhile)
    for (const o of sets.values()) if (o !== s && !o.light && !Number.isNaN(o.keptAt)) { o.keptAt = NaN; for (const p of o.pics.values()) { p.want = false; if (p.bmp) { p.bmp.close(); p.bmp = null; } } }
    const lo = i - WIDE - (dir < 0 ? AHEAD : 0), hi = i + WIDE + (dir > 0 ? AHEAD : 0);
    keys.forEach((k, n) => {
      const p = s.pics.get(k); p.want = n >= lo && n <= hi;
      if (!p.want && p.bmp) { p.bmp.close(); p.bmp = null; }
    });
    queue = keys.map((k, n) => [Math.abs(n - i), s.pics.get(k)]).filter(([, p]) => p.want && !p.bmp && !p.job).sort((a, b) => a[0] - b[0]).map(([, p]) => p);
    pump();
  }
  T.decoded = () => { const s = sets.get(T.look || asked); return s ? [...s.pics.values()].filter(p => p.bmp).length : 0; };   // (checks)
  T.picture = async info => {
    if (off) return;
    const s = sets.get(info.key); if (!s) return;   // (asked for, then dropped: the renderer finishes the old job)
    // (one picture an angle, the best there is: this look with this stock, then this look with another, then a stand-in
    // of the look without the cats or baked into the app; one handed over again is kept as it is)
    const was = s.pics.get(info.yaw);
    if (was && ((was.path === info.path && was.ver === info.ver) || rank(s, was) > rank(s, info))) return;
    try {
      const blob = await (await fetch(info.path)).blob();
      if (off || sets.get(info.key) !== s) return;   // (released meanwhile)
      const old = s.pics.get(info.yaw); if (old) drop(old);
      s.pics.set(info.yaw, { blob, bmp: null, job: null, x: info.x, y: info.y, w: info.w, h: info.h, world: info.world || null, ver: info.ver, stand: !!info.stand, path: info.path });   // (world: baked into the app, below)
      // decoded now only for the look shown: during a turn around the finger (the game's own angle stays where the
      // turn began until it ends), else around the camera; a set being drawn for another look waits until it is shown
      s.keptAt = NaN;
      if (s.wanted && s.pics.size >= s.wanted) { s.complete = true; ensureCanvas(); }   // (first: setFor() picks complete sets)
      if (!T.active) { if (info.key === setFor(asked)[0]) keep(s, __ND.yaw); }
      else if (T.mode === 'pictures' && info.key === T.set) keep(s, lastYaw, lastDir);
      if (s.light) { const p = s.pics.get(info.yaw), y = s.yaw ?? __ND.yaw, near = [...s.pics.keys()].every(k => Math.abs(info.yaw - y) <= Math.abs(k - y));
        if (near && !p.bmp && !p.job) { p.want = true; p.job = bitmapOf(p.blob).then(b => { p.job = null; if (p.dropped || !p.want) b.close(); else p.bmp = b; }, () => { p.job = null; }); } }
      loading();
    } catch (e) { /* (a picture missed: the turn falls back to the game's own drawing when the set is not complete) */ }
  };
  // native: every picture of the set is out (their fetching may still be under way: complete once all are in)
  T.complete = key => { const s = sets.get(key); if (!s) return; s.wanted = GRID_YAWS.length; if (s.pics.size >= s.wanted) { s.complete = true; ensureCanvas(); } };
  const rank = (s, p) => p.stand ? 0 : p.ver === s.ver ? 2 : 1;
  // the share of the set drawn on this phone (any stock, the cats as they were too): the progress the cat at the bottom
  // left shows. Only the pictures baked into the app count as not yet (the owner, 2026-10-23: the cat came back each
  // time the view was zoomed or a cat moved, while the machine turned in pictures of its own look all the same)
  const own = s => { let n = 0; for (const p of s.pics.values()) if (!p.world) n++; return Math.min(1, n / GRID_YAWS.length); };
  function release() {
    for (const s of sets.values()) closeSet(s);
    sets.clear(); asked = ''; drawn = null;
    NATIVE.post('turnRelease', {});
  }
  T.at = () => at;   // (checks)
  T.state = info => { T.drawing = info.drawing ? info : null; T.thermal = info.thermal; };   // (checks: native, the second page drawing or not, and the phone's heat)
  T.ready = () => { const [, s] = setFor(lookKey()); return !!(s && s.complete); };   // (checks: a turn now would have its pictures)
  T.off = () => { off = true; release(); };   // (native: memory warning, or the second page ended)

  /* ---------- the canvas in the stage ---------- */
  // made once a set is complete and kept, transparent, as its own layer: showing it is only its opacity
  let canvas = null, ctx = null;
  function ensureCanvas() {
    const r = cam.getBoundingClientRect(), dpr = devicePixelRatio || 1, W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
    if (!canvas) {
      canvas = document.createElement('canvas'); canvas.id = 'nd-turn';
      canvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;opacity:0;will-change:opacity';
      cam.appendChild(canvas); ctx = canvas.getContext('2d');
    }
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    origin = { left: r.left, top: r.top, W: r.width, dpr };
  }
  let at = null, origin = null;
  // the set a turn would show now: the look's own once complete; zoomed in before that, the home view's, drawn at the
  // zoom (softer, until the zoomed set is drawn: right after a zoom the game drew the turn itself, about a frame a second)
  function setFor(look) {
    const s = sets.get(look); if ((s && s.complete) || !zoomed()) return [look, s];
    const hk = lookKey(false), hs = sets.get(hk); return hs && hs.complete ? [hk, hs] : [look, s];
  }
  // a home picture taken at angle Y (framed by the home camera at Y) onto the zoomed camera at Y, which orbits the point
  // at the centre of the view as the game's own turn does (__ND.camsAt: setYaw's two cameras at Y, nothing drawn):
  // screen = o + (world − camera) · k, with o and k from the stage's transform now (the same aspect: the content starts
  // at the same place on the screen for both cameras). Mapped through the start angle's cameras alone, a picture drifted
  // as the turn went on and jumped where the game drew the end (Chromium, 1.7×, 24°: 14 px across, 8 px down)
  function zoomMap() {
    const m = t3dStageM(), c = __ND.cam, h = __ND.home; if (!m || !c || !h || !(c.w > 0) || !__ND.camsAt) return null;
    // (the cameras the turn starts from, kept: a drag landing in the two frames after 'end' finds the game's moved on)
    const f = h.w / c.w, ox = m.e + m.a * c.x, oy = m.f + m.d * c.y, from = { cam: { ...c }, yaw: __ND.yaw }, byYaw = new Map();
    const shift = Y => { let d = byYaw.get(Y); if (!d) { const { home: hY, cam: cY } = __ND.camsAt(Y, from); d = [(hY.x - cY.x) * m.a, (hY.y - cY.y) * m.d]; byYaw.set(Y, d); } return d; };
    return { f, x: (v, Y) => ox + shift(Y)[0] + (v - ox) * f, y: (v, Y) => oy + shift(Y)[1] + (v - oy) * f };
  }
  // the camera the game would have at angle Y in this turn (__ND.camsAt from where it began: at home each angle frames
  // itself, zoomed in it orbits the point in the middle), for the pictures baked into the app; per turn, per angle
  let cams = new Map(), camsFrom = null;
  function camAt(Y) {
    if (!camsFrom) camsFrom = { cam: { ...__ND.cam }, yaw: __ND.yaw };
    let c = cams.get(Y); if (!c) { const r = __ND.camsAt(Y, camsFrom); c = zoomed() ? r.cam : r.home; cams.set(Y, c); }
    return c;
  }
  function draw(y) {
    const s = sets.get(T.set || T.look); if (!s || !canvas) return;
    // the nearest decoded picture (a cross-fade of two pictures 2° apart shows a double outline while the finger
    // rests), at its own size where it was taken at the screen's density (pixel for pixel, no resampling). None
    // decoded: the canvas keeps what it shows
    let k = null; for (const [yaw, q] of s.pics) if (q.bmp && (k === null || Math.abs(yaw - y) < Math.abs(k - y))) k = yaw;
    if (k === null) return;
    const t0 = performance.now();
    const { left, top, dpr } = origin;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const p = s.pics.get(k), z = T.map;
    let pw, ph, x, yy;
    if (p.world) {   // (baked into the app: its box in the stage's units, onto the camera the game has at that angle here)
      const c = camAt(k), sc = origin.W / c.w; pw = p.world.w * sc; ph = p.world.h * sc;
      x = Math.round((p.world.x - c.x) * sc * dpr); yy = Math.round((p.world.y - c.y) * sc * dpr);
    } else {
      pw = z ? p.w * z.f : p.w; ph = z ? p.h * z.f : p.h;
      x = Math.round(((z ? z.x(p.x, k) : p.x) - left) * dpr); yy = Math.round(((z ? z.y(p.y, k) : p.y) - top) * dpr);
    }
    if (Math.abs(pw * dpr / p.bmp.width - 1) < .01) ctx.drawImage(p.bmp, x, yy);
    else { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(p.bmp, x, yy, Math.round(pw * dpr), Math.round(ph * dpr)); }
    T.shown = k; T.shownStand = !!p.stand; T.drawMs = performance.now() - t0;   // (checks: the angle on screen, a stand-in or not, and what drawing it took)
  }
  let raf = 0;
  const want = y => { at = y; if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (T.mode === 'pictures') draw(at); else if (T.mode === 'live' && Math.abs(at - __ND.yaw) >= 1) __ND.shot(at); }); };
  // during a turn the live machine is out of the layout (.nd-off, display: none: nothing of it is laid out or
  // painted, not even the game's redraw at the final angle). Coming back, one group a frame — the front, the shell,
  // the backdrop and floor, the insides — under the canvas, which goes after the last: the redraw's layout and painting
  // are spread over several short frames instead of one long one
  // (every part of the machine in each layer, the front first, the insides last)
  const groupsOf = () => ['#world-top', '#world-ext', '#world-ghost', '#world'].flatMap(l => {
    const r = document.querySelector(`${l} .mroot[data-m="${M().id}"]`); return r ? [...r.children] : []; });
  let hidden = [], restoring = 0;
  function showPictures(y) {
    cancelAnimationFrame(restoring); restoring = 0;
    // (groups still out from the turn before, whose return this turn cut short — another machine's, after ‹ › — back at
    // once: dropped from the list, they stayed out for good, the old picture over them; the owner 2026-10-23, a ghost)
    const now = groupsOf(); hidden.forEach(g => { if (!now.includes(g)) g.classList.remove('nd-off'); });
    ensureCanvas(); at = y; draw(y); canvas.style.opacity = '1';
    if (window.__ndFlags && __ndFlags.turnKeepLive) { hidden = []; return; }   // (experiment: the live machine stays, under the canvas)
    hidden = now; hidden.forEach(g => g.classList.add('nd-off'));   // (a class: the game's own display settings stay as they are)
  }
  function hidePictures() {
    const next = () => { const g = hidden.shift(); if (g) { g.classList.remove('nd-off'); restoring = requestAnimationFrame(next); return; }
      restoring = 0; if (T.mode !== 'pictures' && canvas) canvas.style.opacity = '0'; };   // (a live turn begun meanwhile: no picture over it)
    next();
  }
  // the live machine back at once and the picture gone: another machine, another view, or a turn the game draws itself
  function dropPictures() {
    cancelAnimationFrame(restoring); restoring = 0;
    hidden.forEach(g => g.classList.remove('nd-off')); hidden = [];
    document.querySelectorAll('.mroot .nd-off').forEach(g => g.classList.remove('nd-off'));
    if (canvas) canvas.style.opacity = '0';
  }
  T.stuck = () => !T.active && !restoring && (hidden.length > 0 || !!(canvas && canvas.style.opacity === '1'));   // (checks)

  // the angle a turn in pictures ends on: the one it shows (the game draws the machine there when the finger lifts)
  T.settle = y => { if (!T.active || T.mode !== 'pictures') return y;
    const s = sets.get(T.set || T.look); let k = null; if (s) for (const [yaw, q] of s.pics) if (q.bmp && (k === null || Math.abs(yaw - y) < Math.abs(k - y))) k = yaw;
    return k === null ? y : k; };

  /* ---------- the cat at the bottom left (turnAhead; the owner, 2026-10-23) ----------
     While the machine in view has less than all of its own pictures (a stand-in turns it meanwhile), a small cat in a
     ring at the bottom left, above the line of numbers: the ring fills as each of them comes in, a dot goes round it.
     Up half a second after the look comes up (a set from disk: nothing shows); it never stops a turn */
  const CAT = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="trk" cx="24" cy="24" r="19"/>'
    + '<circle class="arc" cx="24" cy="24" r="19" pathLength="100" stroke-dasharray="0 100"/>'
    + '<g class="orb"><circle cx="24" cy="5" r="2.6"/></g>'
    + '<g class="ears"><path class="ear l" d="M14.4 22.5 15.4 12.4 21.6 18z"/><path class="ear r" d="M33.6 22.5 32.6 12.4 26.4 18z"/>'
    + '<path class="pink" d="M16.3 19.4 16.8 15 19.6 17.6z M31.7 19.4 31.2 15 28.4 17.6z"/></g>'
    + '<ellipse class="head" cx="24" cy="26" rx="10.6" ry="8.9"/><path class="patch" d="M15.2 21.6c1.6-2.6 4.6-4.2 7.6-4.4-.6 2.8-2.6 5-5.6 5.8-.8.2-1.4-.4-2-1.4z"/>'
    + '<g class="eyes"><ellipse cx="20" cy="25.4" rx="1.35" ry="1.7"/><ellipse cx="28" cy="25.4" rx="1.35" ry="1.7"/></g>'
    + '<circle class="cheek" cx="18.2" cy="28.6" r="1.5"/><circle class="cheek" cx="29.8" cy="28.6" r="1.5"/>'
    + '<path class="nose" d="M23 28.1h2l-1 1.1z"/><path class="line" d="M21.8 29.7c.5.8 1.6.8 2.2 0 .6.8 1.7.8 2.2 0 M12.6 26.8l4.2.6 M12.8 29.4l4-.3 M35.4 26.8l-4.2.6 M35.2 29.4l-4-.3"/></svg>';
  let ring = null, ringOn = false, lookSince = 0, lookWas = '';
  function showLoad(on, share = 0) {
    if (!ring) { if (!on) return; ring = document.createElement('div'); ring.id = 'nd-turnload'; ring.innerHTML = CAT; device.appendChild(ring); }
    // (above the line of numbers under the machine, whatever the screen: the bottom bar's top, from the device's)
    if (on && !ringOn) { const bar = document.querySelector('.bottombar'), d = device.getBoundingClientRect(), b = bar && bar.getBoundingClientRect(); if (b && b.height) ring.style.top = `${Math.round(b.top - d.top - 60)}px`; }
    ring.querySelector('.arc').setAttribute('stroke-dasharray', `${Math.max(3, Math.min(100, share * 100)).toFixed(1)} 100`);
    if (on !== ringOn) { ringOn = on; ring.classList.toggle('on', on); }
  }
  function loading() {
    if (!window.__ndTurnAhead || off || __ND.view !== 'machine' || document.hidden || __ND.mode !== 'shut' || t3dLook(M(), { xr: xrFull() })) { lookWas = ''; return showLoad(false, 1); }
    const look = lookKey(false), s = sets.get(look), share = s ? own(s) : 0;   // (the home view's: a zoomed set is drawn too, but turns in the home one meanwhile)
    if (look !== lookWas) { lookWas = look; lookSince = performance.now(); }
    T.progress = share;   // (checks)
    showLoad(share < 1 && performance.now() - lookSince > 500, share);
  }

  /* ---------- during a turn ---------- */
  // the set a turn at angle y would show now, and whether it can (pictures only when the one at this angle is decoded:
  // else the canvas would open on a neighbour; zoomed in, the home view's when the zoomed set, just complete, has none
  // decoded yet)
  function pick(y) {
    const ready = s => s && [...s.pics.entries()].some(([yaw, p]) => p.bmp && Math.abs(yaw - y) <= GRID);
    let [key, s] = setFor(T.look);
    if (key === T.look && zoomed() && !ready(s)) { const hk = lookKey(false), hs = sets.get(hk); if (hs && hs.complete && ready(hs)) { key = hk; s = hs; } }
    let map = key === T.look ? null : zoomMap();
    if (key !== T.look && !map) { key = T.look; s = sets.get(T.look); }
    // (turnAhead, at the home view: the picture at this angle decoded is enough — the rest come and are decoded around
    // the finger as it turns; until they do, the nearest one shows. On the phone a turn waiting for ±12° of them was
    // drawn by the game, 250–400 ms a step)
    const ok = !off && !!s && (s.complete || (window.__ndTurnAhead && !zoomed())) && ready(s) && (__ND.xr <= .002 || (window.__ndTurnAhead && xrFull()));
    return { key, s, map, ok };
  }
  /* ---------- the machine turned in 3D by the shell (Turn3D.swift; a test, the owner 2026-10-30: 120 fps) ----------
     With __ndFlags.turn3d, a machine whose 3D model the shell has loaded turns there: the shell draws it over the page
     at the screen's own rate and reads the finger itself; the page hides its own drawing of the machine (platform.css
     nd-t3d), passes on its angles (the spring back into range, the reset button) and draws the final angle as always.
     At the home view, closed, no X-ray: anything else turns as before */
  const T3D = { ready: new Set(), shellOf: {}, x0: 0, yaw0: 0, cams: new Map() };
  // the machines with models of their own in the app (ios/App/Turn3D/<id>, tools/turn3d T3D_MACHINE), each asked for at the start
  const T3D_MODELS = ['drink', 'teppan', 'frozen', 'ramen', 'cup', 'juice', 'auto', 'digital', 'locker', 'spiral', 'teishoku', 'sushi', 'oden', 'taiyaki', 'kakigori', 'gacha', 'kissa', 'bakery'];
  // 霓虹 (platform/skin.js: class nd-neon on the machine's groups), worn only with every upgrade fitted: models of its own,
  // tools/turn3d NEON=1, Turn3D/drink-neon and its X-ray drink-xr-neon (full 3D only: the turn alone keeps its pictures)
  const t3dNeon = (id = M().id) => { let g = T3D.neonG && T3D.neonG[id]; if (!g || !g.isConnected) g = (T3D.neonG || (T3D.neonG = {}))[id] = document.querySelector(`.mroot[data-m="${id}"]`);
    return !!(g && g.classList.contains('nd-neon')); };
  // (an upgrade that changes the door itself, the juice machine's fourth compartment: four menu tiles across, not three,
  // the model's three caps showing between the new ones; the auto restaurant's burger bay and curry station, each a menu
  // panel in place of its 近日登場 plate; the digital machine's charging station, on the side: a shell model of its own
  // for each level, as the X-ray's; 霓虹 wants every upgrade, one model). The spiral machine's counterweight and twin lane
  // stand behind its glass, seen without the X-ray; so do the teishoku's fryer and dessert shelf, through its kitchen window
  // turned past −20° (the dishwasher under the kitchen's floor: not), and the sushi's express lane, through its door's
  // window (its dome and burner: not); all three of the oden's, through its round window (the tank at +10°, the second
  // basket and the miso pot turned); the taiyaki's croissant roll, through its door's window, and its second row of
  // burners, a lamp on the door (the burners themselves not seen; the roller brush is __t3dK); all three of the kakigori's:
  // the block loader through its arched window (0° to −90°), the double blade a lamp on the door, the milk pump through
  // the window at −90°; the gacha's steep rails, the run's ramps through its window and a lamp on the door (its agitator
  // and jumbo wheels in the globes: __t3dK); the kissa's rinser (its spray head in the bowl at 0° and +10°), the soda
  // fountain (its bottles and the CO2 box through the window from −30° to −90°) and the halogen's lamp on the door; the
  // bakery's fryer, its vat in front of the belt through the door's window at every angle (the pie roller's table on the
  // cabinet's roof: not; its rollers and chute, the fryer's basket, the sandwich table: __t3dK; their stickers: live)
  const T3D_SHELL_PARTS = { juice: ['hopper'], auto: ['burger', 'curry'], digital: ['charger'], locker: ['big', 'lock'], spiral: ['lift', 'twin'], teishoku: ['fryer', 'dessert'], sushi: ['express'], oden: ['refill', 'basket2', 'miso'], taiyaki: ['fire', 'cro'], kakigori: ['loader', 'dblade', 'milk'], gacha: ['steep'], kissa: ['rinse', 'halogen', 'soda'], bakery: ['fryer'] };
  const t3dShellFor = (id, neon) => { if (t3dFull && neon) return id + '-neon'; const ps = T3D_SHELL_PARTS[id], m = ps && MACHINES.find(x => x.id === id), lv = m && UPG.levels(m);
    return id + (lv && ps.some(p => lv[p]) ? '-' + ps.map(p => p[0] + (lv[p] || 0)).join('') : ''); };
  const t3dShellId = id => t3dShellFor(id, t3dNeon(id));
  // the X-ray's model for the machine's upgrades (tools/turn3d T3D_PARTS): each part's first letter and level, in the
  // machine's order, none fitted none: drink-xr, drink-xr-r1h0, -r0h1, -r1h1; teppan-xr-f1s0i0 …
  // (an upgrade that changes nothing in the insides but its pin, a live part: one model for all its levels. The frozen
  // machine's defrost only shortens the defrost, its badge on the door live too; the spiral's drop sensor rides on its lift,
  // __t3dK)
  const T3D_XR_SAME = { frozen: ['defrost'], digital: ['charger'], spiral: ['eye'] };
  // (an upgrade whose levels past one change nothing in the insides but its pin: the teishoku's dishwasher, its second level
  // only more sets and faster washing; the model of its first)
  const T3D_XR_TOP = { teishoku: { wash: 1 } };
  const t3dXrId = id => { const m = MACHINES.find(x => x.id === id); if (!m) return id + '-xr'; if (t3dFull && t3dNeon(id)) return id + '-xr-neon';
    const lv = UPG.levels(m), top = T3D_XR_TOP[id] || {}, at = p => Math.min(lv[p] || 0, top[p] ?? 99), ps = UPG.parts(m).map(p => p.id).filter(p => !(T3D_XR_SAME[id] || []).includes(p));
    return id + '-xr' + (ps.some(p => at(p)) ? '-' + ps.map(p => p[0] + at(p)).join('') : ''); };
  const t3dLangNow = () => I18N.lang === 'ja' ? 'ja' : I18N.code + (I18N.full ? '-full' : '');
  // (full3d: the whole close-up in 3D, at rest and under the X-ray too: t3dHoldTick, the owner's ask 2026-10-30)
  const t3dFull = !!(window.__ndFlags && __ndFlags.full3d), t3dOn = t3dFull || !!(window.__ndFlags && __ndFlags.turn3d);
  // (full 3D: the page's root never painted, its body painting the page's background, see-through as the shell takes the
  // machine (nd-t3d-bg on the body, ui.css). The root's background changed restyled the whole page: 0.9 s at Chromium's 4×
  // slowdown as the shell took a machine and again as it let go; the body's, 5 ms, 2026-11-01)
  if (t3dFull) document.documentElement.classList.add('nd-t3d-on');
  // (a measurement, flag t3dquiet: the page's own insides not painted while the shell draws the machine, to see what the
  // page's see-through machine costs the phone's GPU at rest under X-ray; its taps inside (fan, tubes) do not work then)
  if (t3dFull && __ndFlags.t3dquiet) document.documentElement.classList.add('nd-t3d-quiet');
  window.__t3d = { ready: (id, shell) => { T3D.ready.add(id); T3D.shellOf[id] = shell || id; if (T3D.swapAt) { T3D.swapAt = 0; T3D.liveDirty = performance.now(); } setTimeout(() => { const m = MACHINES.find(x => x.id === id); if (m && !T.active) t3dDecals(m); }, 400); }, stats: s => { T.lastStats = s; console.log('turn3d', s); },
    // (tools/turn3d: what t3dK makes of a group now, and its state)
    k: sel => { const el = cam.querySelector(sel); return { items: el ? t3dKItems(el, window.__REC, !el.closest('.g-int')) : null, sel: T3D.kSel, dirty: T3D.kDirty && T3D.kDirty.size, seen: T3D.kSeen, reveal: !!T3D.reveal }; } };
  if (t3dOn) {
    // (its pictures in the language the machine's words are painted in, platform/mtext.js: tools/turn3d/langs.py)
    // (the X-ray's model asked for as the save has the upgrades now: the tick asks again when they change from this)
    T3D.xrId = {}; T3D.shellId = {};
    // (a press, for t3dMarks: which part, and when)
    if (typeof CORE !== 'undefined' && CORE.press && !CORE.press.t3d) { const p0 = CORE.press; CORE.press = el => { p0(el); if (el) { T3D.pressEl = el; T3D.pressAt = performance.now(); } }; CORE.press.t3d = true; }
    // (the models: only the machine in view and the two beside it on its street, t3dWant in the tick)
    // (where the finger went down and the angle then: the shell turns from there, as app.js does with down.x / yaw0)
    // (the angle the turn is at: a fling still gliding has not drawn its own yet, __ND.yaw is where the turn before began)
    cam.addEventListener('pointerdown', e => { T3D.x0 = e.clientX; T3D.yaw0 = __ND.turnYaw ?? __ND.yaw; }, true);
  }
  // a look the shell's model shows: the one tools/turn3d exported (the comic art, no 霓虹), no X-ray. Its turns, the
  // pinch and turns zoomed in are the shell's; and no pictures are drawn for it (below: tick, ahead, readyAhead)
  const t3dLook = (m = M(), as = {}) => { if (!t3dOn || !T3D.ready.has(m.id) || (as.xr && !t3dFull) || device.dataset.art !== 'zzz') return false;
    const now = t3dNeon(m.id), neon = as.neon ?? now; if (!t3dFull) return !neon;
    // (full: the look the shell holds now, 霓虹's model or the main one; the other one, asked for ahead, is the shell's too
    // once the switch has loaded it: no turning pictures drawn for it)
    // (and while the shell loads the look just worn, t3dSwap: it keeps the machine in the one it has)
    return neon !== now || t3dSwap() || (T3D.shellOf[m.id] || m.id) === t3dShellFor(m.id, neon); };
  // (霓虹 worn or taken off in full 3D: the shell keeps drawing the machine in the look it has till the other is loaded,
  // ~1.5 s on the phone, nothing of the new look sent to the old model meanwhile (the tick); 5 s at most, a model that
  // never comes. The page used to take the machine back meanwhile, drawing 霓虹 itself at 273 ms frames and the 3D
  // gone 1.5 s, and gone again as it painted the pictures for the new one, 2026-10-30)
  const t3dSwap = () => !!T3D.swapAt && performance.now() - T3D.swapAt < 5000;
  // (full 3D: the door's restock too, open to shut (app.js openDoor … closeDoor, build_www __ND.doorFlow): the shell draws
  // the door swung open, the insides through it, as it draws them under the X-ray; Turn3D.swift draw door:)
  const t3dDoorOf = (m = M()) => (window.__t3dMotion[m.id] || {}).door;
  const t3dCan = () => __ND.view === 'machine' && (__ND.mode === 'shut' || (t3dFull && (__ND.partFlow || __ND.doorFlow && !!(t3dDoorOf() || (window.__t3dMotion[M().id] || {}).kOpen)))) && (t3dFull || __ND.xr <= .002) && t3dLook(M(), { xr: __ND.xr > .002 });
  // how far the door stands open now, radians: its plane as iso.js recorded it (DKB.doorTransform: U = (cos a, sin a, 0))
  function t3dDoorA(m = M()) {
    const D = t3dDoorOf(m), R = window.__REC; if (!D || !R || !R.planes) return 0;
    let el = T3D.doorEl; if (!el || !el.isConnected || T3D.doorElM !== m.id) { el = T3D.doorEl = cam.querySelector(`.mroot[data-m="${m.id}"] ${D.el}`); T3D.doorElM = m.id; }
    const q = el && R.planes.get(el.getAttribute('transform')); return q ? Math.max(0, Math.atan2(q[1][1], q[1][0])) : 0;
  }
  // the door's two faces as the page shows them swung open, each painted whole once for what it shows (Turn3D "door"): the
  // front with its flat display in (drink.js setDoor: shown while the door is not shut), and the inside face; at the
  // screen's own pixels a unit, not the decals' 12 (the door is 120 × 240: 4 M pixels a face at 12)
  function t3dDoorPics(m = M()) {
    const D = t3dDoorOf(m); if (!D || !T3D.ready.has(m.id)) return;
    const door = cam.querySelector(`.mroot[data-m="${m.id}"] ${D.el}`), out = door && door.querySelector(D.out), inn = door && door.querySelector(D.in); if (!out || !inn) return;
    const b = T3D.box, px = Math.min(T3D_PX, Math.max(4, Math.ceil((b && __ND.cam ? b.W / __ND.cam.w : 2) * (devicePixelRatio || 2) * 1.15)));
    // (what each face shows, whether the page shows it now or not: drink.js setDoor hides and shows the faces, the flat display)
    // (and the look worn: 霓虹 is the machine's class (.nd-neon), not in the faces' markup; worn with the door open, the door
    // drawn in the old look till it shut, 2026-11-01)
    const lk = t3dNeon(m.id) ? 'neon:' : '', keyOf = e => lk + t3dKeyOf(e.innerHTML.replace(/display:\s*none;?\s*/g, '')), kOut = keyOf(out), kIn = keyOf(inn), was = T3D.doorKeys && T3D.doorKeys.m === m.id ? T3D.doorKeys : {};
    if (kOut === was.out && kIn === was.in) return;
    const mine = new Set([out, inn]), msg = { type: 'door', machine: m.id, hinge: D.hinge }, a = performance.now(); let fr = null, bk = null;
    // (shown a moment, and put back as the page had it, its style attribute as it was written)
    const shown = (el, f) => { const ds = [el, D.flat && el.querySelector(D.flat)].filter(Boolean).map(e => [e, e.getAttribute('style')]); ds.forEach(([e]) => { e.style.display = ''; });
      try { return f(); } finally { ds.forEach(([e, v]) => { if (v == null) e.removeAttribute('style'); else e.setAttribute('style', v); }); } };
    try {
      if (kOut !== was.out) fr = shown(out, () => t3dUses(out, () => t3dPaint({ el: out, plane: door, face: T3D_FACE.door, lift: 0, px, raw: true }, mine)));
      // (the inside face: the door's back, facing the machine (−y) as the door stands shut, its picture seen from there)
      if (kIn !== was.in) bk = shown(inn, () => t3dUses(inn, () => t3dPaint({ el: inn, plane: door, face: T3D_FACE.door, lift: 0, px, raw: true }, mine)));
    } catch (e) { console.warn('turn3d door', e); return; }
    T3D.doorKeys = { m: m.id, out: kOut, in: kIn }; t3dTickAdd('doorPaint', performance.now() - a);
    // (sent once both are encoded, in the order painted: the worker takes them in turn)
    const a2 = performance.now();
    Promise.all([fr && t3dPng(fr.cv), bk && t3dPng(bk.cv)]).then(([fp, bp]) => {
      if (fr) msg.front = { p: fr.p, face: fr.face, png: fp }; if (bk) msg.back = { p: bk.p, face: bk.face.map(v => -v), png: bp };
      t3dTickAdd('doorWait', performance.now() - a2); NATIVE.post('turn3d', msg); });
  }
  // where the stage lies on screen (its corner, its width in CSS px), and a camera c on it as CSS px = a · stage units +
  // (e, f): the shell's table, at each whole degree
  // (where the stage's units lie on the screen: from a probe in it, its box as laid out, #cam's CSS transform in it — a
  // camera flight, app.js flyTo, is that transform till a touch commits it to the viewBox; WebKit's getScreenCTM leaves an
  // HTML parent's CSS transform out, the 3D framed as before the flight with the door open and after 全部补货, the
  // simulator 2026-10-30)
  const t3dStageM = () => { let p = T3D.probe;
    if (!p || p.parentNode !== stage) { p = T3D.probe = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      for (const [k, v] of Object.entries({ x: 0, y: 0, width: 100, height: 100, fill: 'none', visibility: 'hidden', 'pointer-events': 'none', 'aria-hidden': 'true' })) p.setAttribute(k, v);
      stage.appendChild(p); }
    const r = p.getBoundingClientRect(); return { a: r.width / 100, d: r.height / 100, e: r.left, f: r.top }; };
  const t3dBox = () => { const m = t3dStageM(), c = __ND.cam; return { x: m.e + m.a * c.x, y: m.f + m.d * c.y, W: m.a * c.w }; };
  const t3dRow = (b, y, c) => { const a = b.W / c.w; return [y, a, b.x - a * c.x, b.y - a * c.y]; };
  // the page's camera at each angle: at home each angle frames the machine (per machine and screen, kept); zoomed in, it
  // orbits the point at the centre of the view, from where the turn starts (__ND.camsAt, as the game's setYaw)
  function t3dCams() {
    const b = t3dBox(), out = [];
    if (zoomed()) { const from = { cam: { ...__ND.cam }, yaw: __ND.yaw }; for (let y = Math.floor(LIM_L - SOFT); y <= Math.ceil(LIM_R + SOFT); y++) out.push(t3dRow(b, y, __ND.camsAt(y, from).cam)); return out; }
    const key = M().id + ' ' + (T3D.vp || [innerWidth, innerHeight]).join('x'); let home = T3D.cams.get(key); if (home) return home;
    for (let y = Math.floor(LIM_L - SOFT); y <= Math.ceil(LIM_R + SOFT); y++) out.push(t3dRow(b, y, __ND.camsAt(y).home));
    T3D.cams.set(key, out); return out;
  }
  // the goods the save holds, where they stand now (the model's own are a new game's): each card by its look (glyph,
  // body colour, cap colour: tools/turn3d/goods.mjs made one picture each) at its 3D place. The samples in the window,
  // and under the X-ray every can in the racks (DRINK.lanes(), as export.mjs places them), moving as the game moves them
  const t3dLookOf = el => { const st = el.getAttribute('style') || '', c = /--c:\s*var\(--([\w-]+)\)/.exec(st), cap = /--cap:\s*var\(--([\w-]+)\)/.exec(st);
    return `${(el.getAttribute('href') || '').slice(1)}|${c ? c[1] : ''}|${cap ? cap[1] : 'ice'}`; };
  function t3dGoods(m = M(), rack = false) {
    if (m.id !== 'drink' || typeof DRINK === 'undefined' || typeof DK === 'undefined' || !T3D.ready.has(m.id)) return;
    const looks = [], idx = new Map(), at = (el, x, y, z) => { const k = t3dLookOf(el); if (!idx.has(k)) { idx.set(k, looks.length); looks.push(k); } return [x, y, z, idx.get(k)]; };
    // (the window's samples only while the door is shut: swung open, its picture shows them, drink.js setDoor)
    const win = t3dDoorA(m) > .002 ? [] : [...cam.querySelectorAll('.mroot[data-m="drink"] #dk-disp3d [data-k] > use')].map(el => at(el, DK.SAMPLE_X[+el.parentElement.dataset.k], 80, 171));
    const cans = rack ? DRINK.lanes().flatMap(L => L.cans.map(c => at(c.el, DK.colX(c.k), c.y, c.z))) : [];
    // (a can on its way out, pedal to belt to chute to the tray inside (X-ray), and in the take-out pocket: where the page
    // last put it, its 3D point by its screen point (iso.js P, recorded in full 3D); gone once it fades as it is taken)
    const R3 = window.__REC && __REC.pts, out = sel => !R3 ? [] : [...cam.querySelectorAll(`.mroot[data-m="drink"] ${sel} > use`)]
      .filter(el => +(el.getAttribute('opacity') ?? 1) > .3).map(el => { const q = R3.get(el.getAttribute('x') + ' ' + el.getAttribute('y')); return q && at(el, ...q); }).filter(Boolean);
    if (rack) cans.push(...out('#dk-movers'));
    // (the take-out pocket's: the page paints them over its door, the flap and all, so the shell draws them over its own)
    const tray = out('#dk-tray-out');
    const key = looks.join(',') + '|' + win.concat(cans, [[-1]], tray).map(r => r.map(v => +v.toFixed(2)).join(' ')).join(',');
    if (key === T3D.goodsKey) return;
    T3D.goodsKey = key;
    NATIVE.post('turn3d', { type: 'goods', machine: m.id, looks, window: win, rack: rack ? cans : null, tray });
  }
  // (one being taken away drifts off with its sparkles as the page moves it on the screen, not by a 3D point: the page draws
  // it itself, a copy in its effects layer over the shell's view, until it is gone)
  function t3dTrayGhosts(on = true) {
    const fx = document.getElementById('fx'), R3 = window.__REC && __REC.pts; if (!fx) return;
    const keep = new Set();
    if (on && R3) for (const el of cam.querySelectorAll('.mroot[data-m="drink"] #dk-tray-out > use')) {
      if (R3.get(el.getAttribute('x') + ' ' + el.getAttribute('y'))) continue;
      let g = el._t3dGhost; if (!g || !g.isConnected) { g = el._t3dGhost = el.cloneNode(false); g.classList.add('t3d-ghost'); g.removeAttribute('data-hit'); fx.appendChild(g); }
      for (const a of ['x', 'y', 'transform', 'opacity', 'href', 'style']) { const v = el.getAttribute(a); if (v == null) g.removeAttribute(a); else if (g.getAttribute(a) !== v) g.setAttribute(a, v); }
      keep.add(g);
    }
    for (const g of fx.querySelectorAll('.t3d-ghost')) if (!keep.has(g)) g.remove();
  }
  // full3d: whenever the shell can show the machine, it does, at rest too: the page sends its angle and camera (one row
  // of the table) and the X-ray scan line when they change, and keeps its own machine see-through under it, still
  // there for the taps (platform/ui.css nd-t3d-full). Its turns and pinches go as above; at their end the shell stays
  // (−1: X-rayed all the way, the page's xr-full: the shell hidden, the wireframe uncut; the shell then skips the shell)
  const t3dScan = () => { if (__ND.xr <= .002) return null; if (__ND.xr > .998) return -1; const h = document.getElementById('scanHandle'); if (!h) return null;
    const r = h.getBoundingClientRect(); return r.top + r.height / 2; };
  // (what the page changed in the machine since: a part added or taken away anywhere in it (T3D.domDirty), or a change in
  // a part t3dLive showed last (T3D.liveDirty); the lookups each frame below wait for one, or a third of a second: run
  // every frame, they and t3dLive's held the page at 24–31 fps at rest on the phone, the owner's game 2026-10-30)
  function t3dWatch() {
    if (T3D.mo) return;
    T3D.mo = new MutationObserver(recs => { const now = performance.now(); for (const r of recs) { const t = r.type === 'characterData' ? r.target.parentElement : r.target;
      // (a part added or taken away; not the goods (the rack's cans redrawn each frame of a sale, <use>s) nor a part's words
      // (the display's digits): each of those looked at all the machine's parts and the cats again, 2026-10-30)
      // (nor a cat's tail, drawn again by the page as it sways: the shell draws it from "cattail"; it looked at the cats and
      // the decals again 3 times a second at rest, 6–10 ms a time on the phone, 2026-10-30)
      // (inside a group the page draws anew as it works (K): that group alone looked at again, t3dK; not the whole machine's
      // parts, each of its 30 redraws a second)
      const kr = T3D.kSel && t && t.closest && t.closest(T3D.kSel); if (kr) { (T3D.kDirty || (T3D.kDirty = new Set())).add(kr); continue; }
      if (r.type === 'childList') { if (!(t && t.closest && t.closest('.mroot')) || t.closest('.cat-tail')) continue;
        if ([...r.addedNodes, ...r.removedNodes].some(n => n.nodeType === 1 && n.tagName !== 'use')) T3D.domDirty = T3D.liveDirty = now;
        else if (T3D.liveSet && T3D.liveSet.has(t)) T3D.liveDirty = now; }
      else if (r.type === 'attributes' && (r.attributeName === 'opacity' && T3D.glowSet && T3D.glowSet.has(t) || r.attributeName === 'transform' && T3D.moveSet && T3D.moveSet.has(t))) T3D.glowDirty = now;
      else if (T3D.liveSet && T3D.liveSet.has(t)) T3D.liveDirty = now; } });
    T3D.mo.observe(cam, { subtree: true, childList: true, attributes: true, characterData: true });
  }
  // the machine's roots, one in each of the page's layers (looked for again once the page has built anew)
  const t3dRoots = id => { if (!T3D.roots || T3D.rootsId !== id || (T3D.domDirty || 0) >= T3D.rootsAt || T3D.roots.some(r => !r.isConnected)) {
    T3D.roots = [...cam.querySelectorAll(`.mroot[data-m="${id}"]`)]; T3D.rootsId = id; T3D.rootsAt = performance.now(); } return T3D.roots; };
  const T3D_TICK = /[?&]t3dtick=1/.test(location.search);
  // (?t3dtick=1: a count of its own beside the parts' times, the pictures painted (ms) and what t3dLive sent (KB))
  const t3dTickAdd = (n, d) => { const tm = T3D_TICK && window.__t3dTm; if (!tm) return; const e = tm.f[n] || (tm.f[n] = { s: 0, m: 0, c: 0 }); e.s += d; e.c++; if (d > e.m) e.m = d; };
  // (the tick's reads of the page (styles, boxes) done once the browser has drawn the frame, its style and layout clean
  // then: in the frame, before the game's own animations, each read made the browser work them out there and then and
  // again after them, ~9 ms at the phone's speed each through a sale, 2026-10-30)
  const t3dAfter = (() => { const ch = new MessageChannel(); let fn = null; ch.port1.onmessage = () => { const f = fn; fn = null; if (f) f(); };
    return f => { if (!fn) ch.port2.postMessage(0); fn = f; }; })();
  // (full 3D: the page's machine, built anew at the end of a turn (the game's setYaw) or under a new camera at the end of
  // a pinch, handed to the browser's style and layout a few parts a frame, not all at once. It is see-through then, kept
  // for the taps and for what the shell's pictures are read off; a part taps nothing until its frame comes. All at once
  // it stopped the page 0.2–0.3 s after each turn and 0.6–1.2 s after each pinch on the owner's phone, the rain with
  // it, 2026-10-30. Parts of at most 60 elements (a <use> counts 6), some 60 elements a frame; meanwhile the reads off
  // the machine wait (the shell keeps what it has), and are made again after)
  // (and the game's glyphs not re-projected at each angle while the page's machine is see-through: build_www setYaw)
  T.glyphsLater = () => device.classList.contains('nd-t3d-full');
  // (and a new zoom on #cam's transform, the viewBox as it was, while the shell holds the machine: app.js apply, build_www)
  T.camLater = () => !!T3D.held && t3dFull;
  const t3dSize = e => (e.localName === 'use' ? 6 : 1) + e.getElementsByTagName('*').length + 5 * e.getElementsByTagName('use').length;
  function t3dReveal() {
    if (!device.classList.contains('nd-t3d-full')) return;
    const R = T3D.reveal || (T3D.reveal = { parts: [], was: new Map() });
    const split = e => { for (const c of e.children) { if (c.localName === 'defs' || (c.style.display === 'none' && !R.was.has(c))) continue;
      if (R.was.has(c) || t3dSize(c) <= 60 || !c.children.length) { if (!R.was.has(c)) { R.was.set(c, c.style.display); c.style.display = 'none'; R.parts.push(c); } } else split(c); } };
    for (const r of cam.querySelectorAll('.mroot:not(.off)')) split(r);
    R.parts = R.parts.filter(c => c.isConnected || !R.was.delete(c));
    if (!R.raf) R.raf = requestAnimationFrame(t3dRevealStep);
  }
  function t3dRevealStep() {
    const R = T3D.reveal; if (!R) return; if (R.raf) cancelAnimationFrame(R.raf); R.raf = 0;
    // (all at once when the page shows its machine again)
    const all = !device.classList.contains('nd-t3d-full');
    for (let n = 0; R.parts.length && (all || n < 60);) { const c = R.parts.shift(); if (!c.isConnected) { R.was.delete(c); continue; } n += t3dSize(c);
      if (c.style.display === 'none') c.style.display = R.was.get(c) || ''; R.was.delete(c); }
    if (R.parts.length) { R.raf = requestAnimationFrame(t3dRevealStep); return; }
    T3D.reveal = null; T3D.domDirty = T3D.liveDirty = performance.now();
  }
  // the marked parts (__t3dMotion marks) as the page has them now, while an upgrade's ceremony runs and 2.5 s after: moved
  // (translate x y, the page's units), faded (opacity), lit (the stroke and its width while .ubuilt plays); nothing at rest
  const t3dMarkOf = (el, m = M()) => { const MK = (window.__t3dMotion[m.id] || {}).marks; if (!MK) return null; for (const k in MK) if (el.closest(MK[k])) return k; return null; };
  function t3dMarks(m = M()) {
    const MK = (window.__t3dMotion[m.id] || {}).marks; if (!MK) return;
    const now = performance.now(); if (__ND.partFlow) T3D.partAt = now;
    const out = {};
    if (now - (T3D.partAt || -1e9) < 2500) for (const r of t3dRoots(m.id)) for (const k in MK) { if (out[k]) continue;
      const el = r.querySelector(MK[k]); if (!el) continue;
      const t = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(el.getAttribute('transform') || ''), a = el.getAttribute('opacity'), o = {};
      if (t && (+t[1] || +t[2])) o.t = [+t[1], +t[2]];
      if (a != null && +a < .999) o.a = +a;
      if (el.classList.contains('ubuilt')) { const cs = getComputedStyle(el); o.c = cs.stroke; o.w = parseFloat(cs.strokeWidth) || 0; }
      if (Object.keys(o).length) out[k] = o; }
    // (a part pressed: how far its cap is pushed in now, its transition's, against all the way (--px, --py); d: the 3D push)
    const PR = (window.__t3dMotion[m.id] || {}).press, el = T3D.pressEl;
    if (PR && el && el.isConnected && now - T3D.pressAt < 600) for (const k in PR) { if (!el.matches(MK[k])) continue;
      const cap = el.querySelector('.capin'), mt = cap && /matrix\(([^)]+)\)/.exec(getComputedStyle(cap).transform), st = el.getAttribute('style') || '';
      const px = /--px:\s*(-?[\d.]+)/.exec(st), py = /--py:\s*(-?[\d.]+)/.exec(st), all = px && py ? Math.hypot(+px[1], +py[1]) : 0;
      const v = mt ? mt[1].split(',').map(Number) : null, f = v && all > 1e-6 ? Math.min(1, Math.hypot(v[4], v[5]) / all) : 0;
      if (f > .002) out[k] = { ...(out[k] || {}), d: PR[k].n.map(c => +(-.6 * PR[k].t * f * c).toFixed(3)) };
      break; }
    const s = JSON.stringify(out); if (s === T3D.marksSent) return; T3D.marksSent = s;
    NATIVE.post('turn3d', { type: 'marks', machine: m.id, m: out });
  }
  // the models the shell holds: the machine in view, the two beside it on its street (the arrows, #dots) and one more the
  // way the player went last; the others let go (keep: the shell frees their pictures, and the page asks again when one
  // comes back near). All of them prepared at the start, with their X-rays, were 2.4 GB of pictures: the phone killed the
  // app for its memory entering the drink machine, 2026-10-31.
  // (the one in view first, alone, and the rest once it is in: loaded side by side, the four took 5–7 s to bring the one
  // looked at on the phone; the X-ray's insides only then too, or as the X-ray is switched on, 2026-11-01)
  // (as a slide starts, T.coming, around the machine coming)
  function t3dWant() {
    if (!T3D.shellId || !M()) return;
    const c = T3D.slide ? T3D.slide.i : T3D.toward ? T3D.toward.i : __ND.cur, dir = T3D.dir || 1;
    const ds = [...document.querySelectorAll('#dots i[data-i]')].map(e => +e.dataset.i), p = ds.indexOf(c), n = ds.length, at = k => MACHINES[ds[((p + k) % n + n) % n]];
    const want = [MACHINES[c] && MACHINES[c].id, ...(p < 0 || n < 2 ? [] : [at(dir), at(-dir), at(2 * dir)].map(m => m && m.id))]
      .filter((id, i, a) => id && T3D_MODELS.includes(id) && a.indexOf(id) === i);
    const first = want[0], inn = !!first && T3D.ready.has(first), xr = inn || (__ND.xr > .002 && first === M().id), key = want.join() + '|' + inn + xr + !!T3D.slide;
    if (key === T3D.wantKey) return; T3D.wantKey = key;
    if (T3D.altFor !== first) { T3D.altFor = first; T3D.altKey = ''; }   // (the shell keeps another look for the one in view only)
    // (and while a slide is on, the machine it leaves too: the shell may still be drawing it, its release a few frames on)
    const keep = T3D.slide && T3D.shellId[M().id] && !want.includes(M().id) ? want.concat(M().id) : want;
    for (const id of Object.keys(T3D.shellId)) if (!keep.includes(id)) { delete T3D.xrId[id]; delete T3D.shellId[id]; T3D.ready.delete(id); }
    // (keep on each: one already there is only told which to keep)
    // (ahead: not needed this moment, the machines beside, and the X-ray's insides from the street (up close it may be
    // switched on any moment, and the page does not ask again then); the shell may load those one at a time behind its
    // frames, Turn3D.swift -t3dAheadQ)
    const ask = (id, full, ahead) => { T3D.shellId[id] = t3dShellId(id); if (full) T3D.xrId[id] = t3dXrId(id);
      NATIVE.post('turn3d', { type: 'prepare', machine: id, shell: T3D.shellId[id], lang: t3dLangNow(), full, xr: full ? T3D.xrId[id] : undefined, keep, ahead }); };
    if (first) ask(first, xr && !(first in T3D.xrId) ? true : false, inn && __ND.view !== 'machine');
    if (inn) for (const id of want.slice(1)) if (!(id in T3D.shellId)) ask(id, false, true);
  }
  function t3dHoldTick() {
    requestAnimationFrame(t3dHoldTick);
    // (a frame of the page's: the 3D points it draws in one are told apart from the same screen point's in another, __REC.conf, t3dK)
    // (the app's alone (build_www: fr); the exporter's, none: any two at one angle)
    if (window.__REC && __REC.fr != null) __REC.fr++;
    // (?t3dtick=1: a frame over 100 ms told, T3DGAP, with what this tick did in the frame before it, its parts over 1 ms)
    if (T3D_TICK) { const t = performance.now(), g = t - (T3D.tickAt || t); T3D.tickAt = t;
      if (g > 100 && T3D.held) NATIVE.post('diag', `T3DGAP ${g.toFixed(0)}ms before it: ${(T3D.tickFr || []).join(' ') || 'nothing of the tick'} · mode ${typeof __ND !== 'undefined' && __ND.mode} turning ${!!T.active}`); T3D.tickFr = []; }
    if (typeof __ND === 'undefined' || !MACHINES.length) return;
    if (T3D.slide && (__ND.cur === T3D.slide.i || performance.now() - T3D.slide.at > 6000)) T3D.slide = null;
    if (T3D.slide) t3dWebRoots(MACHINES[T3D.slide.i].id); else if (T3D.webOn) t3dWebRoots(null); T3D.webOn = !!T3D.slide;
    if (T3D.toward && ((__ND.cur === T3D.toward.i && __ND.view === 'machine') || performance.now() - T3D.toward.at > 3000)) T3D.toward = null;
    t3dWant();
    // (an upgrade fitted: the X-ray's insides with its parts)
    // (霓虹 worn or taken off: its model; the shell keeps the look it has till then, t3dSwap)
    { const id = M().id; if (!T3D.slide && T3D.shellId && id in T3D.shellId) { const full = id in T3D.xrId, xr = full ? t3dXrId(id) : undefined, sh = t3dShellId(id); if (xr !== T3D.xrId[id] || sh !== T3D.shellId[id]) NATIVE.post('turn3d', { type: 'prepare', machine: id, shell: sh, lang: t3dLangNow(), full, xr }); if (sh !== T3D.shellId[id]) T3D.liveDirty = T3D.swapAt = performance.now(); if (full) T3D.xrId[id] = xr; T3D.shellId[id] = sh; } }
    t3dWatch();
    const now = performance.now(), look = now - (T3D.domDirty || 0) < 400 || now - (T3D.lookAt || 0) > 300; if (look) T3D.lookAt = now;
    // (?t3dtick=1, a measurement: what each part of this tick costs the page, posted every 2 s as T3DTICK in the diag log;
    // the shell's own count does not show it, the page's thread apart, 2026-10-30)
    const _tm = T3D_TICK && (window.__t3dTm || (window.__t3dTm = { at: performance.now(), f: {} })), _t = (n, fn) => { if (!_tm) return fn(); const a = performance.now(); fn(); const d = performance.now() - a, e = _tm.f[n] || (_tm.f[n] = { s: 0, m: 0, c: 0 }); e.s += d; e.c++; if (d > e.m) e.m = d; if (d > 1 && T3D.tickFr) T3D.tickFr.push(n + ' ' + d.toFixed(0)); };
    // (the page's own cans hidden under the shell's in the frame itself, not a frame late)
    if (t3dCan()) { _t('ghosts', () => t3dTrayGhosts());
      t3dAfter(() => { if (!t3dCan()) return; if (T3D.boxLater) { T3D.boxLater = false; T3D.box = t3dBox(); }
        // (the door's pictures looked at as the restock starts and as the door starts to close, painted again only if what
        // they show changed (a lane's 売切 lamp out): looked at each frame, the door's markup ~40 KB a time)
        // (and once ahead, two seconds after the shell took the machine, at rest: the first door opened had none sent yet, the
        // shut door drawn a moment as the page's swung, its pictures encoded meanwhile)
        { const ph = !__ND.doorFlow ? 0 : __ND.mode === 'closing' ? 2 : 1, ahead = !ph && __ND.mode === 'shut' && T3D.held && (!T3D.doorKeys || T3D.doorKeys.m !== M().id) && t3dDoorOf() && now - (T3D.heldAt || now) > 2000 && __ND.xr <= .002;
          const lk = ph ? t3dNeon() : T3D.doorLk;   // (霓虹 worn or taken off with the door open: its pictures again)
          if ((ph && (ph !== T3D.doorPh || lk !== T3D.doorLk)) || ahead) _t('door', () => t3dDoorPics()); T3D.doorPh = ph; T3D.doorLk = lk; }
        _t('goods', () => t3dGoods(M(), __ND.xr > .002 || t3dDoorA() > .002)); _t('marks', () => t3dMarks()); if (T3D.reveal) { _t('backdrop', () => t3dBackdrop()); return; } const swap = t3dSwap(); if (look && !swap) { _t('cats', () => t3dCats()); if (T3DC.key) _t('catwatch', () => t3dCatWatch()); _t('decals', () => t3dDecals()); } if (!swap) { _t('live', () => t3dLive()); _t('k', () => t3dK()); } _t('backdrop', () => t3dBackdrop());
        if (_tm && performance.now() - _tm.at > 2000) { NATIVE.post('diag', 'T3DTICK ' + Object.entries(_tm.f).map(([k, e]) => `${k} ${e.s.toFixed(0)}${k.endsWith('KB') ? '' : 'ms'}/${e.c} max ${e.m.toFixed(1)}`).join(' · ')); _tm.at = performance.now(); _tm.f = {}; } }); }
    else t3dTrayGhosts(false);
    // (off the machine: the shell's view goes and the page is whole again; said again on the next change if the page was
    // still see-through, so the street is never left under a stale 3D view)
    // (the shell told a few frames after the page is whole again, not in the same moment: its view went at once and the
    // page's frame came later, a black frame between, leaving for the street and when a machine came with no model yet; the
    // phone, 2026-11-01. Not if the page holds again meanwhile)
    // (leaving for the street: the street fades in over the machine (index.html is-street, 0.35 s) and the machine's layer
    // goes after (only-street, app.js showView): the shell's machine stays under the page till then, as the page's did, and
    // the page's is not shown again for it. Shown, it was restyled whole and painted for nothing as the fade began: the page's
    // frame after letting go 0.35–0.9 s on the phone (753c844), 180 ms in Chromium, the street's fade a jump, 2026-11-01)
    // (and a few frames after that, not in the frame the machine's layer goes, the street's slowest of itself)
    if (!t3dCan() && __ND.view === 'street' && device.classList.contains('nd-t3d-full') && (T3D.goneFr = device.classList.contains('only-street') ? (T3D.goneFr || 0) + 1 : 0) < 3
      && performance.now() - (T3D.leaveAt || (T3D.leaveAt = performance.now())) < 1000) return;
    T3D.leaveAt = 0; T3D.goneFr = 0;
    if (!t3dCan()) { if (T3D.held || device.classList.contains('nd-t3d-full') || device.classList.contains('nd-t3d-fade')) { T3D.held = false; T3D.holdKey = ''; if (__ND.commitCam) __ND.commitCam(); if (window.__ndNSS) __ndNSS.hold(false); device.classList.remove('nd-t3d-full', 'nd-t3d-fade', 'nd-t3d-out'); t3dWebRoots(null); t3dRevealStep(); if (__ND.glyphsNow) __ND.glyphsNow(); document.body.classList.remove('nd-t3d-bg');
      const tok = T3D.letGo = (T3D.letGo || 0) + 1; let f = 3; const go = () => { if (T3D.letGo !== tok || T3D.held) return; if (--f > 0) { requestAnimationFrame(go); return; } T3D.letGo++; T3D.under = false; NATIVE.post('turn3d', { type: 'release' }); };
      // (three frames: the page's frame painted and on the screen, WebKit sending the next only once the shell has shown the
      // last; leaving for the street the first took 0.35–0.9 s on the phone. And at most 1.5 s, the page in the background)
      requestAnimationFrame(go); setTimeout(() => { f = 1; go(); }, 1500); } return; }
    if (T.active) return;   // (a turn or a pinch: the shell has it)
    // (another machine come while held, a slide's end: the page shows it whole, the shell told three frames on (the page's
    // frame on the screen first) and seeing through again only once its pictures are all there, as at the first hold; at
    // once, its shelves came empty, its cats 4 s later, on the phone, 2026-11-01)
    if (T3D.held && T3D.heldM !== M().id) { T3D.held = false; T3D.holdKey = ''; T3D.waitFr = 3; if (__ND.commitCam) __ND.commitCam(); if (window.__ndNSS) __ndNSS.hold(false); device.classList.remove('nd-t3d-full', 'nd-t3d-fade', 'nd-t3d-out'); t3dWebRoots(null); t3dRevealStep(); if (__ND.glyphsNow) __ND.glyphsNow(); document.body.classList.remove('nd-t3d-bg'); }
    if (T3D.waitFr > 0) { T3D.waitFr--; return; }
    // (the other look of the machine in view, 霓虹's or the comic's, if it can be worn: loaded by the shell ahead, two seconds
    // after it took the machine, and kept aside while the machine is in view (Turn3D prepare alt), so a switch is at once.
    // Loaded on the switch, the phone stood 1.3 s on the spiral machine's 霓虹 to comic, its whole shell loaded anew, 2026-11-01)
    if (T3D.held && !T3D.slide && device.classList.contains('nd-t3d-full') && performance.now() - (T3D.heldAt || 0) > 2000 && window.SKIN && SKIN.canWear && SKIN.canWear(M())) {
      const id = M().id, alt = t3dShellFor(id, !t3dNeon(id)), k = id + ' ' + alt + ' ' + t3dLangNow();
      if (k !== T3D.altKey && alt !== T3D.shellId[id]) { T3D.altKey = k; NATIVE.post('turn3d', { type: 'prepare', machine: id, shell: alt, lang: t3dLangNow(), alt: true }); } }
    // (where the stage lies on screen: again when the camera, the angle or the screen changed, or a quarter of a second on;
    // its getScreenCTM each frame laid the page out an extra time a frame, a tenth of its time at rest)
    // (the screen's size as the last resize left it: innerWidth itself lays the page out, every frame, 900 of 1,000 samples
    // of this function in Chromium)
    if (!T3D.vp) { T3D.vp = [innerWidth, innerHeight]; addEventListener('resize', () => { T3D.vp = [innerWidth, innerHeight]; }); }
    const c = __ND.cam, bk = [__ND.yaw, c.x, c.y, c.w, ...T3D.vp].join(',');
    // (the quarter-second look once the frame is drawn, t3dAfter)
    // (and each frame while the camera flies, app.js flyTo: a CSS transition on #cam, the game's camera already where it
    // goes; the shell's view stayed where the flight began, a quarter of a second at a time, as the door closed)
    // (told by the transform flyTo sets on it, for as long as a flight takes: getAnimations each frame made the browser
    // work out the page's style there and then, 1.5 ms a frame at 4× slower)
    const tf = cam.style.transform; if (tf !== T3D.camTf) { T3D.camTf = tf; T3D.camTfAt = now; }
    const flying = now - (T3D.camTfAt || -1e9) < 1500;   // (a flight home sets it to '': app.js flyTo, still)
    if (bk !== T3D.boxKey || !T3D.box || flying) { T3D.boxKey = bk; T3D.boxAt = now; T3D.box = t3dBox(); }
    else if (now - (T3D.boxAt || 0) > 250) { T3D.boxAt = now; T3D.boxLater = true; }
    const b = T3D.box, scan = t3dScan(), roots = t3dRoots(M().id);
    // (a sale's jolt, drink.js: the machine's groups moved down and up a moment, translate(0 y), the shell's camera with them)
    // (and a slide's, app.js switchTo: translate(x 0), the machine leaving moved out by the page, the shell's with it)
    const mv = /^translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)$/.exec(roots[0]?.getAttribute('transform') || ''), jolt = mv ? +mv[2] : 0, dx = mv ? +mv[1] : 0;
    // (busy: the machine at work, its CSS animations running — the heater, the cold air's flow — else standing still)
    const busy = roots.some(r => r.classList.contains('busy'));
    // (no X-ray is 'off', not −1: −1 is X-rayed all the way, and the X-ray turned off from there went unsaid, the shell
    // left showing the insides over a closed machine, its cats gone; the simulator, 2026-10-30)
    const door = t3dDoorA();
    const key = [M().id, __ND.yaw, b.x, b.y, b.W, c.x, c.y, c.w, scan ?? 'off', busy, jolt, dx, door].map(v => typeof v === 'number' ? v.toFixed(2) : v).join(',');
    if (key === T3D.holdKey) return;
    T3D.holdKey = key;
    const row = t3dRow(b, __ND.yaw, c);
    // (the turns' table checked against it, at rest at home: one made as the camera still flew in stayed a few pixels off
    // the page's machine for the visit, after 全部补货; the simulator, 2026-10-30)
    if (!flying && !zoomed()) { const tk = M().id + ' ' + T3D.vp.join('x'), tb = T3D.cams.get(tk), j = tb ? tb.findIndex(q => q[0] >= __ND.yaw) : -1;
      if (j >= 0) { const q = tb[j], o = tb[Math.max(0, j - 1)], k = q[0] === o[0] ? 0 : (__ND.yaw - o[0]) / (q[0] - o[0]), at = i => o[i] + (q[i] - o[i]) * k;
        if (Math.abs(at(2) - row[2]) > .5 || Math.abs(at(3) - row[3]) > .5 || Math.abs(at(1) / row[1] - 1) > .002) T3D.cams.delete(tk); } }
    T3D.holdBase = { m: M().id, row: row.slice(), jolt, msg: { yaw: __ND.yaw, scan, busy, door } };
    row[2] += row[1] * dx; row[3] += row[1] * jolt;
    T3D.under = true; NATIVE.post('turn3d', { type: 'hold', machine: M().id, yaw: __ND.yaw, cams: [row], scan, busy, door });
    // (the page's machine goes see-through a few frames after the shell has been asked to draw it, its background too:
    // the shell's view is under this page then, the background drawn there from t3dBackdrop's picture)
    // (and the page's lines keep the zoom they have while it is see-through: platform/nss.js hold)
    // (and once the live parts, the cats and the background are painted, a frame or a few each, or four seconds on: their
    // pictures are encoded off the page's thread now, and come later while the page is busy building the machine — till
    // then the page shows its own, the same, at 60 Hz)
    // (and not before the live parts have been looked at once: with the cats, the stickers and the background ready first,
    // the page went see-through before that look, and the buy buttons stood blank in 3D, no lamp on them, a second or two,
    // in 2 of 3 runs on the simulator, 2026-10-30)
    if (!T3D.held) { T3D.held = true; T3D.heldM = M().id; T3D.heldAt = performance.now(); T3D.livePending = T3DC.pending = false; T3D.liveSeen = !window.__t3dLive[M().id]; T3D.kSeen = !window.__t3dK[M().id]; T3D.kSent = null; T3D.liveDirty = performance.now(); T3D.marksSent = ''; const t0 = performance.now(); t3dBackdrop(true);
      const see = () => { if (!T3D.held || T3D.slide) return; if ((T3D.livePending || !T3D.liveSeen || !T3D.kSeen || T3DC.pending || T3DB.pending || T3D.decalPend) && performance.now() - t0 < 4000) { requestAnimationFrame(see); return; }
        // (the page's machine faded out over the shell's, 180 ms, ui.css nd-t3d-fade, not cut; see-through and hidden then)
        // (taken over already, a turn begun before this: t3dTakeNow)
        if (device.classList.contains('nd-t3d-full')) return;
        const was = T3D.heldM; device.classList.add('nd-t3d-fade'); document.body.classList.add('nd-t3d-bg');
        requestAnimationFrame(() => { if (!T3D.held || T3D.heldM !== was) return; device.classList.add('nd-t3d-out');
          setTimeout(() => { if (!T3D.held || T3D.heldM !== was) return; device.classList.add('nd-t3d-full'); device.classList.remove('nd-t3d-fade', 'nd-t3d-out'); if (window.__ndNSS) __ndNSS.hold(true); }, 190); }); };
      setTimeout(see, 80); t3dDecals(); }
  }
  if (t3dFull) requestAnimationFrame(t3dHoldTick);
  /* The page's background, painted for the shell (Turn3D "backdrop"): at rest in full 3D the shell's view is under this
     page and the page see-through (platform/ui.css nd-t3d-bg), so what the page draws over its machine stays over the
     3D, and what it draws under it — .device's background layers (index.html: the glows, the dots, the night's gradient)
     over the page's colour — is drawn there instead, from this picture: the computed layers painted on a canvas at the
     screen's pixels, sent again when they change (the tint, the time of day). */
  const T3DB = { key: '', at: 0, probe: null, base: null };
  function t3dBackdrop(now) {
    const t = performance.now(); if (!now && t - T3DB.at < 250) return; T3DB.at = t;
    // (read off a stand-in of .device with no children and without nd-t3d-full, which takes the device's own away; it
    // follows the device's classes and data so its background is the device's: the tint, the art, its transitions)
    if (!T3DB.probe) { T3DB.probe = document.createElement('section'); T3DB.probe.setAttribute('aria-hidden', 'true'); device.parentElement.appendChild(T3DB.probe);
      // (the device's box as the browser last laid it out, not asked for here: offsetWidth and getBoundingClientRect made
      // the page lay itself out there and then, 4 times a second, up to 45 ms at the phone's speed through a sale, 2026-10-30)
      const box = () => { T3DB.rect = device.getBoundingClientRect(); T3DB.size = [device.offsetWidth, device.offsetHeight]; T3DB.sigAt = performance.now(); };
      new ResizeObserver(box).observe(device); addEventListener('resize', () => { T3DB.rect = null; }); }
    if (!T3DB.rect) T3DB.rect = device.getBoundingClientRect(), T3DB.size = [device.offsetWidth, device.offsetHeight];
    const pr = T3DB.probe, cls = device.className.replace(/\bnd-t3d-(full|fade|out)\b/g, '').trim();
    // (its style read again for 2 s after the device's classes, data or own style change (their transitions), and every
    // 2 s besides; not 4 times a second whatever happened)
    const sig = [cls, JSON.stringify(device.dataset), device.getAttribute('style'), T3DB.size].join('|');
    if (sig !== T3DB.sig) { T3DB.sig = sig; T3DB.sigAt = t; }
    if (!now && T3DB.key && t - (T3DB.sigAt || 0) > 2000 && t - (T3DB.readAt || 0) < 2000) return;
    T3DB.readAt = t;
    if (pr.className !== cls) pr.className = cls;
    for (const [k, v] of Object.entries(device.dataset)) if (pr.dataset[k] !== v) pr.dataset[k] = v;
    // (and its own style: the machine's tint, --tint, there; without it every machine's background came out the drink
    // machine's blue, the teppan's maroon blue in the cloud's 3D, 2026-10-31)
    const css = (device.getAttribute('style') || '').replace(/;?\s*$/, ';') + `position:fixed;left:0;top:0;width:${T3DB.size[0]}px;height:${T3DB.size[1]}px;visibility:hidden;pointer-events:none;z-index:-1`;
    if (T3DB.css !== css) pr.style.cssText = T3DB.css = css;
    if (!T3DB.base) { const had = document.body.classList.contains('nd-t3d-bg'); if (had) document.body.classList.remove('nd-t3d-bg');
      T3DB.base = getComputedStyle(document.body).backgroundColor; if (had) document.body.classList.add('nd-t3d-bg'); }
    const cs = getComputedStyle(pr), r = T3DB.rect, dpr = window.devicePixelRatio || 1, base = T3DB.base;
    const key = [cs.backgroundImage, cs.backgroundSize, cs.backgroundPosition, cs.backgroundColor, base, r.x, r.y, r.width, r.height, innerWidth, innerHeight, dpr].join('|');
    if (key === T3DB.key) return;
    T3DB.key = key;
    const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = t3dCtx(cv);
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    g.save(); g.scale(dpr, dpr); g.translate(r.x, r.y);
    g.beginPath(); g.rect(0, 0, r.width, r.height); g.clip();
    if (cs.backgroundColor) { g.fillStyle = cs.backgroundColor; g.fillRect(0, 0, r.width, r.height); }
    const layers = t3dSplit(cs.backgroundImage), sizes = t3dSplit(cs.backgroundSize), poss = t3dSplit(cs.backgroundPosition);
    for (let i = layers.length - 1; i >= 0; i--) {   // (the first layer is on top)
      try { t3dPaintLayer(g, layers[i], sizes[i] || 'auto', poss[i] || '0% 0%', r.width, r.height); } catch (e) { console.warn('turn3d backdrop', layers[i], e); }
    }
    g.restore();
    // (a JPEG, the picture opaque: as a PNG 3.2 MB at the phone's screen, each time the tint or the time of day changed)
    // (encoded off the page's thread too, t3dPng)
    // (the newest only: the workers take turns, one asked later may be done first)
    T3DB.pending = (T3DB.pending || 0) + 1; const bn = T3DB.n = (T3DB.n || 0) + 1;
    t3dPng(cv, 'image/jpeg', .92).then(png => { T3DB.pending--; if (bn < (T3DB.sent || 0)) return; T3DB.sent = bn; NATIVE.post('turn3d', { type: 'backdrop', png, w: W, h: H }); });
  }
  // a CSS list split at its top-level commas
  function t3dSplit(s) { const out = []; let d = 0, cur = ''; for (const ch of s || '') { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; }
  // a colour as canvas takes it (color(srgb r g b / a) as rgba)
  function t3dCol(c) { const m = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/.exec(c.trim());
    return m ? `rgba(${Math.round(m[1] * 255)},${Math.round(m[2] * 255)},${Math.round(m[3] * 255)},${m[4] ?? 1})` : c.trim(); }
  // the colour stops of a gradient's arguments (each "colour [position]"), positions as fractions of the ray (len px)
  function t3dStops(args, len) {
    const st = args.map(a => { const m = /^(.*?\))\s*([-\d.]+(?:px|%))?$/.exec(a) || /^(\S+)\s*([-\d.]+(?:px|%))?$/.exec(a); const c = m ? m[1] : a, p = m && m[2];
      return { c: t3dCol(c), p: p == null ? null : p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p) / len }; });
    if (st.length && st[0].p == null) st[0].p = 0; if (st.length && st[st.length - 1].p == null) st[st.length - 1].p = 1;
    for (let i = 1; i < st.length - 1; i++) if (st[i].p == null) { let j = i; while (st[j].p == null) j++; for (let k = i; k < j; k++) st[k].p = st[i - 1].p + (st[j].p - st[i - 1].p) * (k - i + 1) / (j - i + 1); }
    for (let i = 1; i < st.length; i++) st[i].p = Math.max(st[i].p, st[i - 1].p);
    // (CSS fades between stops with their alpha premultiplied, the canvas without: a clear stop takes its neighbour's
    // colour at no alpha, so a glow fades out rather than through black)
    const rgba = c => { const m = /^rgba?\(([^)]+)\)$/.exec(c); return m ? m[1].split(',').map(Number) : null; };
    for (let i = 0; i < st.length; i++) { const v = rgba(st[i].c); if (!v || (v[3] ?? 1) > 0) continue;
      const n = [st[i - 1], st[i + 1]].map(x => x && rgba(x.c)).find(x => x && (x[3] ?? 1) > 0); if (n) st[i].c = `rgba(${n[0]},${n[1]},${n[2]},0)`; }
    return st;
  }
  function t3dPaintLayer(g, L, size, pos, W, H) {
    const m = /^(radial|linear)-gradient\((.*)\)$/.exec(L); if (!m) return;
    const args = t3dSplit(m[2]), num = (v, of) => v.endsWith('%') ? parseFloat(v) / 100 * of : parseFloat(v);
    // the tile: background-size (auto: the box), from background-position, repeated
    const sz = size.split(/\s+/), tw = sz[0] === 'auto' ? W : num(sz[0], W), th = (sz[1] || sz[0]) === 'auto' ? H : num(sz[1] || sz[0], H);
    const ps = pos.split(/\s+/), ox = num(ps[0] || '0%', W - tw), oy = num(ps[1] || ps[0] || '0%', H - th);
    let paint;
    if (m[1] === 'linear') {
      // (to bottom, the only direction index.html uses: no angle given)
      const first = args[0]; let dir = 'to bottom', rest = args;
      if (/^to\s|deg$/.test(first)) { dir = first; rest = args.slice(1); }
      if (dir !== 'to bottom' && dir !== '180deg') throw new Error('direction ' + dir);
      const st = t3dStops(rest, th);
      paint = () => { const gr = g.createLinearGradient(0, 0, 0, th); for (const s of st) gr.addColorStop(Math.min(1, Math.max(0, s.p)), s.c); g.fillStyle = gr; g.fillRect(0, 0, tw, th); };
    } else {
      // radial: "W H at X Y" (an ellipse, sizes in % or px) or "circle at X Y" (a circle to the farthest corner: closest-side
      // is not used here; with px stops only its stops matter)
      const shape = args[0], am = /^(?:(circle|ellipse)\s*)?(?:([-\d.]+(?:px|%))\s+([-\d.]+(?:px|%))\s*)?(?:at\s+([-\d.]+(?:px|%))\s+([-\d.]+(?:px|%)))?$/.exec(shape);
      if (!am) throw new Error('shape ' + shape);
      const cx = am[4] ? num(am[4], tw) : tw / 2, cy = am[5] ? num(am[5], th) : th / 2;
      let rx, ry;
      if (am[2]) { rx = num(am[2], tw); ry = num(am[3], th); }
      else { const far = Math.max(Math.hypot(cx, cy), Math.hypot(tw - cx, cy), Math.hypot(cx, th - cy), Math.hypot(tw - cx, th - cy)); rx = ry = far; }
      const st = t3dStops(args.slice(1), rx);
      paint = () => { g.save(); g.beginPath(); g.rect(0, 0, tw, th); g.clip(); g.translate(cx, cy); g.scale(1, ry / rx);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); for (const s of st) gr.addColorStop(Math.min(1, Math.max(0, s.p)), s.c);
        // (past the last stop the gradient keeps its last colour, as CSS)
        g.fillStyle = gr; g.fillRect(-cx, -cy * rx / ry, tw, th * rx / ry); g.restore(); };
    }
    if (tw >= W && th >= H) { g.save(); g.translate(ox, oy); paint(); g.restore(); return; }
    // a small tile, repeated: drawn once on a canvas of its own, then as a pattern
    const dpr = window.devicePixelRatio || 1, tc = document.createElement('canvas'); tc.width = Math.round(tw * dpr); tc.height = Math.round(th * dpr);
    const tg = t3dCtx(tc); tg.scale(dpr, dpr); const keep = g; g = tg; paint(); g = keep;
    const pat = g.createPattern(tc, 'repeat'); pat.setTransform(new DOMMatrix().translate(ox, oy).scale(1 / dpr));
    g.fillStyle = pat; g.fillRect(0, 0, W, H);
  }
  /* The cats up close, and the album's 招き猫, in 3D (full3d; Turn3D "cats"): cat3d.js run once more (the build wraps it,
     platform/cat3d-factory.js) with an ISO that records instead of projecting — every point it would draw is kept as the
     3D point it is, every face with the colour the game gives it, every drawing on a surface (the face, the marks, the
     toes) as that surface — so the shapes, colours, coats and gear are the game's own. What moves (the tail swinging,
     the eyes, the shake when tapped) follows the page's own calls (CAT3D.tail, CAT3D.tailOut; the eyes and the shake as
     attributes the page sets, watched below). */
  const T3DC = { args: new Map(), xargs: new Map(), maneki: null, key: '', rec: { pts: [], planes: [], dirs: [] }, maker: null, holder: null };
  if (t3dFull && typeof CAT3D !== 'undefined' && window.__cat3dFactory) {
    const d0 = CAT3D.draw, m0 = CAT3D.maneki, t0 = CAT3D.tail, o0 = CAT3D.tailOut;
    // (X-rayed too: the same cat in the wireframe's layer, or the one curled up inside for a cat in the flap, core.js INSIDE)
    CAT3D.draw = (...a) => { (a[0] ? T3DC.xargs : T3DC.args).set(a[4] || 'mike', a); return d0(...a); };
    CAT3D.maneki = (...a) => { T3DC.maneki = a; return m0(...a); };
    CAT3D.tail = (...a) => { if (!a[2] || __ND.xr > .002) t3dCatTail(a[4] || 'mike', () => t3dCatMaker().tail(...a), a[6], a[4], !!a[2]); return t0(...a); };
    CAT3D.tailOut = (...a) => { if (!a[3]) t3dCatTail(a[2] || 'mike', () => t3dCatMaker().tailOut(...a), a[4], a[2]); return o0(...a); };
  }
  function t3dCatMaker() {
    if (T3DC.maker) return T3DC.maker;
    const R = T3DC.rec, SG = 77777;
    const iso = Object.assign({}, ISO, { P: (x, y, z) => { R.pts.push([x, y, z]); return [R.pts.length - 1, 0]; }, f: n => String(n),
      // (a depth asked for: kept, and its place in the asking returned, so the page's sorts keep the order it asks in, as
      // with one depth for all, and a sort's points are known after: t3dCatModel)
      dir: (x, y, z) => { R.dirs.push([x, y, z]); return R.dirs.length; },
      plane: (o, u, v) => { R.planes.push({ o, u, v }); return `matrix(0 0 0 0 ${R.planes.length - 1} ${SG})`; } });
    return T3DC.maker = __cat3dFactory(iso);
  }
  const t3dCatKS = id => { const K = (t3dCatMaker().COATS[id] || {}); return 1.2 * (K.size || 1) * Math.sqrt(1.5); };
  // a tail: its centre line (the catmull points tail() projects) and its width at each (screen units, as tail() has it)
  function t3dCatTailOf(run, puff, coat) {
    const R = T3DC.rec; R.pts.length = 0; R.planes.length = 0; R.dirs.length = 0; run();
    const pts = R.pts.slice(), n = pts.length, KS = t3dCatKS(coat), K = t3dCatMaker().COATS[coat] || t3dCatMaker().COATS.mike;
    const rad = pts.map((_, i) => (1.9 - .6 * i / (n - 1)) * KS * (puff ? (1.7 - .25 * i / (n - 1)) * (i > 2 ? (i % 2 ? 1.2 : .88) : 1) : 1));
    return { pts, rad, cols: K.tail };
  }
  function t3dCatTail(id, run, puff, coat, xray = false) {
    const mid = M().id; if (!T3DC.key || !T3D.ready.has(mid)) return;
    NATIVE.post('turn3d', { type: 'cattail', machine: mid, cat: id, xray, tail: t3dCatTailOf(run, puff, coat) });
  }
  // the cats at this machine, as the page drew them last (their offset, pose, gear, coat), and the figure
  function t3dCats(m = M()) {
    if (!T3D_MODELS.includes(m.id) || !T3D.ready.has(m.id) || !window.__cat3dFactory) return;
    // (looked for in the machine's own groups, not the street's: each look over the whole street, 2026-10-30)
    const cel = t3dRoots(m.id).flatMap(r => [...r.querySelectorAll('.cat-n[data-cat]')]), here = cel.map(g => g.dataset.cat);
    const onTray = id => cel.some(g => g.dataset.cat === id && g.dataset.pose === 'tray');
    const fig = typeof COLLECT !== 'undefined' && COLLECT.figureOn(m.id) && T3DC.maneki;
    const key = JSON.stringify([here.map(id => { const a = T3DC.args.get(id), x = T3DC.xargs.get(id), tray = onTray(id);
      return [id, tray ? 'tray' : a ? [a[1], a[2], a[3]] : 0, x ? [x[1], x[3]] : 0]; }), fig || 0, device.dataset.art]);
    if (key === T3DC.key) return;
    T3DC.key = key;
    // (each cat kept by what she is drawn from, made again only when that changed; those not kept made a few ms a frame,
    // all sent once all are made: the four on the machine made at once, 240 ms at 4× slower coming to it, 2026-10-30)
    const CM = T3DC.models || (T3DC.models = new Map()); if (CM.size > 60) CM.clear();
    const t0 = performance.now(); let made = 0, pend = false;
    // (its pictures encoded off the page's thread (t3dPng), the cat kept once they are: 300 ms frames at 4× slower coming
    // to the machine, nearly all of it the PNGs, 2026-10-30)
    const enc = T3DC.enc || (T3DC.enc = new Set());
    const kept = (k, make) => { if (CM.has(k)) return CM.get(k); if (enc.has(k) || made && performance.now() - t0 > 6) { pend = true; return null; }
      made++; let c = null; try { c = make(); } catch (e) { console.warn('turn3d cat', k, e); }
      const pics = [], walk = o => { if (!o || typeof o !== 'object' || o instanceof HTMLCanvasElement) return; if (o.cv) pics.push(o); for (const v of Object.values(o)) walk(v); }; walk(c);
      if (!pics.length) { CM.set(k, c); return c; }
      enc.add(k); pend = true;
      Promise.all(pics.map(o => t3dPng(o.cv).then(png => { o.png = png; delete o.cv; }))).then(() => { enc.delete(k); CM.set(k, c); T3DC.key = null; T3D.lookAt = 0; });
      return null; };
    const cats = [];
    for (const id of here) {
      const tray = onTray(id), a = T3DC.args.get(id), x = T3DC.xargs.get(id);
      const c = kept(JSON.stringify([id, tray ? 'tray' : a ? [a[1], a[2], a[3]] : 0, x ? [x[1], x[3]] : 0, device.dataset.art]), () => {
        const xr = x && t3dCatModelX(() => t3dCatMaker().draw(true, x[1], {}, x[3], id));
        if (xr) { xr.id = id; xr.tail = t3dCatTailOf(() => t3dCatMaker().tail(0, x[1], true, x[3], id), 0, id); }
        if (tray) return { id, tail: t3dCatTailOf(() => t3dCatMaker().tailOut(0, CORE.FLAP, id, false, 0), 0, id), xr };
        if (!a) return null;
        const c = t3dCatModel(() => t3dCatMaker().draw(false, a[1], a[2] || {}, a[3], id));
        c.id = id; c.tail = t3dCatTailOf(() => t3dCatMaker().tail(0, a[1], false, a[3], id), 0, id); c.xr = xr;
        return c; });
      if (c) cats.push(c);
    }
    if (fig) { const c = kept(JSON.stringify(['maneki', fig, device.dataset.art]), () => { const c = t3dCatModel(() => t3dCatMaker().maneki(...fig)); c.id = 'maneki'; return c; }); if (c) cats.push(c); }
    // (some still to make: looked at again the next frame, nothing sent till then)
    T3DC.pending = pend; if (pend) { T3DC.key = null; T3D.lookAt = 0; return; }
    const ink = getComputedStyle(device).getPropertyValue('--catink').trim() || '#2a2030';
    // (the lines' widths on the screen, CSS px: .cks outline, .ckf fold, .ckt round the tail and balls — index.html, by the art)
    const lines = device.dataset.art === 'zzz' ? [1.8, .7, 3.6] : [1.2, .7, 2.4];
    NATIVE.post('turn3d', { type: 'cats', machine: m.id, ink, lines, cats });
    T3DC.watched = null;
  }
  // one recorded run: its faces (each part's, numbered: the outline is each part's own), the drawings on its surfaces
  // (the face's with its eyes apart: shut, open), its balls (a pompom, the bell)
  function t3dCatModel(run) {
    const R = T3DC.rec; R.pts.length = 0; R.planes.length = 0; R.dirs.length = 0;
    // (the page's own sorts as it draws her (cat3d.js draw(): her body, head and paws by a point of each, the ears in the
    // head by theirs; the figure's ears): each item marked where it lands in the drawing, its point kept. The app sorts
    // them again by those points as she turns (`order`, Turn3D.swift drawCat), so she is painted as the page paints her)
    const lists = [], sort0 = Array.prototype.sort;
    Array.prototype.sort = function (...a) {
      if (this.length > 1 && this.every(e => e && typeof e.s === 'string' && typeof e.d === 'number' && R.dirs[e.d - 1])) {
        const L = lists.length; lists.push(this.map((e, i) => { e.s = `<g data-t3dk="${L}.${i}"></g>${e.s}<g data-t3dk="${L}.${i}e"></g>`; return R.dirs[e.d - 1]; }));
      }
      return sort0.apply(this, a);
    };
    let svg; try { svg = run(); } finally { Array.prototype.sort = sort0; }
    const pts = R.pts.slice(), planes = R.planes.slice();
    if (!T3DC.holder) { T3DC.holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); T3DC.holder.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:10px;height:10px;visibility:hidden'); device.appendChild(T3DC.holder); }
    const box = T3DC.holder; box.innerHTML = svg;
    const out = { faces: [], fills: [], parts: [], decals: [], balls: [] };
    // the drawings on a surface first (taken out, so their own paths are not read as faces); each with the count of part
    // outlines the page drew before it (`after`): the app paints it after that part, as the page (Turn3D.swift drawCat)
    const lines = [...box.querySelectorAll('.ckf, .cks')];
    for (const g of [...box.querySelectorAll('g[transform^="matrix(0 0 0 0 "]')]) {
      const k = +/matrix\(0 0 0 0 (\d+) 77777\)/.exec(g.getAttribute('transform'))[1], pl = planes[k];
      const after = lines.filter(e => g.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING).length;
      g.removeAttribute('transform');
      const shut = g.querySelector('.eyes-shut'), open = g.querySelector('.eyes-open'), all = [...g.querySelectorAll('*')], was = all.map(e => e.style.display);
      for (const tag of shut && open ? ['base', 'shut', 'open'] : ['all']) {
        const only = tag === 'shut' ? shut : tag === 'open' ? open : null;
        all.forEach((e, i) => { e.style.display = was[i]; });
        if (tag === 'base') shut.style.display = open.style.display = 'none';
        if (only) { all.forEach(e => { if (!(e === only || only.contains(e) || e.contains(only))) e.style.display = 'none'; }); only.style.display = ''; }
        const d = t3dCatPaint(g, pl);
        if (d) { d.tag = tag; d.after = after; out.decals.push(d); }
      }
      g.remove();
    }
    let part = 0; const marks = {};
    for (const el of [...box.querySelectorAll('path, circle, g[data-t3dk]')]) {
      if (el.tagName === 'g') { marks[el.getAttribute('data-t3dk')] = part; continue; }
      if (el.tagName === 'circle') {
        // (a ball: its outline circle at a recorded point, cy 0; not the tail's round tip, which the app's tail draws itself:
        // a shiny ball at its end, 2026-10-30)
        if (el.classList.contains('ckt') && !el.closest('.cat-tail') && el.getAttribute('cy') === '0' && Number.isInteger(+el.getAttribute('cx'))) out.balls.push({ ...t3dCatBall(pts[+el.getAttribute('cx')], +el.getAttribute('r'), el.getAttribute('fill')), after: part });
        continue;
      }
      if (el.classList.contains('ckf') || el.classList.contains('cks')) { part++; continue; }   // (a part's folds and outline: the next is another part)
      if (el.getAttribute('class') || !el.getAttribute('fill') || el.closest('.cat-tail')) continue;
      const ids = (el.getAttribute('d') || '').replace(/^M|Z$/g, '').split('L').map(q => q.trim().split(' ')).filter(q => q.length === 2 && q[1] === '0').map(q => +q[0]);
      if (ids.length < 3 || ids.some(i => !pts[i])) continue;
      out.faces.push(ids.flatMap(i => pts[i])); out.fills.push(el.getAttribute('fill')); out.parts.push(part);
    }
    // (the z she breathes out asleep, cat3d.js draw() .zz over her head: its letter as the page sets it, a card facing the
    // screen at its point; how far it has floated and how strong it is come with her state, "catstate" z)
    const zt = box.querySelector('text.zz');
    if (zt && pts[+zt.getAttribute('x')]) out.z = t3dCatLetter(zt, pts[+zt.getAttribute('x')]);
    // (each sort: its items, each the parts it holds (part numbers lo up to hi) and the point it is sorted by)
    out.order = lists.map((at, L) => at.map((p, i) => ({ at: p, lo: marks[`${L}.${i}`], hi: marks[`${L}.${i}e`] })).filter(it => it.lo != null && it.hi != null));
    box.innerHTML = '';
    return out;
  }
  /* a cat X-rayed (CAT3D.draw(true, …), the wireframe's layer): the same faces, faint (.ckx), with its outline (.xcatline)
     and folds (.ckxf) drawn by the shell as for the cat; its bones (.xbone: the spine, the ribs) as lines through
     recorded points; the drawings on it (the head's ring, eyes and mouth, the fish) as pictures; the colours and widths
     as the page's style gives them (index.html) */
  function t3dCatModelX(run) {
    const R = T3DC.rec; R.pts.length = 0; R.planes.length = 0; R.dirs.length = 0;
    const svg = run(), pts = R.pts.slice(), planes = R.planes.slice();
    if (!T3DC.holder) { T3DC.holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); T3DC.holder.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:10px;height:10px;visibility:hidden'); device.appendChild(T3DC.holder); }
    const box = T3DC.holder; box.innerHTML = svg;
    const out = { faces: [], fills: [], parts: [], decals: [], bones: [] };
    const css = c => { const el = box.querySelector(c); return el ? getComputedStyle(el) : null; }, line = css('.xcatline'), fold = css('.ckxf'), bone = css('.xbone'), face = css('.ckx');
    const op = (c, k) => { const v = (/\(([^)]+)\)/.exec(c) || [, '63,217,238'])[1].split(/[\s,/]+/).filter(Boolean).map(Number); return `rgba(${v[0]},${v[1]},${v[2]},${(v.length > 3 ? v[3] : 1) * k})`; };
    out.style = { line: op(line?.stroke, 1), fold: op(fold?.stroke, +(fold?.strokeOpacity ?? 1)), bone: op(bone?.stroke, 1), w: [line, fold, bone].map((c, i) => parseFloat(c?.strokeWidth) || [1, .6, 1.1][i]) };
    const fill = face ? op(face.fill, +(face.fillOpacity ?? 1)) : 'rgba(63,217,238,.05)';
    for (const g of [...box.querySelectorAll('g[transform^="matrix(0 0 0 0 "]')]) {
      const k = +/matrix\(0 0 0 0 (\d+) 77777\)/.exec(g.getAttribute('transform'))[1];
      g.removeAttribute('transform');
      const d = t3dCatPaint(g, planes[k]); if (d) { d.tag = 'all'; out.decals.push(d); }
      g.remove();
    }
    let part = 0;
    for (const el of [...box.querySelectorAll('path')]) {
      if (el.closest('.cat-tail')) continue;
      if (el.classList.contains('ckxf') || el.classList.contains('xcatline')) { part++; continue; }   // (a part's folds and outline: the next is another part)
      const ids = (el.getAttribute('d') || '').replace(/^M|Z$/g, '').split('L').map(q => q.trim().split(' ')).filter(q => q.length === 2 && q[1] === '0').map(q => +q[0]);
      if (ids.length < 2 || ids.some(i => !pts[i])) continue;
      if (el.classList.contains('xbone')) out.bones.push(ids.flatMap(i => pts[i]));
      else if (el.classList.contains('ckx') && ids.length >= 3) { out.faces.push(ids.flatMap(i => pts[i])); out.fills.push(fill); out.parts.push(part); }
    }
    box.innerHTML = '';
    return out;
  }
  // a drawing on a surface: its box in the surface's units, painted at 16 px a unit; its corners in the world
  function t3dCatPaint(g, pl) {
    const b = g.getBBox(); if (!b.width || !b.height) return null;
    const pad = .6, x0 = b.x - pad, y0 = b.y - pad, w = b.width + 2 * pad, h = b.height + 2 * pad, PX = 16;
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w * PX); cv.height = Math.ceil(h * PX);
    const ctx = t3dCtx(cv); ctx.setTransform(PX, 0, 0, PX, -x0 * PX, -y0 * PX); t3dDraw(ctx, g, true);
    const at = (x, y) => [0, 1, 2].map(i => pl.o[i] + pl.u[i] * x + pl.v[i] * y);
    const n = [pl.u[1] * pl.v[2] - pl.u[2] * pl.v[1], pl.u[2] * pl.v[0] - pl.u[0] * pl.v[2], pl.u[0] * pl.v[1] - pl.u[1] * pl.v[0]], l = Math.hypot(...n) || 1;
    // (the side it is seen from: u × v, the front (+y) for a face drawn on the front, the top (+z) for one on the top)
    const face = n.map(v => v / l);
    return { p: [at(x0, y0), at(x0 + w, y0), at(x0 + w, y0 + h), at(x0, y0 + h)], face, u: pl.u, v: pl.v, cv };
  }
  // a ball (CAT3D balls(): an inked circle, the colour, a highlight) as a card facing the screen, r in screen units
  function t3dCatBall(at, r, fill) {
    const E = .9, R = r + E, PX = 16, cv = document.createElement('canvas'); cv.width = cv.height = Math.ceil(2 * R * PX);
    const ctx = t3dCtx(cv), c = R * PX;
    ctx.fillStyle = getComputedStyle(device).getPropertyValue('--catink').trim() || '#2a2030'; ctx.beginPath(); ctx.arc(c, c, R * PX, 0, 7); ctx.fill();
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(c, c, r * PX, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(c - r * .32 * PX, c - r * .38 * PX, r * .26 * PX, 0, 7); ctx.fill();
    return { at, rect: [-R, -R, 2 * R, 2 * R], cv };
  }
  // a letter the page writes at a recorded point (x its point's number, y 0): drawn as the page sets it, at full strength,
  // its box (screen units) from that point
  function t3dCatLetter(el, at) {
    const b = el.getBBox(), x0 = +el.getAttribute('x'), y0 = +el.getAttribute('y') || 0, pad = .4, PX = 16;
    const r = [b.x - x0 - pad, b.y - y0 - pad, b.width + 2 * pad, b.height + 2 * pad];
    const cv = document.createElement('canvas'); cv.width = Math.ceil(r[2] * PX); cv.height = Math.ceil(r[3] * PX);
    const ctx = t3dCtx(cv); ctx.setTransform(PX, 0, 0, PX, -(x0 + r[0]) * PX, -(y0 + r[1]) * PX);
    const op = el.style.opacity; el.style.opacity = '1'; t3dDraw(ctx, el, true); el.style.opacity = op;
    return { at, rect: r, cv };
  }
  // what the page changes on its own cats: the eyes (open, and where they look), the shake (a nudge across the screen),
  // the z as it floats off (env.js UTIL.puff: its nudge, screen units, and its strength)
  function t3dCatWatch() {
    const mid = M().id, els = [...cam.querySelectorAll(`.mroot[data-m="${mid}"] .cat-n[data-cat]`)];
    if (T3DC.watched && els.length === T3DC.watched.length && els.every((e, i) => e === T3DC.watched[i])) return;
    T3DC.watched = els;
    const send = g => { const id = g.dataset.cat, eo = g.querySelector('.eyes-open'), tr = /translate\(([-\d.]+)[ ,]*([-\d.]*)\)/;
      const w = tr.exec(g.getAttribute('transform') || ''), e = eo && tr.exec(eo.getAttribute('transform') || '');
      const zz = g.querySelector('.zz'), zt = zz && tr.exec(zz.getAttribute('transform') || ''), zo = zz ? +zz.style.opacity || 0 : 0;
      NATIVE.post('turn3d', { type: 'catstate', machine: mid, cat: id, open: !!eo && eo.style.display !== 'none', eye: e ? [+e[1], +e[2] || 0] : [0, 0], wob: w ? +w[1] : 0,
        z: [zt ? +zt[1] : 0, zt ? +zt[2] || 0 : 0, zo] }); };
    if (T3DC.obs) T3DC.obs.disconnect();
    T3DC.obs = new MutationObserver(list => { const seen = new Set(); for (const r of list) { const g = r.target.closest && r.target.closest('.cat-n[data-cat]');
      if (g && !seen.has(g)) { seen.add(g); send(g); } } });
    els.forEach(g => { T3DC.obs.observe(g, { subtree: true, attributes: true, attributeFilter: ['style', 'transform'] }); send(g); });
  }

  // the machine's outside as this save has it: the prices on its tags, the 大容量 sticker, the album's sticker. The model
  // was exported from a new game's machine (tools/turn3d), so these are drawn here from the page's own elements, flat on
  // a canvas in their face's units (the page's fonts, the words as the page shows them), and the shell lays them on the
  // model's faces (Turn3D "decals"). Sent when they change, checked as a turn or a pinch starts (the owner's phone,
  // 2026-10-30: the tags were cut out with the display window, gone while it turned and back once it stopped)
  const T3D_FACE = { door: { O: [0, 84, 240], U: [1, 0, 0], V: [0, 0, -1] }, right: { O: [120, 84, 240], U: [0, -1, 0], V: [0, 0, -1] },
    left: { O: [0, 0, 240], U: [0, 1, 0], V: [0, 0, -1] } };
  // (a part's markup as a key, without what platform/nss.js writes on it for the screen's line widths (--ndk, data-ndq):
  // those change with the angle and the zoom, and every decal was painted again after each turn, 2026-10-30)
  // (霓虹 worn: every picture of the page's parts painted again, the same markup looking otherwise, t3dNeon)
  const t3dKeyOf = h => (t3dNeon(M().id) ? 'neon;' : '') + (h || '').replace(/ data-ndq=""/g, '').replace(/--ndk:\s*[-\d.e+]+;?\s*/g, '').replace(/ style=""/g, '');
  const T3D_DECALS = {
    drink: g => { const door = g.querySelector('.mroot[data-m="drink"] #dk-door'), out = door && door.querySelector('.door-out'); if (!out) return [];
      // (the tags, the 大容量 sticker, the heat pump's あったか〜い bar: the only raised part with a readycap)
      return [...out.children].filter(e => e.tagName === 'g' && (e.querySelector(':scope > rect[width="13"][height="4.4"]') || /rotate/.test(e.getAttribute('transform') || '')
        || (e.classList.contains('r3') && e.querySelector('.readycap'))))
        // (the bar's words on its raised cap, R3 depth .8: at the door's own height the display window's frame hid half of it)
        // (a raised part's key: its cap and what is on it, without the push that follows the angle (CORE.raised), painted
        // where the model has it whatever the angle; with it, every turn painted all the decals again, 2026-10-30)
        .map(el => { const r3 = el.classList.contains('r3') && el.querySelector('.readycap');
          return { el, plane: door, face: T3D_FACE.door, key: t3dKeyOf(r3 ? el.getAttribute('class') + r3.closest('.capin').innerHTML : el.outerHTML), lift: r3 ? .86 : .06 }; }); },
    // the menu tiles (the save's goods plan: its icon, name, price, lamp, 売切) on their raised caps, R3 depth 1; pressed
    // with the cap (marks tileK, the decal moved with it)
    // (the cap itself painted: t3dPaint takes it back off its push across the screen and lays it R3's 1 out, t3dRaisedOf;
    // its key without its glow's strength, which fades on its own, __t3dGlow)
    teppan: g => [...g.querySelectorAll('.mroot[data-m="teppan"] .tp-door .door-out .tp-tile .capin')].map(el => { const k = el.closest('.tp-tile').getAttribute('data-k');
      return { el, plane: el.closest('.tp-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="tp-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; }),
    // the menu panels (a shelf's goods: its icon, name, price, lamp, 売切), as the teppan's tiles; where they stand on the
    // door by the extra shelf
    frozen: g => [...g.querySelectorAll('.mroot[data-m="frozen"] .fz-door .door-out .fz-row .capin')].map(el => { const k = el.closest('.fz-row').getAttribute('data-k');
      return { el, plane: el.closest('.fz-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="fz-glow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'row' + k }; }),
    // the menu tiles (the bowl, its name, price, lamp, 売切), as the teppan's
    ramen: g => [...g.querySelectorAll('.mroot[data-m="ramen"] .ra-door .door-out .ra-tile .capin')].map(el => { const k = el.closest('.ra-tile').getAttribute('data-k');
      return { el, plane: el.closest('.ra-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="ra-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; }),
    // the menu tiles, as the teppan's; and the TURBO plate the turbo whipper puts on the door, a raised part with a readycap
    // as the drink machine's heat pump bar (its words lifted out of the door's frame)
    cup: g => { const door = g.querySelector('.mroot[data-m="cup"] .cu-door'), out = door && door.querySelector('.door-out'); if (!out) return [];
      return [...out.querySelectorAll('.cu-tile .capin')].map(el => { const k = el.closest('.cu-tile').getAttribute('data-k');
        return { el, plane: door, face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="cu-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; })
        .concat([...out.children].filter(e => e.classList.contains('r3') && e.querySelector('.readycap') && !e.querySelector('.cu-readyt'))
          .map(el => ({ el, plane: door, face: T3D_FACE.door, key: t3dKeyOf(el.getAttribute('class') + el.querySelector('.readycap').closest('.capin').innerHTML), lift: .86 })))
        // (the mill's badge, turned on the door: one of the live parts, it was not there in 3D on the simulator, 2026-10-31)
        .concat([...out.children].filter(e => e.tagName === 'g' && /rotate/.test(e.getAttribute('transform') || ''))
          .map(el => ({ el, plane: door, face: T3D_FACE.door, key: t3dKeyOf('badge' + el.innerHTML) }))); },
    juice: g => [...g.querySelectorAll('.mroot[data-m="juice"] .ju-door .door-out .ju-tile .capin')].map(el => { const k = el.closest('.ju-tile').getAttribute('data-k');
      return { el, plane: el.closest('.ju-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="ju-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; }),
    // (the 両面焼 plate: raised with a readycap like the lamps beside it, the lamps live)
    auto: g => { const door = g.querySelector('.mroot[data-m="auto"] .au-door'), out = door && door.querySelector('.door-out'); if (!out) return [];
      return [...out.querySelectorAll('.au-tile .capin')].map(el => { const k = el.closest('.au-tile').getAttribute('data-k');
        return { el, plane: door, face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="au-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; })
        .concat([...out.children].filter(e => e.classList.contains('r3') && e.querySelector('.readycap') && !e.querySelector('.au-ready, .au-lamp-t, .au-lamp-b, .au-lamp-c'))
          .map(el => ({ el, plane: door, face: T3D_FACE.door, key: t3dKeyOf(el.getAttribute('class') + el.querySelector('.readycap').closest('.capin').innerHTML), lift: .86 }))); },    // the touchscreen's tiles (the goods plan: icon, name, price, lamp, 売切), flat as the drink machine's tags; while the
    // PC reboots its screen over them instead (the bar growing: painted again each time the page moves it, every 0.4 s)
    digital: g => { const door = g.querySelector('.mroot[data-m="digital"] .pk-door'), out = door && door.querySelector('.door-out'); if (!out) return [];
      const boot = out.querySelector('.pk-boot');
      if (boot && boot.style.display !== 'none') return [{ el: boot, plane: door, face: T3D_FACE.door, key: t3dKeyOf('boot' + boot.innerHTML) }];
      return [...out.querySelectorAll('.pk-tile')].map(el => ({ el, plane: door, face: T3D_FACE.door, key: t3dKeyOf(el.getAttribute('data-k') + el.innerHTML.replace(/(class="pk-tglow[^>]*?) opacity="[^"]*"/, '$1')) })); },
    // the menu tiles (the save's goods plan: icon, price (+プリン with the dessert shelf), name, lamp, 売切), as the teppan's
    teishoku: g => [...g.querySelectorAll('.mroot[data-m="teishoku"] .ob-door .door-out .ob-tile .capin')].map(el => { const k = el.closest('.ob-tile').getAttribute('data-k');
      return { el, plane: el.closest('.ob-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="ob-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; }),
    // the menu tiles (the save's goods plan: icon, name, price, lamp, 売切), as the teishoku's
    sushi: g => [...g.querySelectorAll('.mroot[data-m="sushi"] .su-door .door-out .su-tile .capin')].map(el => { const k = el.closest('.su-tile').getAttribute('data-k');
      return { el, plane: el.closest('.su-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="su-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; }),
    // the menu tiles (the save's goods plan: icon, name, price, lamp, 売切), as the teishoku's
    oden: g => [...g.querySelectorAll('.mroot[data-m="oden"] .od-door .door-out .od-tile .capin')].map(el => { const k = el.closest('.od-tile').getAttribute('data-k');
      return { el, plane: el.closest('.od-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="od-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; }),
    // the menu tiles (the save's goods plan: icon, name, price, lamp, 売切), as the teishoku's
    taiyaki: g => [...g.querySelectorAll('.mroot[data-m="taiyaki"] .ty-door .door-out .ty-tile .capin')].map(el => { const k = el.closest('.ty-tile').getAttribute('data-k');
      return { el, plane: el.closest('.ty-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="ty-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; }),
    // the menu tiles (the save's goods plan: icon, name, price, lamp, 売切), as the teishoku's
    kakigori: g => [...g.querySelectorAll('.mroot[data-m="kakigori"] .kg-door .door-out .kg-tile .capin')].map(el => { const k = el.closest('.kg-tile').getAttribute('data-k');
      return { el, plane: el.closest('.kg-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="kg-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; }),
    // the menu tiles (the save's goods plan: icon, name, price, lamp, 売切, つまり), as the teishoku's
    gacha: g => [...g.querySelectorAll('.mroot[data-m="gacha"] .gc-door .door-out .gc-tile .capin')].map(el => { const k = el.closest('.gc-tile').getAttribute('data-k');
      return { el, plane: el.closest('.gc-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="gc-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; }),
    kissa: g => [...g.querySelectorAll('.mroot[data-m="kissa"] .ks-door .door-out .ks-tile .capin')].map(el => { const k = el.closest('.ks-tile').getAttribute('data-k');
      return { el, plane: el.closest('.ks-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="ks-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; }),
    bakery: g => [...g.querySelectorAll('.mroot[data-m="bakery"] .pb-door .door-out .pb-tile .capin')].map(el => { const k = el.closest('.pb-tile').getAttribute('data-k');
      return { el, plane: el.closest('.pb-door'), face: T3D_FACE.door, key: t3dKeyOf(k + el.innerHTML.replace(/(class="pb-tglow[^>]*?) opacity="[^"]*"/, '$1')), mark: 'tile' + k }; }),
  };
  function t3dDecals(m = M()) {
    if (!t3dOn || !T3D.ready.has(m.id) || !T3D_DECALS[m.id]) return;
    // (only the machine shown up close, its parts drawn: painted from the street when the shell said it was ready, they
    // came out blank, their key keeping them so — the price tags, the 暖～呼 bar and the 大容量 sticker gone in 3D on the
    // simulator, 2026-10-30; a part not drawn left out, and none looked at while t3dReveal shows the page's parts again)
    if (__ND.view !== 'machine' || M() !== m || T3D.reveal) return;
    if (t3dDoorA(m) > .002) return;   // (the door swung open: its picture has them, t3dDoorPics)
    const g = cam;   // (each of the machine's layers has a .mroot of its own)
    const side = Math.sin(Math.PI / 4 + __ND.yaw * Math.PI / 180) >= 0 ? 'right' : 'left';
    const list = T3D_DECALS[m.id](g).concat([...g.querySelectorAll(`.mroot[data-m="${m.id}"] .wstk`)].map(el => ({ el, plane: el, face: T3D_FACE[side], key: side + t3dKeyOf(el.innerHTML) })))
      .filter(d => { if (!d.el.getClientRects().length) return false; const b = d.el.getBBox(); return b.width > 0 && b.height > 0; });
    const key = list.map(d => d.key).join('|');
    // (back to what was sent last: one still being encoded is not sent after it)
    if ((T3D.decals || (T3D.decals = new Map())).get(m.id) === key) { T3D.decalPend = null; return; }
    if (T3D.decalPend === m.id + key) return;
    // (each painted once for what it shows: a sticker changed, the others not painted again; drawn here, encoded off the
    // page's thread (t3dPng) and all sent once done: one look after a sale painted several, 388 ms on the phone, 2026-10-30)
    const items = [], mine = new Set(list.map(d => d.el)), pics = T3D.decalPics || (T3D.decalPics = new Map()), keep = new Map(), todo = [];
    for (const d of list) try { const k = m.id + '|' + d.key; let it = pics.get(k);
      if (!it) { const r = t3dPaint({ ...d, raw: true }, mine); it = { p: r.p, face: r.face, ...(d.mark ? { mark: d.mark } : {}) }; todo.push([it, r.cv]); }
      keep.set(k, it); items.push(it); } catch (e) { console.warn('turn3d decal', e); }
    const send = () => { T3D.decals.set(m.id, key);
      for (const [k, it] of keep) pics.set(k, it); if (pics.size > 60) { pics.clear(); for (const [k, it] of keep) pics.set(k, it); }
      NATIVE.post('turn3d', { type: 'decals', machine: m.id, key: String(key.length) + ':' + items.length + ':' + Date.now(), items }); };
    if (!todo.length) { send(); return; }
    const pk = T3D.decalPend = m.id + key;
    Promise.all(todo.map(([it, cv]) => t3dPng(cv).then(png => { it.png = png; }))).then(() => { if (T3D.decalPend !== pk) return; T3D.decalPend = null; send(); });
  }
  const T3D_LIVE = window.__t3dLive, T3D_GLOW = window.__t3dGlow;
  // the glows' strengths and the moved parts' matrices, as the page has them now (t3dLive; alone when nothing else changed)
  function t3dGlowMove({ m, gls, mv }, R) {
    // (a glow's strength, apart: its picture stays; drink.js glow() sets it as the element's opacity attribute)
    const a = gls.map(e => { const o = e.getAttribute('opacity'); return o == null ? 1 : +(+o).toFixed(3); }).join(',');
    if (a !== T3D.glowSent) { T3D.glowSent = a; NATIVE.post('turn3d', { type: 'glow', machine: m, a: a.split(',').map(Number) }); }
    // (the parts the page moves: each as its plane has it now against at rest, a matrix in the plane's units; where it sits
    // in its plane kept for the element, getCTM making the page lay itself out there and then)
    const PM = T3D.movePlane || (T3D.movePlane = new WeakMap());
    const ms = JSON.stringify(mv.map(el => {
      if (!el) return [1, 0, 0, 1, 0, 0];
      let P = PM.get(el);
      if (!P) { let plane = null; for (let e = el.parentElement; e && !e.classList?.contains('mroot'); e = e.parentElement) if (e.getAttribute && R.planes.has(e.getAttribute('transform'))) { plane = e; break; }
        if (!plane) return [1, 0, 0, 1, 0, 0]; PM.set(el, P = plane.getCTM().inverse().multiply(el.parentElement.getCTM())); }
      const t = el.transform.baseVal.consolidate(); if (!t) return [1, 0, 0, 1, 0, 0];
      const D = P.multiply(t.matrix).multiply(P.inverse());
      return [D.a, D.b, D.c, D.d, D.e, D.f].map(v => +v.toFixed(4));
    }));
    if (ms !== T3D.moveSent) { T3D.moveSent = ms; NATIVE.post('turn3d', { type: 'moves', machine: m, m: JSON.parse(ms) }); }   // ('moves', not 'move': that is the turn's angle)
  }
  // (?t3dtick=1: a slow look told apart, T3DLIVE in the diag log: its steps' ms, the pictures painted, their bitmaps, KB)
  function t3dLive(m = M()) {
    if (!T3D_TICK) return t3dLive0(m);
    const a = performance.now(); T3D.lap = null; T3D.lapN = { np: 0, paint: 0, bmp: 0, kb: 0 }; t3dLive0(m); const d = performance.now() - a, L = T3D.lap;
    if (L) L.slice(1).forEach((x, i) => t3dTickAdd('L.' + x[0], x[1] - L[i][1]));
    if (d > 15 && L) NATIVE.post('diag', `T3DLIVE ${d.toFixed(0)}ms ` + L.slice(1).map((x, i) => x[0] + ' ' + (x[1] - L[i][1]).toFixed(0)).join(' ') + ` | painted ${T3D.lapN.np} ${T3D.lapN.paint.toFixed(0)}ms bitmap ${T3D.lapN.bmp.toFixed(0)}ms sent ${T3D.lapN.kb.toFixed(0)}KB ${T3D.lapF || ''}`); }
  function t3dLive0(m) {
    const R = window.__REC, sel = T3D_LIVE[m.id];
    // (not while the shell turns or zooms: the parts' drawings change with the angle and the zoom, not what they show; the
    // app made a texture of every picture in it on its own thread, a frame of 50-100 ms on the phone each time, 2026-10-30)
    if (!t3dFull || !sel || !R || !R.on || !T3D.ready.has(m.id) || T.active) return;
    // (looked at again only when the page has changed something in the machine that it shows (a mutation in a part it
    // showed last time, or a part added or taken away), for a moment after (a CSS transition on), and once a second: every
    // frame, its getComputedStyle and queries held the page at 24–31 fps at rest on the phone, 2026-10-30)
    t3dWatch();
    const now = performance.now();
    // (the door open: the insides seen as under the X-ray, the door's own parts in its picture, t3dDoorPics; none of
    // them painted again at each angle of its swing, their face turning with it)
    const doorD = t3dDoorOf(m), doorUp = !!doorD && t3dDoorA(m) > .002, inDoor = e => doorUp && !!e.closest(doorD.hide.join(','));
    // (only a glow's strength or a moved part's transform changed (glowDirty): those two alone, not every part looked at
    // again — through a sale the glows and the flap changed every frame, each a whole look, 8 ms a frame on the phone,
    // 2026-10-30; a glow lit whose picture is not there yet makes a whole look)
    if (T3D.liveKey && T3D.liveM === m.id && (__ND.xr > .002 || doorUp) === T3D.liveXr && doorUp === !!T3D.liveDoor && now - (T3D.liveDirty || 0) > 700 && now - (T3D.liveLook || 0) < 1000) {
      if (T3D.gm && T3D.gm.m === m.id && (T3D.glowDirty || 0) > T3D.gm.at) { T3D.gm.at = now;
        if (T3D.glowMiss && T3D.gm.gls.some(e => T3D.glowMiss.has(e) && +(e.getAttribute('opacity') ?? 1) > 0)) T3D.liveDirty = now; else { t3dGlowMove(T3D.gm, R); return; } }
      else return; }
    T3D.liveLook = now; const lap = T3D_TICK ? n => (T3D.lap || (T3D.lap = [['', now]])).push([n, performance.now()]) : () => {};
    // (looked for within the machine's own roots, and only again once the page has added or taken away something in them:
    // the list joined under '.mroot[data-m=…]' over the whole street took 3 ms a frame in Chromium, 25 times this)
    // (the insides looked at on each look under the X-ray, else only once a second, kept ready for it: their coins changed
    // through a sale, ~40 KB sent each time, seen by no one)
    const xrOn = __ND.xr > .002 || doorUp, roots = t3dRoots(m.id), full = T3D.liveM !== m.id || !T3D.liveKey || xrOn !== T3D.liveXr || doorUp !== !!T3D.liveDoor || now - (T3D.liveFull || 0) > 1000;
    if (full) T3D.liveFull = now; T3D.liveXr = xrOn; T3D.liveDoor = doorUp; if (T3D_TICK) T3D.lapF = (full ? 'full ' : '') + (xrOn ? 'xr ' : '') + (pend => pend ? 'pending ' + pend : '')(T3D.picPend && T3D.picPend.size);
    const withInt = xrOn || full;
    const Q = T3D.liveQ && T3D.liveQ.m === m.id && T3D.liveQ.at > (T3D.domDirty || 0) && !full ? T3D.liveQ : (T3D.liveQ = { m: m.id, at: now, l: new Map() });
    const within = list => { const k = list.join(','); let r = Q.l.get(k); if (!r) Q.l.set(k, r = roots.flatMap(e => [...e.querySelectorAll(k)])); return r; };
    T3D.liveM = m.id;
    // (each part's style read again only on the look once a second, when its class changes, and through its CSS transition
    // after (.led .2 s, .lit-text .5 s) 11 times a second and once at its end: getComputedStyle on all of them made the
    // browser work out the page's style there and then, ~9 ms a look in Chromium at the phone's speed, a look a frame
    // through a sale; a fade's steps each a picture painted and sent, 2026-10-30)
    const EC = T3D.ec || (T3D.ec = new WeakMap()), ec = e => { let c = EC.get(e); if (!c) EC.set(e, c = { cls: null, at: 0, rd: 0, tr: 0, s: '', done: true, int: !!e.closest('.g-int') }); return c; };
    const styleOf = e => {
      const hp = e.closest('[class*="hp-"]')?.getAttribute('class'), cls = [e.getAttribute('class'), t3dKeyOf(e.getAttribute('style')), hp].join(';'), c = ec(e);
      const changed = c.cls !== cls; if (changed) { c.cls = cls; c.at = now; c.done = false; }
      const fading = now - c.at <= c.tr;
      if (full || !c.s || changed || (fading && now - c.rd > 90) || (!fading && !c.done)) { const cs = getComputedStyle(e);
        c.s = [cs.display, cs.fill, cs.stroke, cs.opacity].join(';'); c.rd = now; c.done = !fading;
        c.tr = Math.max(0, ...cs.transitionDuration.split(',').map((d, i) => (parseFloat(d) + (parseFloat(cs.transitionDelay.split(',')[i]) || 0)) * 1000)); }
      return [c.s, hp]; };
    lap('q'); const ek = new Map(), nk = t3dNeon(m.id) ? 'neon;' : '';
    for (const e of within(sel)) { if ((!withInt && ec(e).int) || inDoor(e)) continue; const [st, hp] = styleOf(e); if (st.startsWith('none;')) continue;
      ek.set(e, nk + [e.getAttribute('class'), e.getAttribute('d'), e.getAttribute('x'), e.getAttribute('y'), e.getAttribute('height'), e.getAttribute('transform'), e.textContent, st, hp].join(';')); }
    const els = [...ek.keys()]; lap('styles');
    const gls = T3D_GLOW[m.id] ? within(T3D_GLOW[m.id]).filter(e => !inDoor(e)) : [];
    if (T3D.liveSetQ !== Q) { T3D.liveSetQ = Q; const watch = T3D.liveSet = new WeakSet(), mark = e => { watch.add(e); for (const d of e.querySelectorAll('*')) watch.add(d); };
      within(sel).forEach(mark); gls.forEach(mark); ((window.__t3dMotion[m.id] || {}).move || []).forEach(({ sel }) => within([sel]).forEach(mark)); }
    T3D.gm = { m: m.id, gls, mv: ((window.__t3dMotion[m.id] || {}).move || []).map(({ sel }) => within([sel])[0] || null), at: now };
    T3D.glowSet = new WeakSet(gls); T3D.moveSet = new WeakSet(T3D.gm.mv.filter(Boolean)); t3dGlowMove(T3D.gm, R);
    // (and by its place among them: the teppan's four tile glows alike in all but where they are had one key, so one
    // picture, the first tile's, for all four, and the first tile lit for the second, 2026-10-31)
    const gk = new Map(gls.map((e, i) => [e, i]).filter(([e]) => withInt || !ec(e).int).map(([e, i]) => [e, 'glow;' + nk + [e.getAttribute('class'), e.id, i, styleOf(e)[0].split(';').slice(1, 3)].join(';')]));
    // (each of the two parts sent only when what it shows changed, the other kept by the shell: a digit of the display
    // changed, the insides not sent again; the camera's zoom: how wide the pictures' non-scaling outlines are)
    lap('glowmove'); const zoom = Math.round(Math.log2(((T3D.vp || [innerWidth])[0]) / ((__ND.cam && __ND.cam.w) || 1)) * 3);
    const keyOf = isInt => [...ek, ...gk].filter(([e]) => ec(e).int === isInt).map(([, v]) => v).join('|') + '@' + zoom;
    const kExt = keyOf(false), kInt = withInt ? keyOf(true) : T3D.liveKInt, doExt = kExt !== T3D.liveKExt, doInt = withInt && kInt !== T3D.liveKInt;
    T3D.liveKey = kExt + '#' + kInt;
    // (looked at once since the shell took the machine: t3dHoldTick waits for it, T3D.liveSeen)
    lap('keys'); if (!doExt && !doInt) { T3D.liveSeen = true; return; }
    T3D.liveKExt = kExt; T3D.liveKInt = kInt;
    // (each picture painted once, kept by what it shows, and sent to the shell once, by its id after: a sale changes one or
    // two of the 36 (a digit, a lamp), and all of them painted and sent again each time, ~310 KB, 39 times a sale, held the
    // page's thread — the rain stopped, the shell's count at 120 — the owner on the phone, 2026-10-30)
    const pics = T3D.pics || (T3D.pics = new Map()), sentPic = T3D.picSent || (T3D.picSent = new Set());
    if (pics.size > 400) { pics.clear(); sentPic.clear(); }
    const fresh = !sentPic.size;
    // (new pictures painted a few ms a frame at most, the rest the next frame, each part showing its last picture till
    // then: the display's four digits and two lamps at once, 30–45 ms at the phone's speed in one frame, 2026-10-30)
    // (and while the page is not yet see-through, coming to the machine: the parts not painted yet left out till they are,
    // the page's own showing meanwhile (t3dHoldTick waits for them); all of them painted at once, 130 ms at 4× slower; a
    // glow out (idle) left till a frame has time, whenever: none of the shell's to show till a sale lights it)
    const t0 = performance.now(), last = T3D.lastPic || (T3D.lastPic = new WeakMap()), spread = !device.classList.contains('nd-t3d-full'); let later = 0, np = 0, wait = false;
    // (each drawn here and encoded off the page's thread (t3dPng), sent once ready, the part showing its last picture till
    // then, or one of the same at the zoom before: a pinch or the way in painted ~20 at once, 28 ms each on the phone,
    // nearly all of it the PNG, frames of 0.5–0.7 s, 2026-10-30; the page's machine built anew has new elements, and
    // none of them had a picture to show meanwhile)
    // (a picture being encoded is not looked at again each frame meanwhile: that sent the whole of the live parts every
    // frame till the last came, 0.5–0.6 s of the page's time each 2 s coming to the machine on the phone, 2026-10-30; those
    // done are sent together, a look at most every 150 ms; one not done in 3 s painted again)
    const lastK = T3D.lastByK || (T3D.lastByK = new Map()), pend = T3D.picPend instanceof Map ? T3D.picPend : (T3D.picPend = new Map()), kz = k => k.replace(/@-?\d+$/, '');
    const flush = () => { const t = performance.now(); T3D.picFlushT = 0; T3D.picFlushAt = t; T3D.liveDirty = t;
      if (T3D.picSides & 1) T3D.liveKExt = null; if (T3D.picSides & 2) T3D.liveKInt = null; T3D.picSides = 0; };
    const paintOnce = (k, f, el, idle) => { let d = pics.get(k);
      if (!d) {
        const old = last.get(el) || lastK.get(kz(k)), int = ec(el).int;
        if (pend.has(k) && now - pend.get(k) > 3000) pend.delete(k);
        if (pend.has(k)) {}
        else if (!(performance.now() - t0 > 5 && (old && sentPic.has(old.id) || (spread || idle) && np))) {
          const a = performance.now(), r = f(true); np++; t3dTickAdd('paint', performance.now() - a); if (T3D.lapN) { T3D.lapN.np++; T3D.lapN.paint += performance.now() - a; } pend.set(k, now);
          t3dPng(r.cv).then(png => { if (!pend.has(k)) return; pend.delete(k); pics.set(k, { p: r.p, face: r.face, png, id: 'L' + (T3D.picN = (T3D.picN || 0) + 1) });
            T3D.picSides = (T3D.picSides || 0) | (int ? 2 : 1);
            if (!pend.size || performance.now() - (T3D.picFlushAt || 0) > 150) { clearTimeout(T3D.picFlushT); flush(); } else if (!T3D.picFlushT) T3D.picFlushT = setTimeout(flush, 150); });
        }
        else later |= int ? 2 : 1;   // (painted on a later frame)
        if (!idle) wait = true; d = old; if (!d) return null;
      }
      last.set(el, d); lastK.set(kz(k), d); if (lastK.size > 400) lastK.clear();
      if (sentPic.has(d.id)) { const { png, ...rest } = d; return rest; } sentPic.add(d.id); return d; };
    const part = () => ({ items: [], decals: [], cards: [] }), ext = part(), int = part(), mine = new Set(els.concat(gls)), go = el => ec(el).int ? doInt : doExt;
    const rgba = (c, a) => { const m2 = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m2) return null; const v = m2[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [v[0] / 255, v[1] / 255, v[2] / 255, (v.length > 3 ? v[3] : 1) * a]; };
    for (const el of els) try {
      if (!go(el)) continue;
      const to = ec(el).int ? int : ext, layer = to === ext ? 'stage-ext' : undefined;
      let plane = null; for (let e = el; e && !e.classList?.contains('mroot'); e = e.parentElement) if (e.getAttribute && R.planes.has(e.getAttribute('transform'))) { plane = e; break; }
      const poly = el.tagName === 'path' && R.polys.get(el.getAttribute('d'));
      // (an upgrade pin: facing the screen at a point, as the page puts it there, translate(P(x, y, z)); seen in the X-ray only)
      // (its point: data-p3, build_www pins_with_points)
      if (el.classList.contains('upin')) { const p3 = (el.dataset.p3 || '').split(' ').map(Number); if (p3.length === 3 && p3.every(Number.isFinite) && +getComputedStyle(el).opacity > 0) {
        // (kept by what it shows: painted again for each look at the insides, a coin moved in a sale under the X-ray)
        const CK = T3D.cards || (T3D.cards = new Map()), k = ek.get(el) + '@' + p3.join(); if (CK.size > 60) CK.clear();
        let c = CK.get(k); if (!c) CK.set(k, c = t3dCard(el, p3)); to.cards.push(c); } continue; }
      // (a marked part's, __t3dMotion marks: the shell moves it with the part)
      const mk = t3dMarkOf(el, m), mark = mk ? { mark: mk } : {};
      if (plane && plane !== el) { const [O, U, V] = R.planes.get(plane.getAttribute('transform')); const d = paintOnce(ek.get(el) + t3dPicAt(plane, O, U, V), raw => t3dPaint({ el, plane, face: { O, U, V }, raw }, mine), el); if (d) to.decals.push(mk ? { ...d, ...mark } : d); }
      else if (poly) {
        const cs = getComputedStyle(el), op = +cs.opacity, pts = poly.pts, fill = rgba(cs.fill, op * (+cs.fillOpacity || 1)), stroke = rgba(cs.stroke, op * (+cs.strokeOpacity || 1));
        // (a non-scaling stroke: its width in CSS px, px, the same on the screen at any zoom, so a pinch changes nothing here)
        const w = parseFloat(cs.strokeWidth) || 0, px = cs.getPropertyValue('vector-effect') === 'non-scaling-stroke' ? 1 : undefined;
        if (fill && fill[3] > 0 && poly.closed && pts.length >= 3) to.items.push({ k: 'fill', p: pts, tri: pts.slice(2).flatMap((_, i) => [0, i + 1, i + 2]), color: fill, opaque: fill[3] >= .999, layer, ...mark });
        if (stroke && stroke[3] > 0 && w > 0) to.items.push({ k: 'line', p: poly.closed ? pts.concat([pts[0]]) : pts, color: stroke, w, px, layer, ...mark });
      }
    } catch (e) { console.warn('turn3d live', e); }
    lap('parts');
    // the glows, at full strength (their own opacity at 1 while painted), each with its number in the strengths sent
    const miss = T3D.glowMiss || (T3D.glowMiss = new WeakSet());
    gls.forEach((el, i) => { try {
      if (!gk.has(el) || !go(el)) return;
      let plane = null; for (let e = el; e && !e.classList?.contains('mroot'); e = e.parentElement) if (e.getAttribute && R.planes.has(e.getAttribute('transform'))) { plane = e; break; }
      if (!plane) return;
      const to = ec(el).int ? int : ext, [O, U, V] = R.planes.get(plane.getAttribute('transform'));
      const d = paintOnce(gk.get(el) + t3dPicAt(plane, O, U, V), raw => { const o = el.getAttribute('opacity'); el.setAttribute('opacity', '1');
        try { return t3dPaint({ el, plane, face: { O, U, V }, raw }, mine); } finally { if (o == null) el.removeAttribute('opacity'); else el.setAttribute('opacity', o); } }, el, el.getAttribute('opacity') != null && +el.getAttribute('opacity') === 0);
      if (d) { to.decals.push({ ...d, glow: i }); miss.delete(el); } else miss.add(el);
    } catch (e) { console.warn('turn3d glow', e); } });
    // (fresh: the shell forgets the pictures it kept, the page's own list of what it sent having started again; a part left
    // out: the shell keeps the one it has)
    lap('glows'); const se = doExt && JSON.stringify(ext), si = doInt && JSON.stringify(int), sendExt = doExt && se !== T3D.liveSentExt, sendInt = doInt && si !== T3D.liveSentInt;
    // (what waits to be painted: looked at again the next frame, the part sent again then)
    if (later) { T3D.liveDirty = now; if (later & 1) T3D.liveKExt = null; if (later & 2) T3D.liveKInt = null; }
    T3D.livePending = spread && wait; T3D.liveSeen = true;
    if (!sendExt && !sendInt) return;
    if (sendExt) T3D.liveSentExt = se; if (sendInt) T3D.liveSentInt = si; t3dTickAdd('sentKB', ((sendExt ? se.length : 0) + (sendInt ? si.length : 0)) / 1024);
    if (T3D.lapN) T3D.lapN.kb = ((sendExt ? se.length : 0) + (sendInt ? si.length : 0)) / 1024; lap('json');
    NATIVE.post('turn3d', { type: 'live', machine: m.id, ...(sendExt ? { ext } : {}), ...(sendInt ? { int } : {}), ...(fresh ? { fresh: true } : {}) }); lap('post');
  }
  // the 3D shapes of what the page draws anew as it works (__t3dK; handbook 2. K): each group, once the page has drawn it
  // again (T3D.kDirty, t3dWatch), made into the shell's fills and outlines from the 3D points the page drew it with
  // (__REC: P's points, its 3D polygons, the round parts' points (platform/hull3d.js), its planes), and sent; or only how
  // far it moved, when that is all (a boat along the belt). The shell draws them over its insides, pulled 2.5 nearer (a
  // ball in its dimple), under the X-ray where the page paints them (export.mjs kdom)
  const T3D_K = window.__t3dK;
  // (a group pulled less than that, by its selector: one running just behind the door, pulled through it. The oden's
  // carriage, its cup a unit behind the door, came out over the door's sign as it went along the rail, 2026-10-31. Or
  // more: the teishoku's soup, 1 to 6 down in its pot, under the pot's top, which the shell draws closed (a round part's
  // hull): a yellow arc of it showed. The bakery's bag rack (its shelf's front a unit behind the door), the bags' fronts
  // and the sandwich table's knife post: dark bars across the door left of its big board and under the 小麦 sign,
  // 2026-11-01)
  const T3D_KPULL = { oden: { '.od-cart > g': .5 }, teishoku: { '.ob-pottop': 10 }, bakery: { '.pb-bag': .5, '.pb-bagfront': .5, '.pb-table': .5 } };
  // (the camera's plane: a shift on the screen as one in 3D across it, its depth kept; ex, ey go 1 across and 1 down)
  function t3dKCam() {
    const a = ISO.D(1, 0, 0), b = ISO.D(0, 1, 0), c = ISO.D(0, 0, 1), r1 = [a[0], b[0], c[0]], r2 = [a[1], b[1], c[1]];
    const cr = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], dt = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const d = cr(r1, r2), x = cr(r2, d), y = cr(d, r1), l = Math.hypot(...d);
    return { r1, r2, ex: x.map(v => v / dt(r1, x)), ey: y.map(v => v / dt(r2, y)), dn: d.map(v => v / l) };
  }
  // the glyphs this machine's groups draw, laid out at the angle now: those alone, by id, from their sets' defs (all the
  // page's, ~1,000 elements, and every <use> of them on the street built anew for one machine's goods were 12–17 ms at
  // each stop in Chromium, 56–86 at 4× slower, 2026-10-31). The page's own glyphsNow lays out the rest when it draws again
  // (and all of them anew, the ones laid out here gone with the rest: then these again, whatever the angle)
  function t3dGlyphs(m) {
    const b = Math.round(__ND.yaw / 4), gd = document.getElementById('glyph-defs'), w = T3D.glyB;
    if (!gd || (w && w.m === m.id && w.b === b && (!w.n || w.n.isConnected))) return;
    T3D.glyB = { m: m.id, b };
    const ids = new Set(), add = el => el.querySelectorAll('use').forEach(u => { const h = u.getAttribute('href') || u.getAttribute('xlink:href') || '', id = h[0] === '#' ? h.slice(1) : '';
      if (id && !ids.has(id)) { ids.add(id); const d = document.getElementById(id); if (d) add(d); } });
    for (const g of T3D.kQ.l) add(g.el.localName === 'use' ? { querySelectorAll: () => [g.el] } : g.el);
    // (each set's glyphs by id, found once: the sets as app.js glyphDefs has them)
    const sets = [typeof GLY !== 'undefined' && GLY, typeof GLY2 !== 'undefined' && GLY2, typeof CUB !== 'undefined' && CUB, typeof RAB !== 'undefined' && RAB,
      typeof JUB !== 'undefined' && JUB, typeof ARB !== 'undefined' && ARB, typeof PKB !== 'undefined' && PKB, typeof FZB !== 'undefined' && FZB,
      typeof LKB !== 'undefined' && LKB, typeof OBB !== 'undefined' && OBB, typeof SUB !== 'undefined' && SUB, typeof ODB !== 'undefined' && ODB,
      typeof TYB !== 'undefined' && TYB, typeof KGB !== 'undefined' && KGB, typeof GCB !== 'undefined' && GCB, typeof KSB !== 'undefined' && KSB,
      typeof PBB !== 'undefined' && PBB, typeof TPB !== 'undefined' && TPB].filter(x => x && x.defs);
    if (!T3D.glyOf) { T3D.glyOf = new Map(); sets.forEach(S => (S.defs().match(/ id="[^"]+"/g) || []).forEach(a => { const id = a.slice(5, -1); if (!T3D.glyOf.has(id)) T3D.glyOf.set(id, S); })); }
    const need = new Set([...ids].map(id => T3D.glyOf.get(id)).filter(Boolean));
    for (const S of need) { const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'g'); tmp.innerHTML = S.defs();
      for (const n of [...tmp.children]) if (n.id && ids.has(n.id)) { const o = document.getElementById(n.id); if (o && o.parentNode === gd) { o.replaceWith(n); T3D.glyB.n = n; } } }
  }
  function t3dK(m = M()) {
    const sels = T3D_K[m.id], R = window.__REC;
    T3D.kSel = sels ? sels.join(',') : null;
    if (!sels) { T3D.kSeen = true; return; }
    if (!t3dFull || !R || !R.on || !T3D.ready.has(m.id) || T.active) return;
    t3dWatch();
    const now = performance.now(), doorD = t3dDoorOf(m), doorUp = !!doorD && t3dDoorA(m) > .002;
    // (the groups: looked for again once the page has built anew; each by its selector's place and its own among them)
    if (!T3D.kQ || T3D.kQ.m !== m.id || (T3D.domDirty || 0) > T3D.kQ.at || T3D.kQ.l.some(g => !g.el.isConnected)) {
      const l = [], pl = T3D_KPULL[m.id] || {}; for (const root of t3dRoots(m.id)) sels.forEach((s, si) => root.querySelectorAll(s).forEach((el, n) => l.push({ key: si + ':' + n, el, ext: !el.closest('.g-int'), pull: pl[s] })));
      T3D.kQ = { m: m.id, at: now, l, uses: l.some(g => g.el.localName === 'use' || !!g.el.querySelector('use')) }; T3D.kDirty = new Set(l.map(g => g.el));
    }
    // (the glyphs laid out at the angle now first, for a machine whose groups draw any (build_www glyphsLater: left at the
    // angle the shell took the machine at, while it holds it): the goods are read from them (t3dKUse), and at −58° the
    // frozen machine's cups were the 0° drawing turned, flat slanted discs, its boxes thin; once at the end of a turn)
    if (T3D.kQ.uses) t3dGlyphs(m);
    // (taken again (T3D.held anew: kSent null), the groups as they were: all sent anew; inside the look for them above, back
    // from the street with nothing rebuilt threw on null each frame and the shell had none, 2026-10-31)
    if (!T3D.kSent || T3D.kSent.m !== m.id) { T3D.kSent = { m: m.id, g: new Map() }; T3D.kDirty = new Set(T3D.kQ.l.map(g => g.el)); }
    // (and all looked at again when the look changes (霓虹 worn or taken off, an upgrade that swaps the shell): the page
    // only restyles them, nothing in them changes; the locker's little doors stayed in 霓虹's colours back in comic, 2026-10-31)
    const look = t3dShellId(m.id); if (T3D.kLook !== look) { T3D.kLook = look; T3D.kQ.l.forEach(g => T3D.kDirty.add(g.el)); }
    // (the door open: the door's picture has what is in its window, t3dDoorPics)
    // (nor the insides' groups while the page hides the insides, an opaque machine shut without the X-ray (app.js layers:
    // visibility): then not built anew as the machine turns, their places on the screen an angle behind, the frozen
    // machine's packs drawn outside it at −58°, 2026-10-31; shown again, sent whole)
    const hidden = g => doorUp && !!g.el.closest(doorD.hide.join(',')) || !g.ext && (g.el.closest('.g-int') || {}).style?.visibility === 'hidden';
    const S = T3D.kSent, out = {}; let any = false;
    for (const g of T3D.kQ.l) {
      const was = S.g.get(g.key), hide = hidden(g);
      if (hide) { if (was) { out[g.key] = null; S.g.delete(g.key); any = true; } continue; }
      if (was && !T3D.kDirty.has(g.el) && was.yaw === __ND.yaw) continue;
      T3D.kDirty.delete(g.el);
      let items; try { items = t3dKItems(g.el, R, g.ext); } catch (e) { console.warn('turn3d k', e); continue; }
      if (g.pull != null) for (const it of items) it.pull = g.pull;
      // (the shell keeps each group's shapes as last sent, drawn moved by a step (d): sent again only those that changed,
      // by their place in the group, at that step; one only in its colour, that alone. The step the one of the two (as it
      // was, or the first shape's move) that leaves fewer to send: the carriage and a boat along the belt move, a row
      // cooking turns a little browner each frame, the boat's flakes dance; all of them each frame were 100 KB a frame,
      // 2026-10-31)
      const same = (a, b, d) => a.k === b.k && a.pic === b.pic && a.p.length === b.p.length && a.p.every((q, k) => { const o = b.p[k]; return Math.abs(q[0] - o[0] - d[0]) + Math.abs(q[1] - o[1] - d[1]) + Math.abs(q[2] - o[2] - d[2]) < .035; });   // (each kept to .01)
      const diff = d => { const sv = {}, cv = {}; let n = 0;
        items.forEach((it, i) => { const o = was && was.base[i];
          if (!o || !same(it, o, d)) { sv[i] = d.some(Boolean) ? { ...it, p: it.p.map(q => q.map((v, j) => +(v - d[j]).toFixed(2))) } : it; n += 2; }
          else if (String(it.color) !== String(o.color) || String(it.sc) !== String(o.sc) || it.w !== o.w) { cv[i] = { color: it.color, sc: it.sc, w: it.w }; n++; } });
        return { sv, cv, n }; };
      let d = was ? was.d : [0, 0, 0], best = diff(d);
      if (was && items.length && was.base.length && items[0].k === was.base[0].k && items[0].p.length === was.base[0].p.length) {
        const d2 = [0, 1, 2].map(j => +(items[0].p[0][j] - was.base[0].p[0][j]).toFixed(2));
        if (d2.join() !== d.join()) { const b2 = diff(d2); if (b2.n < best.n) { d = d2; best = b2; } } }
      const ns = Object.keys(best.sv).length, nc = Object.keys(best.cv).length;
      if (was && was.n === items.length && !ns && !nc && d.join() === was.d.join()) { was.yaw = __ND.yaw; continue; }
      const msg = { n: items.length, ext: g.ext, ...(ns ? { s: best.sv } : {}), ...(nc ? { c: best.cv } : {}), ...(d.join() !== (was ? was.d : [0, 0, 0]).join() ? { d } : {}), ...(was ? {} : { full: true }) };
      const base = items.map((it, i) => best.sv[i] || (best.cv[i] ? { ...was.base[i], ...best.cv[i] } : was.base[i]));
      S.g.set(g.key, { base, d, yaw: __ND.yaw, n: items.length }); out[g.key] = msg; any = true;
    }
    T3D.kSeen = true;
    if (!any) return;
    NATIVE.post('turn3d', { type: 'k', machine: m.id, g: out, keys: T3D.kQ.l.filter(g => !hidden(g)).map(g => g.key) });
  }
  // the page's soft glow (index.html #soft: a blur of 1.1 under the line) as two wider lines under it, fainter: [added
  // width in the element's units, strength] (tools/turn3d/pack.py HALO, the same); a line in points: its units' points
  const T3D_HALO = [[1.28, .25], [2.97, .14]], T3D_HALO_PX = 1.3;
  // one group's shapes, in 3D (each shape of the page's under it, in its order)
  function t3dKItems(root, R, ext, chain0 = '') {
    const C = t3dKCam(), items = [], layer = ext ? 'stage-ext' : undefined;
    // (a screen point the page drew one 3D point at, in this frame: two at once (__REC.conf), neither)
    const KC = { has: k => { const c = R.conf && R.conf.get && R.conf.get(k), o = R.pts.get(k); return c !== undefined && !!o && c === o.f; } };
    const at = (x, y) => { for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const k = ISO.f(x + dx / 100) + ' ' + ISO.f(y + dy / 100), q = R.pts.get(k); if (!q || KC.has(k)) continue; const s = ISO.D(...q); if (Math.abs(s[0] - x) < .02 && Math.abs(s[1] - y) < .02) return q; } return null; };
    // a screen transform as one in 3D: a shift to a point the page drew, a scale about one, else across the camera's plane
    const lift = t => {
      const { a, b, c, d, e, f } = t;
      if (Math.abs(b) < 1e-6 && Math.abs(c) < 1e-6 && Math.abs(a - d) < 1e-6) {
        if (Math.abs(a - 1) < 1e-6) { if (Math.abs(e) < 1e-6 && Math.abs(f) < 1e-6) return null; const q = at(e, f); if (q) return { M: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], t: q.slice(), at: true }; }
        else { const q = at(e / (1 - a), f / (1 - a)); if (q) return { M: [[a, 0, 0], [0, a, 0], [0, 0, a]], t: q.map(v => (1 - a) * v) }; }
      }
      // (M = E·A·L + d dᵀ, E = [ex ey], L = [r1; r2]: on the screen as the page has it, at the same depth)
      const E = [C.ex, C.ey], AL = [[a * C.r1[0] + c * C.r2[0], a * C.r1[1] + c * C.r2[1], a * C.r1[2] + c * C.r2[2]], [b * C.r1[0] + d * C.r2[0], b * C.r1[1] + d * C.r2[1], b * C.r1[2] + d * C.r2[2]]];
      const M3 = [0, 1, 2].map(i => [0, 1, 2].map(j => E[0][i] * AL[0][j] + E[1][i] * AL[1][j] + C.dn[i] * C.dn[j]));
      return { M: M3, t: [0, 1, 2].map(i => e * C.ex[i] + f * C.ey[i]) };
    };
    const comp = (G, H) => !G ? H : !H ? G : { at: G.at, M: [0, 1, 2].map(i => [0, 1, 2].map(j => G.M[i][0] * H.M[0][j] + G.M[i][1] * H.M[1][j] + G.M[i][2] * H.M[2][j])),
      t: [0, 1, 2].map(i => G.M[i][0] * H.t[0] + G.M[i][1] * H.t[1] + G.M[i][2] * H.t[2] + G.t[i]) };
    const app = (G, p) => G ? [0, 1, 2].map(i => +(G.M[i][0] * p[0] + G.M[i][1] * p[1] + G.M[i][2] * p[2] + G.t[i]).toFixed(2)) : p.map(v => +(+v).toFixed(2));
    const mul2 = (A, B) => ({ a: A.a * B.a + A.c * B.b, b: A.b * B.a + A.d * B.b, c: A.a * B.c + A.c * B.d, d: A.b * B.c + A.d * B.d, e: A.a * B.e + A.c * B.f + A.e, f: A.b * B.e + A.d * B.f + A.f });
    const ap2 = (A, x, y) => [A.a * x + A.c * y + A.e, A.b * x + A.d * y + A.f], ID2 = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    const mOf = el => { const tl = el.transform && el.transform.baseVal; if (!tl || !tl.numberOfItems) return null; const t = tl.consolidate(); return t && t.matrix; };
    // (styles read once for each look: a station's 60 faces share a few)
    const SC = T3D.kStyle && T3D.kStyle.look === t3dShellId(M().id) ? T3D.kStyle : (T3D.kStyle = { look: t3dShellId(M().id), m: new Map() });
    if (SC.m.size > 2000) SC.m.clear();
    const rgba = (c, al) => { if (c && c.startsWith('url(')) { const g = document.getElementById(c.replace(/^url\(["']?#|["']?\)$/g, '')); const st = g ? [...g.querySelectorAll('stop')] : [];
        if (!st.length) return null; const cs = st.map(s => rgba(getComputedStyle(s).stopColor, +getComputedStyle(s).stopOpacity || 1)).filter(Boolean); if (!cs.length) return null;
        return [0, 1, 2, 3].map(j => cs.reduce((s, v) => s + v[j], 0) / cs.length * (j === 3 ? al : 1)); }
      // (a colour the page mixes (color-mix: the frozen packs' faces, shaded from their --d) is given back as color(srgb …))
      const m3 = /color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([-\d.e]+)(%?))?\)/.exec(c || '');
      if (m3) return [+m3[1], +m3[2], +m3[3], (m3[4] == null ? 1 : +m3[4] / (m3[5] ? 100 : 1)) * al];
      const m2 = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m2) return null; const v = m2[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [v[0] / 255, v[1] / 255, v[2] / 255, (v.length > 3 ? v[3] : 1) * al]; };
    const style = (el, chain) => { const k = el.localName + '|' + chain + '|' + ['class', 'style', 'fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'vector-effect', 'display'].map(a => el.getAttribute(a)).join('|');
      let s = SC.m.get(k); if (s) return s; const cs = getComputedStyle(el), op = +cs.opacity;
      // (not by its visibility: the page's machine is hidden under the shell, platform/ui.css nd-t3d-full)
      s = { hide: cs.display === 'none', fill: rgba(cs.fill, op * (+cs.fillOpacity || (cs.fillOpacity === '0' ? 0 : 1))), stroke: rgba(cs.stroke, op * (+cs.strokeOpacity || (cs.strokeOpacity === '0' ? 0 : 1))),
        w: parseFloat(cs.strokeWidth) || 0, px: cs.getPropertyValue('vector-effect') === 'non-scaling-stroke' ? 1 : undefined };
      // (a dashed line, and one with the page's soft glow (#soft): the spiral's drop sensor's beam, dashed, solid in 3D; the
      // lamp on its lift glowing, a bare thin line in 3D, the phone 2026-11-01)
      if (cs.strokeDasharray && cs.strokeDasharray !== 'none') { const d = cs.strokeDasharray.split(/[\s,]+/).map(parseFloat); if (d.length >= 2 && d[0] + d[1] > 0) s.dash = d.slice(0, 2); }
      if (/#soft["')]/.test(cs.filter || '')) s.glow = 1;
      // (a glyph's non-scaling line: as one, its width as the page gives it, in points. platform/nss.js turns them into
      // scaled ones (--ndn 1), and a glyph laid out anew (t3dGlyphs) is read before it gets to its own style: a width of 1
      // unit, the locker's eggplants' outlines twice the page's, three of them a dark band across the tray, 2026-10-31)
      if (!s.px && chain.startsWith('use:')) { const ve = el.style.getPropertyValue('vector-effect') || el.getAttribute('vector-effect') || '';
        if (cs.getPropertyValue('--ndn').trim() === '1' || ve.trim() === 'non-scaling-stroke') {
          const w = parseFloat(el.style.getPropertyValue('stroke-width') || el.getAttribute('stroke-width') || cs.getPropertyValue('--ndw')); if (w > 0) { s.w = w; s.px = 1; } } }
      SC.m.set(k, s); return s; };
    // (what a shape the page drew on the screen alone (a speck of nori, a flake) is put by: the nearest point of its group the page drew in 3D)
    const anch = [], free = [];
    // (pulled nearer than the door's glass: a group outside the door, the take-out window's, as far as the drink machine's tray)
    const pull = ext ? 14 : 2.5;
    const out = (pts, closed, st, op, sw, more = {}) => {
      if (pts.length < 2) return;
      const fill = st.fill && closed !== null && pts.length >= 3 ? st.fill.slice(0, 3).concat(st.fill[3] * op) : null, stroke = st.stroke && st.w > 0 ? st.stroke.slice(0, 3).concat(st.stroke[3] * op) : null;
      const fc = fill && fill[3] > .002 ? fill.map(v => +v.toFixed(3)) : null, sk = stroke && stroke[3] > .002 ? stroke.map(v => +v.toFixed(3)) : null, w = +(st.w * (st.px ? 1 : sw)).toFixed(3);
      // (a round part: its points, the shell making their hull, filled, and its outline where it turns away, platform/hull3d.js)
      if (more.hull) { if (fc || sk) items.push({ k: 'hull', p: pts, color: fc, sc: sk, w, px: st.px, pull, layer }); return; }
      if (fc) items.push({ k: 'fill', p: pts, tri: t3dTri(pts, more.bridged), color: fc, opaque: false, pull, layer });
      if (sk) { const ln = { k: 'line', p: closed ? pts.concat([pts[0]]) : pts, w, px: st.px, color: sk, pull, layer }, u = st.px ? T3D_HALO_PX : sw;
        if (st.dash) ln.dash = st.dash.map(v => +(v * (st.px ? 1 : sw)).toFixed(3));
        if (st.glow) for (const [dw, al] of T3D_HALO) items.push({ ...ln, w: +(w + dw * u).toFixed(3), color: sk.slice(0, 3).concat(+(sk[3] * al).toFixed(3)) });
        items.push(ln); }
    };
    // (an outline in 2D, in the element's own units: its points along, each curve in steps)
    const flat2 = el => {
      const n = el.localName, g = a => +el.getAttribute(a) || 0;
      if (n === 'rect') { const x = g('x'), y = g('y'), w = g('width'), h = g('height'); return w > 0 && h > 0 ? [{ pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], closed: true }] : []; }
      if (n === 'circle' || n === 'ellipse') { const cx = g('cx'), cy = g('cy'), rx = n === 'circle' ? g('r') : g('rx'), ry = n === 'circle' ? g('r') : g('ry'), N = 16;
        return rx > 0 && ry > 0 ? [{ pts: Array.from({ length: N }, (_, i) => [cx + rx * Math.cos(i / N * 2 * Math.PI), cy + ry * Math.sin(i / N * 2 * Math.PI)]), closed: true }] : []; }
      if (n === 'line') return [{ pts: [[g('x1'), g('y1')], [g('x2'), g('y2')]], closed: false }];
      if (n === 'polygon' || n === 'polyline') { const v = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number), pts = []; for (let i = 0; i + 1 < v.length; i += 2) pts.push([v[i], v[i + 1]]); return [{ pts, closed: n === 'polygon' }]; }
      if (n !== 'path') return [];
      const tk = (el.getAttribute('d') || '').match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [], subs = []; let i = 0, cmd = '', cur = null, x = 0, y = 0, sx = 0, sy = 0, lc = null;
      const num = () => +tk[i++], step = (fn, N) => { for (let s = 1; s <= N; s++) cur.pts.push(fn(s / N)); };
      while (i < tk.length) {
        if (/[A-Za-z]/.test(tk[i])) cmd = tk[i++];
        const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
        if (C === 'Z') { if (cur) cur.closed = true; x = sx; y = sy; cur = null; lc = null; continue; }
        if (!cur && C !== 'M') subs.push(cur = { pts: [[x, y]], closed: false });
        if (C === 'M') { x = ox + num(); y = oy + num(); sx = x; sy = y; subs.push(cur = { pts: [[x, y]], closed: false }); cmd = rel ? 'l' : 'L'; lc = null; }
        else if (C === 'L') { x = ox + num(); y = oy + num(); cur.pts.push([x, y]); lc = null; }
        else if (C === 'H') { x = ox + num(); cur.pts.push([x, y]); lc = null; }
        else if (C === 'V') { y = (rel ? y : 0) + num(); cur.pts.push([x, y]); lc = null; }
        else if (C === 'Q' || C === 'T') { const [qx, qy] = C === 'Q' ? [ox + num(), oy + num()] : lc ? [2 * x - lc[0], 2 * y - lc[1]] : [x, y], ex = ox + num(), ey = oy + num(), a = [x, y];
          step(t => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * qx + t * t * ex, (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * qy + t * t * ey], 6); lc = [qx, qy]; x = ex; y = ey; }
        else if (C === 'C' || C === 'S') { const [c1x, c1y] = C === 'C' ? [ox + num(), oy + num()] : lc ? [2 * x - lc[0], 2 * y - lc[1]] : [x, y], c2x = ox + num(), c2y = oy + num(), ex = ox + num(), ey = oy + num(), a = [x, y];
          step(t => [(1 - t) ** 3 * a[0] + 3 * (1 - t) ** 2 * t * c1x + 3 * (1 - t) * t * t * c2x + t ** 3 * ex, (1 - t) ** 3 * a[1] + 3 * (1 - t) ** 2 * t * c1y + 3 * (1 - t) * t * t * c2y + t ** 3 * ey], 8); lc = [c2x, c2y]; x = ex; y = ey; }
        else if (C === 'A') { num(); num(); num(); num(); num(); x = ox + num(); y = oy + num(); cur.pts.push([x, y]); lc = null; }
        else return subs;
      }
      return subs;
    };
    // (a path's outlines, those inside another taken as holes in it (even-odd; or wound the other way), each hole joined to
    // its outline by a seam of no width at their nearest points: one outline to cut ears from. null: no hole in it)
    const holed = (subs, rule) => {
      const cl = subs.filter(s => s.closed && s.pts.length >= 3); if (cl.length < 2) return null;
      const ar = P => P.reduce((a, p, i) => { const q = P[(i + 1) % P.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
      const inside = (P, [x, y]) => { let r = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j];
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) r = !r; } return r; };
      const par = cl.map(B => cl.find(A => A !== B && Math.abs(ar(A.pts)) > Math.abs(ar(B.pts)) && B.pts.every(p => inside(A.pts, p))));
      const holes = cl.filter((B, i) => par[i] && !par[cl.indexOf(par[i])] && (rule === 'evenodd' || ar(B.pts) * ar(par[i].pts) < 0));
      if (!holes.length) return null;
      return cl.filter(A => !holes.includes(A)).map(A => {
        let P = A.pts.slice(); const s0 = Math.sign(ar(P));
        for (const B of holes.filter(B => par[cl.indexOf(B)] === A)) {
          const H = Math.sign(ar(B.pts)) === s0 ? B.pts.slice().reverse() : B.pts.slice(); let bi = 0, bj = 0, bd = Infinity;
          P.forEach((p, i) => H.forEach((h, j) => { const d = (p[0] - h[0]) ** 2 + (p[1] - h[1]) ** 2; if (d < bd) { bd = d; bi = i; bj = j; } }));
          P = P.slice(0, bi + 1).concat(H.slice(bj), H.slice(0, bj + 1), P.slice(bi));
        }
        return { pts: P, closed: true }; });
    };
    const walk = (el, G, pl, L, op, sw, chain) => {
      for (const c of el.children) {
        const n = c.localName; if (n === 'defs' || n === 'clipPath' || n === 'mask' || n === 'title') continue;
        if (c.getAttribute('display') === 'none' || (c.style.display === 'none' && !(T3D.reveal && T3D.reveal.was.has(c)))) continue;
        const t = c.getAttribute('transform'), o = c.getAttribute('opacity'), op2 = op * (o == null ? 1 : +o);
        let G2 = G, pl2 = pl, L2 = L, sw2 = sw;
        if (t) { if (!pl && R.planes.has(t)) { pl2 = R.planes.get(t); L2 = ID2; const U = pl2[1]; sw2 = sw * Math.hypot(...U); }
          else { const mt = mOf(c); if (mt) { if (pl) { L2 = mul2(L, mt); sw2 = sw * Math.sqrt(Math.abs(mt.a * mt.d - mt.b * mt.c)); } else { G2 = comp(G, liftAt(mt)); sw2 = sw * Math.sqrt(Math.abs(mt.a * mt.d - mt.b * mt.c)); } } } }
        if (n === 'g' || n === 'svg' || n === 'a') { walk(c, G2, pl2, L2, op2, sw2, chain + '>' + ['class', 'fill', 'stroke', 'stroke-width', 'style'].map(a => c.getAttribute(a)).join(':')); continue; }
        // (words on a plane (a station's signs): a picture of them there; others, and pictures, not drawn)
        if (n === 'text' && pl2) { const pic = t3dKPic(c, pl2, L2, G2, app, ap2); if (pic) items.push({ ...pic, pull, layer }); continue; }
        // (a glyph drawn by reference, the frozen machine's packs: its own shapes, t3dKUse)
        if (n === 'use' && !pl) { const u = t3dKUse(c, t ? comp(G, liftAt(mOf(c))) : G, op2, sw2, chain, !!t); if (u) items.push(...u.map(it => ({ ...it, pull, layer }))); continue; }
        if (n === 'text' || n === 'use' || n === 'image' || n === 'tspan') continue;
        // (its own opacity is in its style)
        const st = style(c, chain); if (st.hide) continue; const op1 = op;
        // on a plane: its outline in the plane's units, then in 3D
        if (pl2) { const [O, U, V] = pl2, to3 = ([x, y]) => { const [u, v] = ap2(L2, x, y); return app(G2, [O[0] + u * U[0] + v * V[0], O[1] + u * U[1] + v * V[1], O[2] + u * U[2] + v * V[2]]); };
          const subs = flat2(c), hs = n === 'path' && st.fill && subs.length > 1 ? holed(subs, getComputedStyle(c).fillRule) : null;
          // (a shape with a hole in it, the locker's little doors around their windows: filled once with its holes cut,
          // each outline drawn as it is)
          if (hs) { hs.forEach(s => out(s.pts.map(to3), true, { ...st, stroke: null }, op1, sw2, { bridged: true })); subs.forEach(s => out(s.pts.map(to3), s.closed, { ...st, fill: null }, op1, sw2)); continue; }
          for (const s of subs) out(s.pts.map(to3), s.closed, st, op1, sw2); continue; }
        if (n === 'path') {
          const d = c.getAttribute('d'), poly = R.polys.get(d);
          if (poly && poly.pts.every(Boolean)) { const pts = poly.pts.map(p => app(G2, p)); out(pts, poly.closed, st, op1, sw2); poly.pts.forEach(q => anch.push([q, G2])); continue; }
          const h3 = R.hulls && R.hulls.get(d);
          if (h3 && h3.every(Boolean)) { h3.forEach(q => anch.push([q, G2])); out(h3.map(p => app(G2, p)), true, st, op1, sw2, { hull: true }); continue; }
          const subs = HULL3D.path(d, R.pts, KC);
          if (subs) { subs.forEach(s => { out(s.pts.map(p => app(G2, p)), s.closed, st, op1, sw2); s.pts.forEach(q => anch.push([q, G2])); }); continue; }
        }
        // (a round speck whose middle the page drew in 3D, a drop of meltwater: round it there, across the camera's plane)
        // (in a glyph's own drawing (t3dKUse), laid out about the origin: where the page drew no 3D point there, the glyph's
        // origin, across the camera's plane. The juice machine's fruit, circles: found only where a point of the machine
        // happened to fall on the origin (under the X-ray), the hopper empty in 3D with the door shut, 2026-10-31)
        if (!G2 && (n === 'circle' || n === 'ellipse')) { const cx0 = +c.getAttribute('cx') || 0, cy0 = +c.getAttribute('cy') || 0;
          const q = at(cx0, cy0) || (chain0.startsWith('use:') ? [0, 1, 2].map(i => cx0 * C.ex[i] + cy0 * C.ey[i]) : null);
          if (q) { const [sx, sy] = ISO.D(...q); for (const s of flat2(c)) out(s.pts.map(([x, y]) => app(null, [0, 1, 2].map(i => q[i] + (x - sx) * C.ex[i] + (y - sy) * C.ey[i]))), s.closed, st, op1, sw2); continue; } }
        free.push([c, G2, st, op1, sw2, items.length]);
      }
    };
    // (a screen transform with a turn in it whose shift is to a point the page drew: that point in 3D, at its depth (a pack
    // dropping, turning as it falls); else as lift has it)
    function liftAt(t) { const L0 = lift(t); if (!L0 || !t || (Math.abs(t.b) < 1e-6 && Math.abs(t.c) < 1e-6 && Math.abs(t.a - t.d) < 1e-6)) return L0;
      const q = at(t.e, t.f); return q ? { M: L0.M, t: q.slice(), at: true } : L0; }
    // a <use> of a glyph: the glyph's shapes as the page laid out its defs (app.js glyphDefs: each drawn at the origin, its
    // 3D recorded then), kept for each glyph and the colours the use gives it (--c, --d: set on the glyph while its styles
    // are read), moved to the 3D point of the use's x, y. Kept by the glyph itself, the defs laid out anew every 4° of turn
    function t3dKUse(u, G, op, sw, chain, own) {
      const href = u.getAttribute('href') || u.getAttribute('xlink:href'), def = href && href[0] === '#' && document.getElementById(href.slice(1)); if (!def) return null;
      const vars = [...u.style].filter(k => k.startsWith('--')).map(k => [k, u.style.getPropertyValue(k).trim()]), vk = vars.map(v => v.join(':')).join(';');
      const per = (T3D.kUse || (T3D.kUse = new WeakMap())).get(def) || new Map(); T3D.kUse.set(def, per);
      let base = per.get(vk);
      if (!base) {
        const was = def.getAttribute('style'); vars.forEach(([k, v]) => def.style.setProperty(k, v));
        try { base = t3dKItems(def, R, ext, 'use:' + href + ':' + vk); } finally { if (was == null) def.removeAttribute('style'); else def.setAttribute('style', was); }
        if (base.length) per.set(vk, base);
      }
      const ux = +u.getAttribute('x') || 0, uy = +u.getAttribute('y') || 0, Gu = comp(G, liftAt({ a: 1, b: 0, c: 0, d: 1, e: ux, f: uy }));
      // (what is drawn beside it on the screen alone, the frost's haze over a pack in the window, put by it)
      if (!own) { const q0 = at(ux, uy); if (q0) anch.push([q0, G]); }
      const al = c => c && op !== 1 ? c.slice(0, 3).concat(+(c[3] * op).toFixed(3)) : c;
      return base.map(it => ({ ...it, p: it.p.map(q => app(Gu, q)), ...(it.color ? { color: al(it.color) } : {}), ...(it.sc ? { sc: al(it.sc) } : {}), ...(it.w && !it.px ? { w: +(it.w * sw).toFixed(3) } : {}) }));
    }
    // (a group: its children, its own transform over all of them below; one shape alone (a holder on the cup machine's
    // turntable, its swirl): itself, its transform taken as its children's are, a plane's included)
    // (a group on a plane of its own, the locker's little doors: as one shape alone, its plane taken as its children's)
    const leaf = !['g', 'svg', 'a'].includes(root.localName) || R.planes.has(root.getAttribute('transform'));
    if (leaf) walk({ children: [root] }, null, null, null, 1, 1, chain0);
    else walk(root, null, null, null, (() => { const o = root.getAttribute('opacity'); return o == null ? 1 : +o; })(), 1, chain0);
    const rootT = !leaf && mOf(root), G0 = rootT ? lift(rootT) : null;
    // (the root's own transform, the window's boat lifted out as it is taken: over all of it)
    if (G0) for (const it of items) it.p = it.p.map(p => app(G0, p));
    // (one drawn on the screen alone (a speck of nori, a flake): by the nearest point in its own units that the page drew
    // in 3D, at its depth, across the camera's plane)
    // (in a glyph's own drawing (t3dKUse) with no such point near it: the glyph's origin, across the camera's plane, as its
    // circles are. The locker's eggplants, onions, potatoes (ellipses turned), the tomatoes' stalks: the glyph's tray on
    // planes, none of its points drawn in 3D, all of them left out in 3D, 2026-10-31)
    const gly = chain0.startsWith('use:');
    // (one in a group the page shifted to a point it drew, with no point of its own drawn in 3D: about that point, across the
    // camera's plane. The gacha's capsules, drawn on the screen about their middle and moved there (rolling down the run, in
    // the globes, in the take-out window): none of them in 3D, 2026-10-31)
    if (free.length && (anch.length || gly || free.some(x => x[1] && x[1].at))) {
      const sc = anch.map(([q, G]) => [ISO.D(...q), q, G]);
      // (each in its place in the page's order, the last first: under the boat's lid, as the page has its toppings)
      for (const [c, G2, st, op2, sw2, at] of free.slice().reverse()) { const k0 = items.length; for (const s of flat2(c)) {
        const cx = s.pts.reduce((a, p) => a + p[0], 0) / s.pts.length, cy = s.pts.reduce((a, p) => a + p[1], 0) / s.pts.length;
        let best = null, bd = 1e9; for (const [p2, q, G] of sc) { if (G !== G2) continue; const dd = (p2[0] - cx) ** 2 + (p2[1] - cy) ** 2; if (dd < bd) { bd = dd; best = [p2, q]; } }
        if (!best || bd > 400) { if (!gly && !(G2 && G2.at)) continue; best = [[0, 0], [0, 0, 0]]; }
        const [p2, q] = best, pts = s.pts.map(([x, y]) => app(comp(G0, G2), [0, 1, 2].map(i => q[i] + (x - p2[0]) * C.ex[i] + (y - p2[1]) * C.ey[i])));
        out(pts, s.closed, st, op2, sw2);
      } items.splice(at, 0, ...items.splice(k0)); }
    }
    return items;
  }
  // words on a plane in a group the page draws anew (a station's signs, ガス 中火, 生地): a picture of them in their own
  // units, painted once for what they say and how (T3D.kPics, by its id), at their place on the plane, a hair out of it;
  // the shell keeps its texture by the id (Turn3D "k"). Left out, a station's signs were missing in 3D, 2026-10-31
  function t3dKPic(el, pl, L, G, app, ap2) {
    const cs = getComputedStyle(el); if (cs.display === 'none') return null;
    const b = el.getBBox(); if (!(b.width > 0 && b.height > 0)) return null;
    const pad = .3, x0 = b.x - pad, y0 = b.y - pad, x1 = b.x + b.width + pad, y1 = b.y + b.height + pad, PX = T3D_PX;
    const key = [el.textContent, cs.fontFamily, cs.fontWeight, cs.fontSize, cs.fill, cs.stroke, cs.strokeWidth, cs.opacity, cs.textAnchor, cs.letterSpacing,
      (+el.getAttribute('x') - x0).toFixed(2), (+el.getAttribute('y') - y0).toFixed(2), (x1 - x0).toFixed(2), (y1 - y0).toFixed(2)].join('|');
    let h = 2166136261; for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
    const id = 'kp' + (h >>> 0).toString(36) + key.length.toString(36), pics = T3D.kPics || (T3D.kPics = new Map());
    let png = pics.get(id);
    if (!png) { const cv = document.createElement('canvas'); cv.width = Math.ceil((x1 - x0) * PX); cv.height = Math.ceil((y1 - y0) * PX);
      const ctx = t3dCtx(cv); ctx.setTransform(PX, 0, 0, PX, -x0 * PX, -y0 * PX); t3dDraw(ctx, el, true);
      png = cv.toDataURL('image/png').slice(22); if (pics.size > 200) pics.clear(); pics.set(id, png); }
    const [O, U, V] = pl, at = (x, y) => { const [u, v] = ap2(L, x, y); return app(G, [O[0] + u * U[0] + v * V[0], O[1] + u * U[1] + v * V[1], O[2] + u * U[2] + v * V[2]]); };
    const p = [at(x0, y0), at(x1, y0), at(x1, y1), at(x0, y1)];
    const e1 = [0, 1, 2].map(i => p[1][i] - p[0][i]), e2 = [0, 1, 2].map(i => p[3][i] - p[0][i]);
    const N = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], l = Math.hypot(...N) || 1;
    const face = N.map(v => +(v / l).toFixed(4)), lift = .06;
    return { k: 'plane', p: p.map(q => q.map((v, i) => +(v + face[i] * lift).toFixed(2))), face, depthWrite: false, pic: id, png };
  }
  // a closed outline's triangles: ears cut off it in its own plane (a fan from its first point spills out of a hollow
  // one, a ball's crescent of shine as stripes across the boat, 2026-10-31); a fan if it crosses itself
  // (seam: an outline with a hole joined in, its points along the seam twice: those not counted as inside an ear)
  // (one not flat, a band round a curved wall: the ear whose new edge is shortest in 3D. The first ear found cut chords
  // across the oden's pot from its front wall's band, over its broth and pieces, 2026-10-31)
  function t3dTri(P, seam) {
    const n = P.length, fan = () => P.slice(2).flatMap((_, i) => [0, i + 1, i + 2]); if (n <= 3) return fan();
    const N = [0, 0, 0]; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; N[0] += (a[1] - b[1]) * (a[2] + b[2]); N[1] += (a[2] - b[2]) * (a[0] + b[0]); N[2] += (a[0] - b[0]) * (a[1] + b[1]); }
    const ax = N.map(Math.abs), k = ax[0] > ax[1] && ax[0] > ax[2] ? 0 : ax[1] > ax[2] ? 1 : 2, u = (k + 1) % 3, v = (k + 2) % 3, sg = N[k] >= 0 ? 1 : -1;
    if (!ax[k]) return fan();
    const nl = Math.hypot(...N), d0 = (N[0] * P[0][0] + N[1] * P[0][1] + N[2] * P[0][2]) / nl;
    const bent = P.some(p => Math.abs((N[0] * p[0] + N[1] * p[1] + N[2] * p[2]) / nl - d0) > .05), d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    // (a bent one seen along its own mean normal, not along the nearest axis: a band round a cup, half way round it, seen
    // along an axis folds back on itself past the cup's side and came out a fan over the cup, the kakigori's, 2026-10-31;
    // a flat one the same either way)
    const cx3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], nn = N.map(x => x / nl);
    const e1 = (c => c.map(x => x / Math.hypot(...c)))(cx3(nn, Math.abs(nn[0]) < .9 ? [1, 0, 0] : [0, 1, 0])), e2 = cx3(nn, e1), dt = (p, e) => p[0] * e[0] + p[1] * e[1] + p[2] * e[2];
    const q = bent ? P.map(p => [dt(p, e1), dt(p, e2)]) : P.map(p => [p[u], p[v] * sg]), cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), same = (a, b) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
    const idx = [...Array(n).keys()], tri = []; let guard = n * n;
    while (idx.length > 3 && guard-- > 0) {
      let cut = -1, best = Infinity;
      for (let j = 0; j < idx.length; j++) {
        const i0 = idx[(j + idx.length - 1) % idx.length], i1 = idx[j], i2 = idx[(j + 1) % idx.length], A = q[i0], B = q[i1], C = q[i2];
        if (cr(A, B, C) <= 1e-9) continue;
        if (idx.some(m => m !== i0 && m !== i1 && m !== i2 && !(seam && (same(q[m], A) || same(q[m], B) || same(q[m], C))) && cr(A, B, q[m]) >= 0 && cr(B, C, q[m]) >= 0 && cr(C, A, q[m]) >= 0)) continue;
        if (!bent) { cut = j; break; }
        const e = d2(P[i0], P[i2]); if (e < best) { best = e; cut = j; }
      }
      if (cut < 0) return fan();
      tri.push(idx[(cut + idx.length - 1) % idx.length], idx[cut], idx[(cut + 1) % idx.length]); idx.splice(cut, 1);
    }
    if (idx.length === 3) tri.push(...idx);
    return tri;
  }
  // (a live picture's place, for keeping it: its face, and the camera's zoom in steps of a quarter or so (its non-scaling
  // outlines are as wide as the page has them at that size): the same after a turn, not painted again — every picture
  // painted again after each turn held the page's thread 0.3–1.2 s on the phone, 2026-10-30; how much the face is turned
  // away changes their width a hair, the picture's from the angle it was painted at)
  const t3dPicAt = (plane, O, U, V) => '@' + [O, U, V].flat().join(',') + '@' + Math.round(Math.log2(((T3D.vp || [innerWidth])[0]) / ((__ND.cam && __ND.cam.w) || 1)) * 3);
  // something drawn facing the screen at a 3D point (an upgrade pin): painted in its own units (the screen's, at the
  // camera's scale), its box round the point; the shell draws it there over the insides, as a card
  function t3dCard(el, p3) {
    const b = el.getBBox(), pad = .8, PX = 16, x0 = b.x - pad, y0 = b.y - pad, w = b.width + 2 * pad, h = b.height + 2 * pad;
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w * PX); cv.height = Math.ceil(h * PX);
    const ctx = t3dCtx(cv); ctx.setTransform(PX, 0, 0, PX, -x0 * PX, -y0 * PX);
    // (still: as it stands once its CSS animation is over, the pin's ring after its two pulses; the card is drawn once)
    for (const c of el.children) t3dDraw(ctx, c, false, true);
    return { at: p3, rect: [x0, y0, w, h], png: cv.toDataURL('image/png').slice(22) };
  }
  const T3D_PX = 12;   // canvas px per machine unit (the model's own pictures have 6)
  // the raised part an element is on, between it and its face: a group moved by ISO.pushOut(t) (export.mjs raised): t, and
  // how far that moves it in the face's units
  function t3dRaisedOf(el, plane) {
    const [pu1, pv1] = ISO.pushOut(1);
    for (let e = el.parentElement; e && e !== plane; e = e.parentElement) {
      const tm = /^translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)$/.exec((e.getAttribute('transform') || '').trim()); if (!tm) continue;
      const t = +tm[2] / pv1; if (!(t > .05) || Math.abs(+tm[1] - pu1 * t) > .02 + .01 * t) continue;
      const Q = plane.getCTM().inverse().multiply(e.parentElement.getCTM());
      return { t, d: [Q.a * +tm[1] + Q.c * +tm[2], Q.b * +tm[1] + Q.d * +tm[2]] };
    }
    return null;
  }
  // (raw: the canvas itself, not its PNG, for t3dPng to encode off the page's thread)
  function t3dPaint({ el, plane, face, lift = .06, px, raw }, mine) {
    const blur = /url\(["']?#([\w-]+)/.exec(el.getAttribute('filter') || ''), sd = blur ? +(document.querySelector(`#${blur[1]} feGaussianBlur`)?.getAttribute('stdDeviation') || 0) : 0;
    // (on a raised part (CORE.raised: a group the page moves by ISO.pushOut(t)), on its cap: t out of the face, where the
    // model has it (tools/turn3d/export.mjs raised), not where the page shows it from this angle)
    const P0 = plane.getCTM().inverse(), up = t3dRaisedOf(el, plane), fix = M => { if (up) { M.e -= up.d[0]; M.f -= up.d[1]; } return M; };
    const M = fix(P0.multiply(el.getCTM())), b = el.getBBox(), pad = .8 + 3 * sd, PX = sd ? 3 : px || T3D_PX;   // (a glow: wide and soft, fewer pixels)
    const cs = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => [M.a * x + M.c * y + M.e, M.b * x + M.d * y + M.f]);
    const x0 = Math.min(...cs.map(c => c[0])) - pad, x1 = Math.max(...cs.map(c => c[0])) + pad, y0 = Math.min(...cs.map(c => c[1])) - pad, y1 = Math.max(...cs.map(c => c[1])) + pad;
    const cv = document.createElement('canvas'); cv.width = Math.ceil((x1 - x0) * PX); cv.height = Math.ceil((y1 - y0) * PX);
    const ctx = t3dCtx(cv);
    const at = M => { ctx.setTransform(PX, 0, 0, PX, -x0 * PX, -y0 * PX); ctx.transform(M.a, M.b, M.c, M.d, M.e, M.f); };
    at(M); t3dDraw(ctx, el, true);
    // what the page paints over it on the same face, again on top (the 大容量 sticker sits under the poster's COLD! burst);
    // only what lies over the picture, the list kept until the page builds anew: the display's digits had the whole door
    // after them, drawn under each digit painted, 8–25 ms a digit at the phone's speed, 2026-10-30
    if (plane !== el) {
      const OV = T3D.over || (T3D.over = new WeakMap()); let ov = OV.get(el);
      // (looked for round the picture's box and four units more, kept while the box stays within that: a digit changed
      // keeps the list; a list made again for each digit's own width, a picture of 15–26 ms in a sale at 4× slower, 2026-10-30)
      const ins = ov && x0 >= ov.bx[0] + 1 && y0 >= ov.bx[1] + 1 && x1 <= ov.bx[2] - 1 && y1 <= ov.bx[3] - 1;
      if (!ov || ov.t < (T3D.domDirty || 0) || !ins) {
        const bx = [Math.floor(x0) - 4, Math.floor(y0) - 4, Math.ceil(x1) + 4, Math.ceil(y1) + 4], [X0, Y0, X1, Y1] = bx;
        const list = [];
        for (let s = el.nextElementSibling; s; s = s.nextElementSibling) if (!mine.has(s)) { const Ms = fix(P0.multiply(s.getCTM())); let sb; try { sb = s.getBBox(); } catch (e) { sb = null; }
          const q = sb && [[sb.x, sb.y], [sb.x + sb.width, sb.y], [sb.x, sb.y + sb.height], [sb.x + sb.width, sb.y + sb.height]].map(([x, y]) => [Ms.a * x + Ms.c * y + Ms.e, Ms.b * x + Ms.d * y + Ms.f]);
          if (!q || (Math.max(...q.map(c => c[0])) >= X0 && Math.min(...q.map(c => c[0])) <= X1 && Math.max(...q.map(c => c[1])) >= Y0 && Math.min(...q.map(c => c[1])) <= Y1)) list.push(s); }
        OV.set(el, ov = { t: performance.now(), bx, list });
      }
      for (const s of ov.list) if (!mine.has(s)) { at(fix(P0.multiply(s.getCTM()))); t3dDraw(ctx, s, true); }
    }
    const { O, U, V } = face, N = [U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]], out = lift + (up ? up.t : 0);
    const W = (u, v) => [0, 1, 2].map(i => O[i] + u * U[i] + v * V[i] + out * N[i]);   // (a hair in front of the face)
    const p = [W(x0, y0), W(x1, y0), W(x1, y1), W(x0, y1)];
    return raw ? { p, face: N, cv } : { p, face: N, png: cv.toDataURL('image/png').slice(22) };
  }
  // (the pictures' canvases kept in the page's own memory, drawn there by the CPU: each one's pixels read for its PNG, and
  // a canvas the GPU draws had the page wait for the GPU's side to hand them back (WebKit's GPU process), each picture)
  const t3dCtx = cv => cv.getContext('2d', { willReadFrequently: true });
  // a canvas's PNG (base64), encoded off the page's thread where it can: a worker's OffscreenCanvas, given the pixels as a
  // bitmap; toDataURL did it on the page's thread, ~200 ms for a door-sized picture at 4× slower, the rain stopped meanwhile
  // (three workers, taking turns: the ~20 pictures coming to the machine one after another were ~0.5 s late at 4× slower)
  const t3dPng = (() => { let ws = [], n = 0; const wait = new Map();
    try { if (window.OffscreenCanvas && window.createImageBitmap && window.Worker) {
      const src = URL.createObjectURL(new Blob([`onmessage = async e => { const { id, bm } = e.data; try {
        const c = new OffscreenCanvas(bm.width, bm.height); c.getContext('2d').drawImage(bm, 0, 0); bm.close();
        const u = new Uint8Array(await (await c.convertToBlob({ type: e.data.type, quality: e.data.q })).arrayBuffer()); let s = '';
        for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
        postMessage({ id, png: btoa(s) }); } catch (x) { postMessage({ id, err: String(x) }); } };`], { type: 'text/javascript' }));
      for (let i = 0; i < 3; i++) { const w = new Worker(src); ws.push(w);
        w.onmessage = e => { const f = wait.get(e.data.id); wait.delete(e.data.id); if (f) f(e.data.png || null); };
        w.onerror = () => { ws = ws.filter(x => x !== w); for (const f of wait.values()) f(null); wait.clear(); }; }
    } } catch (e) { ws = []; }
    return async (cv, type = 'image/png', q) => {
      if (ws.length) try { const a = performance.now(), bp = createImageBitmap(cv); if (T3D.lapN) T3D.lapN.bmp += performance.now() - a; t3dTickAdd('bitmap', performance.now() - a); const bm = await bp, id = ++n, w = ws[id % ws.length]; const png = await new Promise(r => { wait.set(id, r); w.postMessage({ id, bm, type, q }, [bm]); }); if (png) return png; } catch (e) {}
      return cv.toDataURL(type, q).split(',')[1];
    };
  })();
  // an SVG element drawn on a canvas: shapes, paths and text with their computed fills and strokes (no filters, no <use>)
  function t3dDraw(ctx, n, root, still = false) {
    const tag = n.tagName, cs = getComputedStyle(n);
    if (tag === 'use' && cs.display !== 'none') { t3dUse(ctx, n, still); return; }
    if (cs.display === 'none' || /^(defs|title|clipPath|mask|filter|use|image)$/.test(tag)) return;
    ctx.save();
    const t = !root && n.transform && n.transform.baseVal.consolidate(); if (t) { const m = t.matrix; ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f); }
    ctx.globalAlpha *= still && cs.animationName !== 'none' ? 1 : +cs.opacity;
    // (one not seen, left out: the cup's tile glow, opacity 0, its blur drawn as a shadow, came out whole on WebKit, the
    // six menu tiles a lit amber on the simulator, 2026-10-31)
    if (!ctx.globalAlpha) { ctx.restore(); return; }
    const num = a => parseFloat(n.getAttribute(a)) || 0;
    let path = null;
    if (tag === 'g' || tag === 'svg') for (const c of n.children) t3dDraw(ctx, c, false, still);
    else if (tag === 'rect') { const w = num('width'), h = num('height'), r = Math.min(n.hasAttribute('rx') ? num('rx') : num('ry'), w / 2, h / 2); path = new Path2D();
      if (r > 0 && path.roundRect) path.roundRect(num('x'), num('y'), w, h, r); else path.rect(num('x'), num('y'), w, h); }
    else if (tag === 'circle') { path = new Path2D(); path.arc(num('cx'), num('cy'), num('r'), 0, Math.PI * 2); }
    else if (tag === 'ellipse') { path = new Path2D(); path.ellipse(num('cx'), num('cy'), num('rx'), num('ry'), 0, 0, Math.PI * 2); }
    else if (tag === 'path') path = new Path2D(n.getAttribute('d') || '');
    else if (tag === 'line') { path = new Path2D(); path.moveTo(num('x1'), num('y1')); path.lineTo(num('x2'), num('y2')); }
    else if (tag === 'polygon' || tag === 'polyline') { const q = (n.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number); path = new Path2D();
      for (let i = 0; i + 1 < q.length; i += 2) i ? path.lineTo(q[i], q[i + 1]) : path.moveTo(q[i], q[i + 1]); if (tag === 'polygon') path.closePath(); }
    if (path) t3dInk(ctx, n, cs, 1, () => ctx.fill(path, cs.fillRule === 'evenodd' ? 'evenodd' : 'nonzero'), () => ctx.stroke(path));
    else if (tag === 'text') {
      // (drawn at 32 px and scaled down: the words are a few units tall)
      const fs = parseFloat(cs.fontSize) || 16, K = 32 / fs, txt = n.textContent;
      ctx.translate(num('x'), num('y')); ctx.scale(1 / K, 1 / K);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} 32px ${cs.fontFamily}`;
      ctx.textAlign = { middle: 'center', end: 'right' }[cs.textAnchor] || 'left';
      if ('letterSpacing' in ctx) ctx.letterSpacing = (parseFloat(cs.letterSpacing) || 0) * K + 'px';
      t3dInk(ctx, n, cs, K, () => ctx.fillText(txt, 0, 0), () => ctx.strokeText(txt, 0, 0));
    }
    ctx.restore();
  }
  // a <use>: what it shows, a copy in a group of the use's class and style (its --c, --cap) beside the machine in its layer,
  // outside its .mroot (t3dWatch looks no further), its styles worked out there, drawn at the use's x, y (the flat
  // display's samples on the door, Turn3D "door")
  // (all of a picture's at once, t3dUses: one in turn, each put in and its styles worked out, the page's whole layer again)
  function t3dUses(el, f) {
    const us = [...el.querySelectorAll('use')], L = el.ownerSVGElement; if (!us.length || !L) return f();
    const box = document.createElementNS('http://www.w3.org/2000/svg', 'g'), map = T3D.useCopy = new Map();
    for (const n of us) { const ref = document.querySelector(n.getAttribute('href') || n.getAttribute('xlink:href') || '#'); if (!ref) continue;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); for (const a of ['class', 'style']) if (n.hasAttribute(a)) g.setAttribute(a, n.getAttribute(a));
      for (const c of ref.children) g.appendChild(c.cloneNode(true)); box.appendChild(g); map.set(n, g); }
    L.appendChild(box);
    try { return f(); } finally { box.remove(); T3D.useCopy = null; }
  }
  function t3dUse(ctx, n, still) {
    const g = T3D.useCopy && T3D.useCopy.get(n); if (!g) return;
    ctx.save(); const t = n.transform && n.transform.baseVal.consolidate(); if (t) { const m = t.matrix; ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f); }
    ctx.translate(parseFloat(n.getAttribute('x')) || 0, parseFloat(n.getAttribute('y')) || 0); ctx.globalAlpha *= +getComputedStyle(n).opacity;
    for (const c of g.children) t3dDraw(ctx, c, false, still); ctx.restore();
  }
  function t3dInk(ctx, n, cs, k, fill, stroke) {
    const ink = v => v && v !== 'none' && !v.startsWith('url') ? v : null, f = ink(cs.fill), s = ink(cs.stroke), a = ctx.globalAlpha;
    let w = parseFloat(cs.strokeWidth) || 0;
    const nss = s && w && cs.getPropertyValue('vector-effect') === 'non-scaling-stroke';
    // (a line platform/nss.js draws as a non-scaling one (--ndn 1): while the shell holds the machine, the machine keeps the
    // zoom it had (__ndNSS.hold), its width here scaled to the layer's zoom now, as the page would draw it)
    if (s && w && !nss && window.__ndNSS && cs.getPropertyValue('--ndn').trim() === '1') { const L = n.ownerSVGElement, now = L && __ndNSS.nss(L), was = parseFloat(cs.getPropertyValue('--nss'));
      if (now && was) w *= now / was; }
    if (nss) { const m = n.getScreenCTM(); w /= Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1; }
    const F = () => { if (!f) return; ctx.fillStyle = f; ctx.globalAlpha = a * +cs.fillOpacity; fill(); };
    const S = () => { if (!s || !w) return; ctx.strokeStyle = s; ctx.globalAlpha = a * +cs.strokeOpacity; ctx.lineWidth = w * k;
      ctx.lineCap = cs.strokeLinecap || 'butt'; ctx.lineJoin = cs.strokeLinejoin || 'miter'; stroke(); };
    // a blurred glow (filter="url(#bloom)", a Gaussian blur in the element's units): the shape's shadow alone, thrown into
    // the picture from off it (canvas filters are not in every WebKit; a shadow's blur is σ × 2, in canvas pixels)
    const blur = /url\(["']?#([\w-]+)/.exec(n.getAttribute('filter') || ''), g = blur && document.querySelector(`#${blur[1]} feGaussianBlur`);
    if (g && f) { const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b), BIG = 1e4;
      ctx.save(); ctx.setTransform(m.a, m.b, m.c, m.d, m.e - BIG, m.f); ctx.shadowOffsetX = BIG; ctx.shadowBlur = 2 * (+g.getAttribute('stdDeviation') || 0) * sc;
      ctx.shadowColor = f; ctx.fillStyle = f; ctx.globalAlpha = a * +cs.fillOpacity; fill(); ctx.restore(); ctx.globalAlpha = a; return; }
    if (/^stroke/.test(cs.paintOrder || '')) { S(); F(); } else { F(); S(); }
    ctx.globalAlpha = a;
  }
  // two fingers (build_www machine_touch): the shell draws the pinch, the camera worked out from its own reading of the
  // fingers as the game does (clamp() too, __ND.clampInfo); the page only keeps the camera and sets its viewBox once, at
  // the end, under the shell's drawing (the owner's phone, 2026-10-30: a pinch at 36–46 fps)
  T.pinch = (type, p) => {
    if (type === 'start') {
      if (T.active || !t3dCan()) return false;
      t3dTakeNow();   // (as a turn: a pinch begun before the page went see-through, the machine gone)
      t3dDecals(); t3dGoods(M(), __ND.xr > .002);
      const b = t3dBox(), i = __ND.clampInfo(), r = c => [c.x, c.y, c.w, c.h];
      T.active = true; T.mode = 'pinch'; T3D.pinchCam = r(p.cam).join(); T3D.holdKey = '';
      if (__ND.xr > .002) device.classList.add('nd-xturn');
      NATIVE.post('turn3d', { type: 'pinch', machine: M().id, yaw: __ND.yaw, box: [b.x, b.y, b.W, i.H], cam: r(p.cam), mx: p.mx, my: p.my,
        base: r(i.base), bounds: [i.B.x0, i.B.x1, i.B.y0, i.B.y1], insets: i.insets });
      device.classList.add('nd-t3d');
      (T.lastModes = T.lastModes || []).push('pinch'); if (T.lastModes.length > 20) T.lastModes.shift();
      return true;
    }
    if (type === 'end' && T.mode === 'pinch') {
      // (the shell shows the page's own last camera; the page's machine comes back at it, and once that is painted the
      // shell's view goes)
      NATIVE.post('turn3d', { type: 'pinchEnd', cam: [p.x, p.y, p.w, p.h] });
      device.classList.remove('nd-t3d', 'nd-xturn');
      // (the page's machine under its new camera, laid out a part a frame: t3dReveal; not when the new zoom went on #cam's
      // transform (T.camLater), nothing laid out again then: hidden and shown again a part a frame, it was ~0.2 s of
      // style and layout at Chromium's 4× for nothing)
      if ([p.x, p.y, p.w, p.h].join() !== T3D.pinchCam && !T.camLater()) t3dReveal();
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => { if (T.mode !== 'pinch') return; NATIVE.post('turn3d', { type: 'done' }); T.active = false; T.mode = null; })));
    }
  };

  // a turn begun while the shell already draws the machine under this page but the page has not gone see-through yet (a
  // machine just come, its live parts, cats and background still being painted, t3dHoldTick see: 0.2–2.6 s on the phone):
  // see-through at once, no fade. The page's machine goes for the turn (ui.css nd-t3d) and the shell's was under the page's
  // opaque background: the machine was gone till the finger lifted (the owner's phone, 5a6d9cd, 2026-10-31); and taken over
  // in the middle of the turn, it would have jumped. What is still being painted comes as it is done
  function t3dTakeNow() {
    if (!t3dFull || !T3D.under || device.classList.contains('nd-t3d-full')) return;
    device.classList.add('nd-t3d-full'); device.classList.remove('nd-t3d-fade', 'nd-t3d-out'); document.body.classList.add('nd-t3d-bg');
    if (window.__ndNSS) __ndNSS.hold(true);
  }
  let lastYaw = 0, lastDir = 0, tried = 0;   // (the last direction that moved: a finger that rests or moves up and down keeps it)
  GAME.onTurn(ev => {
    // (a finger down on a fling still gliding starts the turn anew from there: the shell's, for its finger; a turn in
    // pictures goes on as it was)
    if (ev.type === 'start' && T.active && T.mode !== 'native') return;
    if (ev.type === 'start' && t3dCan()) {
      // (the hold said again once it ends, whatever the angle it ends at: the shell's view is the table's till then)
      T.active = true; T.mode = 'native'; T.look = lookKey(); T3D.holdKey = '';
      t3dTakeNow();
      t3dDecals(); t3dGoods(M(), __ND.xr > .002);
      NATIVE.post('turn3d', { type: 'start', machine: M().id, yaw: ev.yaw, yaw0: T3D.yaw0, x0: T3D.x0, sens: __ND.SENS, travel: __ND.TRAVEL || 0, limL: LIM_L, limR: LIM_R, cams: t3dCams() });
      device.classList.add('nd-t3d');
      // (under the X-ray, the name tags and the scan line out while it turns, as a turn in pictures has them: they are the
      // page's, drawn where the angle was)
      if (__ND.xr > .002) device.classList.add('nd-xturn');
      (T.lastModes = T.lastModes || []).push('native'); if (T.lastModes.length > 20) T.lastModes.shift();
      return;
    }
    if (T.mode === 'native') {
      if (ev.type === 'move' || ev.type === 'end' || ev.type === 'up') NATIVE.post('turn3d', { type: ev.type, yaw: ev.yaw });
      if (ev.type === 'move' && resetBtn) resetBtn.hidden = Math.abs(ev.yaw) < .5;
      // the page's machine back at 'end', not 'done': the game draws the final angle right after this (setYaw, the same
      // task), so the one paint it costs (~200 ms on the phone) is made with the machine shown, under the shell's
      // drawing of that same angle. Shown only at 'done', the paint came after the shell's view had gone: the machine
      // flashed out, and its outside (stickers, signs: #xr-ext, a layer of its own) came back a moment after the rest
      // (the owner's phone, 2026-10-30). 'done' comes two frames after that paint; one frame more, then the shell's goes
      // (the machine the game builds at that angle right after this, given to the browser a part a frame: t3dReveal)
      if (ev.type === 'end') { device.classList.remove('nd-t3d', 'nd-xturn'); const y0 = __ND.yaw; queueMicrotask(() => { if (__ND.yaw !== y0) t3dReveal(); }); }
      if (ev.type === 'done') {
        device.classList.remove('nd-t3d', 'nd-xturn'); T.active = false; T.mode = null;
        requestAnimationFrame(() => { if (T.mode !== 'native') NATIVE.post('turn3d', { type: 'done' }); });
      }
      return;
    }
    if (ev.type === 'start') {
      T.active = true; T.look = lookKey(); cams = new Map(); camsFrom = null;
      const p = pick(ev.yaw), s = p.s;
      T.set = p.key; T.map = p.map; T.mode = p.ok ? 'pictures' : 'live';
      lastYaw = ev.yaw; lastDir = 0; tried = performance.now(); keep(s, ev.yaw);
      // (under the X-ray: the name tags and the scan line out while it turns, platform.css)
      if (T.mode === 'pictures') { if (__ND.xr > .002) device.classList.add('nd-xturn'); showPictures(ev.yaw); }
      else {
        dropPictures();   // (no picture over a turn the game draws: the one of a turn before could stay, platform 2026-10-23)
        // (the game draws the turn itself, lighter, platform.css; not under the X-ray, which is there to show the
        // insides: they went blank while it turned, the owner 2026-10-23)
        // (and in full 3D, where nothing is drawn ahead: its turns before the 3D has the machine, 2026-11-01)
        if ((window.__ndTurnAhead || t3dFull) && __ND.xr <= .002) device.classList.add('nd-lod');
      }
      (T.lastModes = T.lastModes || []).push(T.map && T.mode === 'pictures' ? 'zoomed' : T.mode); if (T.lastModes.length > 20) T.lastModes.shift();
    } else if (ev.type === 'move') {
      want(ev.yaw);
      if (T.mode === 'pictures') { lastDir = Math.sign(ev.yaw - lastYaw) || lastDir; keep(sets.get(T.set), ev.yaw, lastDir); lastYaw = ev.yaw; }
      // (turnAhead: a turn the game began drawing itself goes on in pictures as soon as they are there around the finger
      // — on the phone a drag 0.7 s after a machine came up was drawn by the game to its end, 250–360 ms a step, warm.
      // At the home view only: zoomed in, the game's camera has moved with the turn)
      else if (T.mode === 'live' && window.__ndTurnAhead && !zoomed() && performance.now() - tried > 100) {
        tried = performance.now(); const p = pick(ev.yaw); keep(p.s, ev.yaw);
        if (p.ok && !p.map) {
          T.set = p.key; T.mode = 'pictures'; device.classList.remove('nd-lod'); if (__ND.xr > .002) device.classList.add('nd-xturn');
          lastYaw = ev.yaw; lastDir = 0; cancelAnimationFrame(raf); raf = 0; showPictures(ev.yaw); T.lastModes[T.lastModes.length - 1] = 'live>pictures';
        }
      }
      // (what the game's own camera step would also do: the reset button shows once the machine is turned)
      if (T.mode === 'pictures' && resetBtn) resetBtn.hidden = !zoomed() && Math.abs(ev.yaw) < .5;
    } else if (ev.type === 'end') {
      // the game now draws the final angle itself (under the canvas); the canvas shows the same angle meanwhile
      if (T.mode === 'pictures') { cancelAnimationFrame(raf); raf = 0; draw(ev.yaw); }
    } else if (ev.type === 'done') {
      if (T.mode === 'pictures') hidePictures();
      device.classList.remove('nd-lod', 'nd-xturn');
      keep(sets.get(T.set), __ND.yaw);
      T.active = false; T.mode = null; T.map = null;
    }
  });
})();

/* 性能模式 (the user's choice, 2026-10-20): a row in the settings under 省电模式, the game's own markup and switch, so
   it looks as if it had always been there. On, every sale redraws the turning pictures at once (more battery); off
   (the default), sales are saved up. Kept in the game's settings prefs (nandemo-settings, P.perf: the game's own click
   handler toggles and saves it, as it does every data-k switch). It and 省电模式 exclude each other: turning one on
   turns the other off. Only where the turning pictures exist (devices with too little memory never draw them). */
(() => {
  if (!window.TURN || typeof SETTINGS === 'undefined' || !window.__ndTurnPictures) return;
  const body = document.getElementById('set-body'), panel = document.getElementById('settings');
  if (!body || !panel) return;
  const TXT = {
    zh: ['性能模式', '卖出后马上更新转镜头画面，更耗电'],
    'zh-Hant': ['效能模式', '賣出後馬上更新轉鏡頭畫面，比較耗電'],
    en: ['Performance mode', 'Updates the turning view right after each sale; uses more battery'],
    ja: ['パフォーマンスモード', '売れるたびに回転の表示をすぐ更新します（電池を多く使います）'],
  };
  const add = () => {
    const low = body.querySelector('[data-k="low"]'), row = low && low.closest('.set-row');
    if (!row || body.querySelector('[data-k="perf"]')) return;
    const on = !!SETTINGS.prefs.perf, [label, sub] = TXT[I18N.code] || TXT.zh;
    row.insertAdjacentHTML('afterend', `<div class="set-row"><span>${label}<small>${sub}</small></span>`
      + `<button type="button" class="sh-switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" data-k="perf"><i></i></button></div>`);
  };
  new MutationObserver(add).observe(body, { childList: true });
  add();
  // turning one on turns the other off, before the game's own handler flips and saves the one tapped
  panel.addEventListener('click', e => {
    const b = e.target.closest('button[data-k]'); if (!b || b.disabled) return;
    const P = SETTINGS.prefs;
    if (b.dataset.k === 'perf' && !P.perf) P.low = false;
    if (b.dataset.k === 'low' && !P.low) P.perf = false;
  }, true);
})();

