/* The album's data: one line about every product, the series (sets) that group them, and the decorations a finished
   series gives. Decorations are a small wardrobe — cat gear (neck, head, feet) and machine stickers — built so that
   items from other sources (shop, events) can join later: every item records its source; nothing changes numbers. */
const COLLECT = (() => {
  // one line for every product's album card
  const FLAVOR = {
    drink: { sanpin: T`茉莉花香，冲绳人的日常。`, guarana: T`北海道才喝得到的汽水，像可乐又不像。`, hakuto: T`冈山的白桃，软到要用双手捧。`, ringo: T`信州的苹果园装进了瓶子。`, gyokuro: T`宇治的玉露，凉着喝也有一点甜。`,
      water: T`ミズイロ的招牌。喝起来像下过雨的早晨。`, melon: T`绿得很假，甜得很真。`, peach: T`桃子味的下午三点。`, coffee: T`罐装的清醒。冬天握在手里刚刚好。`,
      corn: T`最后几粒玉米总是倒不出来，这是传统。`, matcha: T`苦一点点，凉很多。`, ramune: T`弹珠卡住的那一下，是夏天的声音。`, shake: T`小时候的味道，罐子上的牛笑得很开心。`,
      hojicha: T`烘过的茶香，适合下班路上。`, nightsoda: T`瓶子里有一小片星空，摇一摇会闪。`, peachland: T`据说喝完会想去一个从没去过的地方。`, cocoa: T`黑豆和可可，猫闻到也会抬头。`,
      goldcorn: T`这一罐的玉米粒，每一粒都倒得出来。`, oden: T`罐子里有萝卜、鸡蛋、魔芋和竹轮。2005 年一部电视剧之后红遍全国。`, fuji: T`从富士山上一路流下来，花了七十年。`, meteor: T`一口下去，来得及把愿望说三遍。`, moon: T`月亮上运下来的水。运费比水贵。` },
    spiral: { consomme: T`最普通的一包，也是最常被买的一包。`, chili: T`辣得刚好，适合加班。`, nori: T`吃完手指会变成海苔味。`, ume: T`酸到眯眼的薯片。`, truffle: T`松露味，连包装袋都比别人高级。`,
      wasabi: T`第一口没事，第二口上头。`, goldchips: T`每片都贴了金箔。吃下去的都是钱。`, milkchoco: T`掰成十二格，永远多出一格。`, strawcandy: T`糖纸会发出很好听的声音。`,
      mintchoco: T`喜欢的人很喜欢，不喜欢的人很不喜欢。`, lemoncandy: T`含着能清醒十分钟。`, namachoco: T`入口即化，所以住在最凉的那一层。`, konpeito: T`小小的星星，一颗一颗数着吃。`,
      rubychoco: T`天生粉红色的巧克力，不是染的。`, shoyu: T`深夜三分钟的幸福。`, curry: T`汤底会让整个房间都知道你在吃什么。`, salmon: T`饭团人气第一（自称）。`,
      umeboshi: T`梅干在正中间，咬到之前都是期待。`, tonkotsu: T`浓到筷子能立起来。`, ikura: T`一口下去会爆开的红宝石。`, lobster: T`泡面界的大人物，盒子上有一只龙虾的照片。`,
      duck: T`洗澡的时候需要一个朋友。`, umbrella: T`下雨的晚上，这台机器最忙。`, battery: T`遥控器没电的时候，它是英雄。`, cassette: T`里面录了什么，买了才知道。`,
      vhs2: T`倒带要自己来。`, blueduck: T`苏打色的鸭子，夏季限定（其实一直都有）。`, goldduck: T`浮不起来，因为太贵了。`, water2: T`和饮料机里那瓶是亲戚。`,
      peachbtl: T`小瓶的，刚好放进口袋。`, maneki: T`左手招人，右手招财。这只两只手都举着。`, vhs: T`一部不知道名字的老电影。`, ramunebtl: T`零食机里也有夏天。`,
      goldneko: T`据说摸一下，今天中奖会多一点。`, cookietin: T`蓝色的铁盒，吃完了拿来装纽扣。`, omiyage: T`包着熨斗纸，送谁都不会出错。`,
      plush: T`和街上的猫长得有点像。`, melonbox: T`躺在木盒里，网纹一丝不乱，一个就要好几千。` },
    cup: { blend: T`ヨルカフェ的基本款，深夜的标准答案。`, latte: T`奶多一点，夜就短一点。`, cocoa: T`热的，甜的，适合讲悄悄话。`, matcha: T`绿色的安心感。`,
      icecoffee: T`冰块碰到杯壁的声音很好听。`, lemontea: T`酸酸的，让人想起暑假。`, caramel: T`焦糖在杯底等你。`, kokuto: T`黑糖的甜是慢慢来的。`,
      hojicha: T`饮料机那边也有一罐同名的，它们不认识。`, nightblend: T`只在晚上出现在菜单上（其实一直都在）。`, goldmatcha: T`上面撒了金粉，喝的时候小心胡子。`,
      mblend: T`豆子现磨，香味先从取杯口飘出来。`, mlatte: T`现磨的咖啡配热牛奶，比粉冲的厚一点。`, mocha: T`咖啡、可可和牛奶，三样在小碗里一起转。` },
    ramen: { kake: T`什么都不加的一碗，汤是这台机器的底气。`, tanuki: T`炸面衣泡软之前和之后，是两种好吃。`, shoyu: T`鸣门卷是这碗的门面。`, kitsune: T`甜甜的油豆腐，据说狐狸爱吃。`,
      tenpura: T`中奖的时候会多一只虾天，这台机器就是这么大方。`, miso: T`浓的，冬天的夜班专用。`, tsukimi: T`蛋黄是月亮，葱是芒草。`,
      kamo: T`鸭肉和葱，一起在汤里游泳。`, tonkotsu: T`白到发亮的汤，熬了很久。`, nabeyaki: T`居然连锅一起出来。小心烫。`, iseebi: T`一只龙虾躺在碗里，看起来比你还累。` },
    juice: { mikan: T`被炉边的味道，挤成了一杯。`, orange: T`四个橙子一杯，看它们滚下来就是最好的广告。`, lemon: T`酸的那一下之后，蜂蜜慢慢追上来。`, apple: T`苹果也想被压一压。`,
      grapefruit: T`有一点点苦，大人的早餐。`, iyokan: T`爱媛来的，皮很好剥（不过这里不用你剥）。`, yuzu: T`香气比味道先到。`,
      dekopon: T`头上鼓起一个小包，那是它的骄傲。`, kanpei: T`甜到让人以为加了糖，其实没有。`, madonna: T`果冻一样的果肉，压的时候机器都放轻了手。`, ougon: T`金色的小柑橘，香得整条街都知道。` },
    auto: { ham: T`铝箔一打开，热气先跑出来。`, cheese: T`芝士从边上流出来的那一刻最好吃。`, tamago: T`鸡蛋沙拉被烤得温温的，像早上。`, pizza: T`番茄酱和芝士，压扁了也是披萨。`,
      mentai: T`明太子的咸和芝士的香，夜班的奖励。`, burger: T`没有生菜，因为要连盒一起进微波炉。`, cheeseb: T`盒子烫得拿不住，芝士刚好化开。`, teriyaki: T`甜甜的酱汁会粘在手指上。`,
      goldb: T`金色的盒子，打开还是普通的汉堡——但好吃一倍。`, curry: T`刀片划开料理包的那一下，整台机器都香了。`, katsu: T`炸猪排放在咖喱上，不会软得太快。`, wagyu: T`用这么好的牛肉做自贩机咖喱，有点奢侈。` },
    digital: { cable: T`充电线永远不够长，也永远找不到。`, charger: T`出差包里的那个总是忘带。`, sdcard: T`全新的，里面还什么都没有。`, junk: T`200 日元一袋，打开前谁也不知道里面有什么。`,
      keycap: T`只有一个键，也算一把键盘。`, earbuds: T`戴上就听不见雨声了。`, mouse: T`滚轮的手感很好，深夜写报告的好伙伴。`, battery: T`路人最常买的东西，第二常买的是充电线。`,
      board: T`小小一块，能让一盏灯眨眼，也能让一台机器说话。`, handheld: T`只能玩一个游戏，但是那个游戏很好玩。`, mystery: T`包装上什么都没写，按下按钮会发光。` },
    frozen: { vanilla: T`最简单的那一个，也是卖得最好的那一个。`, matcha: T`苦一点点，刚好配深夜。`, choco: T`冻得硬邦邦，等两分钟最好吃。`, strawberry: T`里面有真的草莓块，咬到会很开心。`,
      gyoza: T`自贩机的饺子，和店里的是同一个师傅包的。`, yakitori: T`微波炉转两分钟，就是居酒屋的味道。`, karaage: T`冻着的时候也看得出是金黄色的。`, chahan: T`粒粒分明，冻着也不粘在一起。`,
      ramenkit: T`和ゆげ屋的是亲戚，汤包要另外化开。`, tsukemen: T`面和汤分开装，蘸着吃。`, pizza: T`整个塞进烤箱，十分钟后就是派对。`, cake: T`装在瓶子里，掉下去会碎——所以要升降台。`,
      sashimi: T`超低温冻着，化开以后和刚切的一样。`, crab: T`这台机器里最贵的东西，一整只的腿。` },
    locker: { tomato: T`早上摘的，还带着一点太阳的温度。`, cucumber: T`刺还扎手，说明很新鲜。`, eggplant: T`紫得发亮，烤一下就很好吃。`, potato: T`袋子上还沾着一点土。`, onion: T`切的时候会哭，但是很甜。`,
      carrot: T`叶子没剪掉，是农家的诚意。`, corn: T`最好今天就煮掉，甜度一过夜就跑了。`, daikon: T`一根就占满一格。`, shiitake: T`长在原木上的，香味不一样。`,
      egg: T`鸡舍就在小屋后面。`, strawberry: T`冷藏格里最先卖光的那一格。`, redegg: T`壳是红褐色的，蛋黄更浓。`, blueberry: T`一颗一颗摘的，很费工夫。`,
      hakusai: T`冬天的锅就靠它了。`, watermelon: T`整颗的，要两只手才抱得动。`, rice: T`今年的新米，袋子上写着农家的名字。`, melon: T`一根藤只留一个果，所以这么贵。`, matsutake: T`放在竹篮里，整条街都闻得到。` },
    teishoku: { natto: T`早上六点的第一份，配的是昨晚的味噌汤（今天新煮的）。`, hiyayakko: T`夏天的晚上，一块凉豆腐就够了。`, tamagoyaki: T`甜口的，机械臂卷了三圈。`, shogayaki: T`生姜的味道从取餐窗飘到了街上。`,
      sabamiso: T`鱼刺已经挑干净了，机器很细心。`, nikujaga: T`每个家庭的味道都不一样，这台机器的是偏甜的那种。`, hamburg: T`刀切下去会流出肉汁。`, yakizakana: T`皮烤得脆脆的，留到最后吃。`,
      karaage: T`现炸的，咬下去会烫嘴。`, ebifry: T`两只虾，尾巴也能吃。`, tonkatsu: T`切成五块，正中间那块最厚。`, tempura: T`要先蘸天汁，还是先撒盐？`,
      sukiyaki: T`一个人的小锅，生鸡蛋另外装。`, wagyu: T`铁板端出来还在滋滋响。`, unagi: T`漆盒盖子一打开，蒲烧的香味先冲出来。` },
    kissa: { blend: T`店里自家拼配的豆子，苦和酸刚好打平。`, american: T`浅一点、淡一点，可以一口一口慢慢喝。`, iced: T`冰块叮当响，杯壁上全是水珠。`, aulait: T`一半咖啡一半热牛奶，用大一号的杯子。`,
      wiener: T`奶油堆得高高的，先别搅，从奶油底下喝。`, mocha: T`带一点果香的摩卡，杯子是金色的边。`, float: T`冰咖啡上漂一球香草冰淇淋，慢慢化开。`, melonsoda: T`绿得发亮的哈密瓜苏打，顶上一球冰淇淋和一颗樱桃。`,
      kilimanjaro: T`酸味清爽的乞力马扎罗，黑色的杯子配金边。`, guatemala: T`有一点巧克力香，杯子是青绿色的。`, icedaulait: T`冰咖啡兑牛奶，吸管一搅就是两种颜色。`, bluesoda: T`像夏天的海一样蓝，冰淇淋浮在上面。`,
      bluemountain: T`牙白色的杯子，咖啡顺得没有一点棱角。`, royale: T`方糖浇上白兰地点着，蓝色的火苗在勺子上跳。`, ichigosoda: T`粉红色的草莓苏打，樱桃在冰淇淋上。`, kopiluwak: T`麝香猫吃过的咖啡豆，一杯要等很久，用金色的杯子。` },
    gacha: { neko: T`六种花色的猫，摆在桌上像在晒太阳。`, sushi: T`捏得跟真的一样，金枪鱼上还有油花。`, jihanki: T`手指大的自贩机，连取货口都做出来了。`, dobutsu: T`圆滚滚的小熊，换个颜色就是另一只。`,
      kyoryu: T`六种恐龙，最想要的那只总是最后才出。`, obake: T`软软的小幽灵，夜里看有点可爱。`, minifood: T`布丁和团子，小到能放在指尖上。`, jsushi: T`大号的寿司，要用两只手才捧得住。`,
      kingyo: T`透明的鳍，像刚从夏日祭捞回来。`, daruma: T`只画了一只眼睛，愿望成真了再画另一只。`, penguin: T`排成一排就是一支游行队伍。`, jneko: T`大号的猫，放在枕边刚刚好。`,
      uchu: T`火箭和宇航员，底座印着发射日期。`, hoseki: T`打磨过的小原石，对着灯会闪。`, jkyoryu: T`大号恐龙，站起来比手掌还高。`, maneki: T`金色的招财猫，举着左手招客人。` },
    kakigori: { ichigo: T`红得发亮的草莓糖浆，夏日祭的味道。`, melon: T`绿得不像真的，可就是这个味道。`, lemon: T`酸酸的，吃完舌头是黄的。`, bluehawaii: T`谁也说不清是什么味道，可就是想点它。`,
      mizore: T`只浇透明的糖水，冰自己的味道最清楚。`, mango: T`芒果糖浆浓得往下淌。`, budou: T`紫色的葡萄糖浆，像小时候的汽水。`, ichigomilk: T`草莓糖浆上又绕了一圈炼乳，粉的白的。`,
      ujimatcha: T`宇治抹茶糖浆，苦里带甜。`, ujikintoki: T`抹茶加红豆，冰店菜单上的老面孔。`, kuromitsu: T`黑糖蜜加黄豆粉，冲绳的甜。`, milkkintoki: T`炼乳配红豆，白冰上一颗颗红豆。`,
      tennen: T`冬天冻在冰池里的天然冰，削出来入口就化。`, houjicha: T`焙茶糖浆，香得像刚炒过的茶叶。`, shirokuma: T`炼乳浇满，水果摆成一张熊脸。`, kinpaku: T`金箔落在抹茶和红豆上，舍不得下勺。` },
    taiyaki: { tsubu: T`红豆粒粒分明，一口咬到尾巴还有馅。`, koshi: T`滤过的红豆沙，细得没有一点颗粒。`, custard: T`卡仕达酱烫口，等一分钟再咬。`, choco: T`巧克力在热皮里化成了酱。`,
      matcha: T`抹茶面皮配抹茶馅，绿得很彻底。`, imo: T`烤红薯泥，甜得像秋天。`, cheese: T`奶油奶酪微微发咸，配甜皮刚好。`, crotsubu: T`可颂皮一层层酥开，里面还是红豆。`,
      kuri: T`整颗栗子埋在豆沙里。`, zunda: T`毛豆捣成的绿色馅，仙台的味道。`, hamcheese: T`不甜的那一种，火腿和芝士拉出长丝。`, crocustard: T`酥皮碎了一地，卡仕达还很烫。`,
      kurogoma: T`黑芝麻面皮，黑得发亮。`, ichigo: T`粉色面皮里夹着草莓奶油。`, crochoco: T`酥皮加巧克力，咬下去咔嚓一声。`, kinpaku: T`贴着金箔的鲷鱼烧，舍不得吃。` },
    oden: { daikon: T`炖到透明的萝卜，一筷子就能夹开。`, tamago: T`在汤里泡了一夜，蛋白都变成了茶色。`, konnyaku: T`划了花刀，汤汁才吃得进去。`, chikuwa: T`中间是空的，汤会灌进去，小心烫。`,
      hanpen: T`白白软软，像一块会浮起来的云。`, konbu: T`打成结的海带，汤的鲜味有一半是它。`, ganmo: T`豆腐里拌了胡萝卜和木耳，炸过再煮。`, atsuage: T`外面炸得金黄，里面还是嫩豆腐。`,
      shirataki: T`一小捆魔芋丝，用葫芦干扎着。`, mkonnyaku: T`浇上甜甜的味噌，名古屋的吃法。`, mochikin: T`油豆腐袋里包着一块年糕，咬开会拉丝。`, cabbage: T`卷心菜包着肉馅，用牙签别住。`,
      tsumire: T`沙丁鱼打成泥搓的丸子，串成一串。`, mdaikon: T`萝卜加一勺八丁味噌，颜色深得像漆。`, gyusuji: T`牛筋要炖好几个小时，才会软得发亮。`, tako: T`章鱼腿卷成一圈，越嚼越香。`,
      mtamago: T`茶色的蛋再裹一层味噌，喜欢的人会连吃两个。`, kanizume: T`蟹钳的壳留着当把手，冬天最贵的那一格。` },
    sushi: { tamago: T`甜甜的玉子烧，回转寿司的第一盘常常是它。`, kappa: T`黄瓜卷，咬下去清脆的一声。`, inari: T`甜豆皮包着醋饭，小孩子最先伸手。`, ika: T`白得透明，嚼起来有点倔强。`,
      salmon: T`回转带上最受欢迎的那一盘。`, maguro: T`红得很正，最普通也最不会错。`, ebi: T`尾巴翘着，像在打招呼。`, hamachi: T`油润的鰤鱼幼鱼，冬天更好吃。`, asalmon: T`喷枪一过，油脂冒着小泡。`,
      hotate: T`圆圆的一颗，甜得像糖。`, ikura: T`海苔墙里堆满了小红珠。`, negitoro: T`金枪鱼泥配葱花，软软的一口。`, aengawa: T`鳍边的油脂最香，炙一下更香。`,
      chutoro: T`粉色的大理石纹，入口就化。`, uni: T`喜欢它的人会专门为它来一趟。`, atoro: T`大腹炙过，香得整条街都闻得到。`, goldtoro: T`贴了金箔的大腹，盘子是黑底金边。` },
  };

  // decorations: slot = neck / head / feet (cat gear) or sticker (goes on a machine's side). source: album, later shop / event
  const DECOR = [
    { id: 'scarf-red', name: T`红围巾`, slot: 'neck', c: '#ff5a6a', rarity: 1, source: 'album' },
    { id: 'scarf-brown', name: T`咖啡色围巾`, slot: 'neck', c: '#9a5a32', rarity: 1, source: 'album' },
    { id: 'bell', name: T`金铃铛`, slot: 'neck', c: '#ffd23f', rarity: 2, source: 'album' },
    { id: 'scarf-star', name: T`星空围巾`, slot: 'neck', c: '#3d3a8a', rarity: 3, source: 'album' },
    { id: 'crown', name: T`小王冠`, slot: 'head', c: '#ffd23f', rarity: 3, source: 'album' },
    { id: 'candy-clip', name: T`糖果发夹`, slot: 'head', c: '#ff8fc8', rarity: 1, source: 'album' },
    { id: 'chef-hat', name: T`小厨师帽`, slot: 'head', c: '#ffffff', rarity: 2, source: 'album' },
    { id: 'knit-hat', name: T`毛线帽`, slot: 'head', c: '#3fb8ff', rarity: 2, source: 'album' },
    { id: 'socks-white', name: T`白袜子`, slot: 'feet', c: '#ffffff', rarity: 1, source: 'album' },
    { id: 'boots-rain', name: T`黄雨靴`, slot: 'feet', c: '#ffd23f', rarity: 2, source: 'album' },
    { id: 'socks-gold', name: T`金袜子`, slot: 'feet', c: '#ffb020', rarity: 3, source: 'album' },
    { id: 'st-star', name: T`星星贴纸`, slot: 'sticker', c: '#ffd23f', rarity: 1, source: 'album' },
    // the lucky cat figurine: the wholesaler's thank-you for the first 招き猫 sold; it sits on one machine's top (polish, 2026-10-16)
    { id: 'maneki', name: T`招财猫摆件`, slot: 'figure', c: '#fffdf6', rarity: 2, source: 'goods' },
    { id: 'st-chips', name: T`薯片贴纸`, slot: 'sticker', c: '#ff7a7a', rarity: 1, source: 'album' },
    { id: 'st-onigiri', name: T`饭团贴纸`, slot: 'sticker', c: '#ffffff', rarity: 1, source: 'album' },
    { id: 'st-duck', name: T`小黄鸭贴纸`, slot: 'sticker', c: '#ffe14a', rarity: 2, source: 'album' },
    { id: 'st-latte', name: T`拉花贴纸`, slot: 'sticker', c: '#c08a4e', rarity: 2, source: 'album' },
    { id: 'st-naruto', name: T`鸣门卷贴纸`, slot: 'sticker', c: '#ff8fa8', rarity: 1, source: 'album' },
    { id: 'st-orange', name: T`橙子切片贴纸`, slot: 'sticker', c: '#ff9a2e', rarity: 1, source: 'album' },
    { id: 'st-toast', name: T`吐司贴纸`, slot: 'sticker', c: '#e2a95c', rarity: 1, source: 'album' },
    { id: 'st-retro', name: T`复古招牌贴纸`, slot: 'sticker', c: '#ffb03a', rarity: 2, source: 'album' },
    { id: 'st-chip', name: T`芯片贴纸`, slot: 'sticker', c: '#3ff4ff', rarity: 1, source: 'album' },
    { id: 'st-snow', name: T`雪花贴纸`, slot: 'sticker', c: '#9ae8ff', rarity: 1, source: 'album' },
    { id: 'st-noodle', name: T`面碗贴纸`, slot: 'sticker', c: '#c8452f', rarity: 2, source: 'album' },
    { id: 'st-egg', name: T`鸡蛋贴纸`, slot: 'sticker', c: '#ffd23f', rarity: 1, source: 'album' },
    { id: 'st-tray', name: T`托盘贴纸`, slot: 'sticker', c: '#7a2a1a', rarity: 2, source: 'album' },
    { id: 'st-sushi', name: T`寿司贴纸`, slot: 'sticker', c: '#ff8a4a', rarity: 2, source: 'album' },
    { id: 'st-oden', name: T`关东煮贴纸`, slot: 'sticker', c: '#e8862a', rarity: 2, source: 'album' },
    { id: 'st-taiyaki', name: T`鲷鱼烧贴纸`, slot: 'sticker', c: '#d8902a', rarity: 2, source: 'album' },
    { id: 'st-kakigori', name: T`刨冰贴纸`, slot: 'sticker', c: '#3a8aff', rarity: 2, source: 'album' },
    { id: 'st-gacha', name: T`扭蛋贴纸`, slot: 'sticker', c: '#ff5fa2', rarity: 2, source: 'album' },
    { id: 'st-kissa', name: T`纯喫茶贴纸`, slot: 'sticker', c: '#b8283a', rarity: 2, source: 'album' },
    // from ミケ: her badge when she has seen enough (见证), and the stickers she brings as presents (恩返し)
    { id: 'tencho', name: T`店長名牌`, slot: 'neck', c: '#e8c08a', rarity: 3, source: 'neko' },
    { id: 'st-paw', name: T`肉球贴纸`, slot: 'sticker', c: '#ffb3c8', rarity: 2, source: 'neko' },
    { id: 'st-sakura', name: T`樱花耳贴纸`, slot: 'sticker', c: '#ffb877', rarity: 2, source: 'neko' },
    { id: 'st-catcan', name: T`猫罐头贴纸`, slot: 'sticker', c: '#ffd27a', rarity: 2, source: 'neko' },
    { id: 'st-fish', name: T`鱼骨贴纸`, slot: 'sticker', c: '#9ad0ff', rarity: 2, source: 'neko' },
    // cat v2: the other cats' presents, a sticker of each one's face
    { id: 'st-nk-mike', name: T`ミケ 贴纸`, slot: 'sticker', c: '#ffac5a', rarity: 2, source: 'neko' },
    { id: 'st-nk-kuro', name: T`クロ 贴纸`, slot: 'sticker', c: '#3d3446', rarity: 2, source: 'neko' },
    { id: 'st-nk-chibi', name: T`ちび 贴纸`, slot: 'sticker', c: '#ffb877', rarity: 2, source: 'neko' },
    { id: 'st-nk-chatora', name: T`チャトラ 贴纸`, slot: 'sticker', c: '#ffc285', rarity: 2, source: 'neko' },
    { id: 'st-nk-mofu', name: T`モフ 贴纸`, slot: 'sticker', c: '#fff3e0', rarity: 2, source: 'neko' },
    { id: 'st-nk-shiro', name: T`シロ 贴纸`, slot: 'sticker', c: '#ffffff', rarity: 2, source: 'neko' },
    { id: 'st-nk-hachi', name: T`ハチワレ 贴纸`, slot: 'sticker', c: '#ffffff', rarity: 2, source: 'neko' },
  ];
  const SLOT_NAMES = { neck: T`脖子`, head: T`头`, feet: T`脚`, sticker: T`机器贴纸`, figure: T`机器顶上` };

  // series: finish one (every item sold at least once) and its decoration is yours to claim
  const S = (id, name, items, reward) => ({ id, name, items, reward });
  const tierOf = (kind, t) => ECON.GOODS[kind].filter(g => g.tier === t && !g.paid).map(g => [kind, g.id]);   // (catalog goods never in a free series)
  const rowOf = r => ECON.GOODS.spiral.filter(g => g.row === r).map(g => ['spiral', g.id]);
  const SERIES = [
    S('dk1', T`ミズイロ ★`, tierOf('drink', 1), 'scarf-red'),
    S('sp1', T`なんでも ★`, tierOf('spiral', 1), 'socks-white'),
    S('cu1', T`ヨルカフェ ★`, tierOf('cup', 1), 'scarf-brown'),
    S('dk2', T`ミズイロ ★★`, tierOf('drink', 2), 'bell'),
    S('dk3', T`ミズイロ ★★★`, tierOf('drink', 3), 'st-star'),
    S('dk4', T`ミズイロ 珍品`, [...tierOf('drink', 4), ...tierOf('drink', 5)], 'crown'),
    S('snack', T`零食全集`, rowOf(0), 'st-chips'),
    S('sweet', T`甜品全集`, rowOf(1), 'candy-clip'),
    S('food', T`吃的全集`, rowOf(2), 'st-onigiri'),
    S('goods', T`杂货全集`, rowOf(3), 'boots-rain'),
    S('cu2', T`ヨルカフェ 新菜单`, [...tierOf('cup', 2), ...tierOf('cup', 3)].filter(([, id]) => !ECON.product('cup', id).mill), 'chef-hat'),
    S('warm', T`热乎乎`, [['drink', 'coffee'], ['drink', 'corn'], ['drink', 'hojicha'], ['drink', 'cocoa'], ['cup', 'blend'], ['cup', 'latte'], ['cup', 'cocoa'], ['cup', 'caramel']], 'knit-hat'),
    S('duck', T`鸭鸭`, [['spiral', 'duck'], ['spiral', 'blueduck'], ['spiral', 'goldduck']], 'st-duck'),
    S('latte', T`拉花`, [['cup', 'latte'], ['cup', 'matcha'], ['cup', 'caramel'], ['cup', 'kokuto']], 'st-latte'),
    S('night', T`夜空`, [['drink', 'nightsoda'], ['cup', 'nightblend'], ['drink', 'moon']], 'scarf-star'),
    S('yu1', T`ゆげ屋 ★`, tierOf('ramen', 1), 'st-naruto'),
    S('ju1', T`しぼりたて ★`, tierOf('juice', 1), 'st-orange'),
    S('ar1', T`オートレストラン ★`, [['auto', 'ham'], ['auto', 'cheese'], ['auto', 'tamago']], 'st-toast'),
    S('showa', T`昭和自販機`, [['ramen', 'kake'], ['auto', 'ham'], ['auto', 'burger'], ['auto', 'curry']], 'st-retro'),
    S('pk1', T`ピコ堂 ★`, tierOf('digital', 1), 'st-chip'),
    S('yk1', T`ゆきんこ ★`, tierOf('frozen', 1), 'st-snow'),
    S('tm1', T`たまご小屋 ★`, tierOf('locker', 1).filter(([, id]) => !['egg', 'hakusai'].includes(id)), 'st-egg'),
    S('ob1', T`おぼん ★`, tierOf('teishoku', 1).filter(([, id]) => id !== 'karaage'), 'st-tray'),
    S('su1', T`すし丸 ★`, tierOf('sushi', 1), 'st-sushi'),
    S('od1', T`ぐつぐつ ★`, tierOf('oden', 1), 'st-oden'),
    S('ty1', T`しっぽまで ★`, tierOf('taiyaki', 1), 'st-taiyaki'),
    S('kg1', T`ふわゆき ★`, tierOf('kakigori', 1), 'st-kakigori'),
    S('gc1', T`ころころ ★`, tierOf('gacha', 1), 'st-gacha'),
    S('ks1', T`しずく ★`, tierOf('kissa', 1), 'st-kissa'),
    S('noodle', T`麺めぐり`, [['ramen', 'shoyu'], ['ramen', 'miso'], ['frozen', 'ramenkit'], ['frozen', 'tsukemen']], 'st-noodle'),
    S('gold', T`金色收藏`, [['drink', 'goldcorn'], ['spiral', 'goldchips'], ['spiral', 'goldduck'], ['spiral', 'goldneko'], ['cup', 'goldmatcha']], 'socks-gold'),
  ];

  /* ---------- state: owned decorations, claimed series, what is worn / stuck where, what was new since last look ---------- */
  // seenGoods / seenDecor: what has been looked at in the album since it came in (a small NEW until then)
  const st = { owned: {}, claimed: {}, cat: { neck: null, head: null, feet: null }, stickers: {}, figure: null, seenGoods: {}, seenDecor: {}, seenCats: {} };
  const decor = id => DECOR.find(d => d.id === id);
  const progress = s => { const have = s.items.filter(([k, id]) => ECON.soldCount(k, id)).length; return { have, all: s.items.length, done: have === s.items.length }; };
  const claimable = () => SERIES.filter(s => !st.claimed[s.id] && progress(s).done);
  function claim(id) {
    const s = SERIES.find(x => x.id === id); if (!s || st.claimed[id] || !progress(s).done) return null;
    st.claimed[id] = Date.now(); st.owned[s.reward] = { t: Date.now(), from: 'album:' + id }; return decor(s.reward);
  }
  // a decoration from somewhere other than a series (ミケ's presents, her badge)
  function grant(id, from) { if (!decor(id) || st.owned[id]) return null; st.owned[id] = { t: Date.now(), from }; return decor(id); }
  // wear (or take off) a piece of cat gear; stick a sticker on a machine (one each), or peel it off
  function wear(id) { const d = decor(id); if (!d || !st.owned[id] || d.slot === 'sticker' || d.slot === 'figure') return; st.cat[d.slot] = st.cat[d.slot] === id ? null : id; }
  // the lucky cat sits on one machine's top (or none)
  const perch = machine => { st.figure = machine || null; };
  const figureOn = machine => st.owned.maneki && st.figure === machine ? 'maneki' : null;
  function stick(id, machine) { for (const m in st.stickers) if (st.stickers[m] === id) delete st.stickers[m]; if (machine) st.stickers[machine] = id; }
  const stickerOn = machine => st.stickers[machine] || null;
  const gear = () => ({ ...st.cat });
  // NEW marks: a product sold for the first time, or a decoration just claimed, until the player has looked at it once
  const gk = (kind, id) => kind + ':' + id;
  const isNewGood = (kind, id) => !!ECON.soldCount(kind, id) && !st.seenGoods[gk(kind, id)];
  const seeGood = (kind, id) => { st.seenGoods[gk(kind, id)] = 1; };
  const newGoods = kind => ECON.GOODS[kind].filter(g => ECON.listed(g) && isNewGood(kind, g.id)).length;
  const isNewDecor = id => !!st.owned[id] && !st.seenDecor[id];
  const seeDecor = id => { st.seenDecor[id] = 1; };
  const newDecor = () => DECOR.filter(d => isNewDecor(d.id)).length;
  // a cat whose knack has just worked for the first time: new on the album's cat page until looked at
  const isNewCat = id => typeof NEKO !== 'undefined' && !!NEKO.state(id).knew && !st.seenCats[id];
  const seeCats = () => { if (typeof NEKO !== 'undefined') NEKO.CATS.forEach(c => { if (NEKO.state(c.id).knew) st.seenCats[c.id] = 1; }); };
  const newCats = () => typeof NEKO === 'undefined' ? 0 : NEKO.CATS.filter(c => isNewCat(c.id)).length;
  // the album button's dot: something new to look at, or a series waiting to be claimed
  const unseen = () => Object.keys(ECON.GOODS).some(k => newGoods(k) > 0) || newDecor() > 0 || newCats() > 0 || claimable().length > 0;
  const seeAll = () => { for (const k in ECON.GOODS) ECON.GOODS[k].forEach(g => { if (ECON.soldCount(k, g.id)) seeGood(k, g.id); }); for (const id in st.owned) seeDecor(id); };
  const save = () => JSON.parse(JSON.stringify(st));
  // an older save (no NEW marks yet) counts everything it already has as seen, so it does not light up all at once
  function load(d, old = false) {
    if (d) Object.assign(st, { owned: d.owned || {}, claimed: d.claimed || {}, cat: { neck: null, head: null, feet: null, ...(d.cat || {}) }, stickers: d.stickers || {}, figure: d.figure || null, seenCats: d.seenCats || {},
      seenGoods: d.seenGoods || {}, seenDecor: d.seenDecor || {} });
    if ((d && !d.seenGoods) || (!d && old)) seeAll();
  }
  return { FLAVOR, DECOR, SERIES, SLOT_NAMES, decor, progress, claimable, claim, grant, wear, stick, stickerOn, perch, figureOn, gear, unseen, save, load,
    isNewGood, seeGood, newGoods, isNewDecor, seeDecor, newDecor, isNewCat, seeCats, newCats,
    owns: id => !!st.owned[id], isClaimed: id => !!st.claimed[id], seriesOf: (kind, id) => SERIES.filter(s => s.items.some(([k, i]) => k === kind && i === id)) };
})();
