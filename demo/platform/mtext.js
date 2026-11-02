/* The Japanese painted on the machines up close, in the player's language (players asked, the owner 2026-10-29; until
   then the prototype kept it Japanese in every mode, i18n.js: "it is the street itself"). Japanese stays as it is.
     原汁原味 (authentic): only the working words are translated (F below: つめた〜い, 返却, 売切, the screens, the parts'
       labels in the X-ray); the brand, the goods and the shop's own signs and slogans keep their Japanese (N)
     全部翻译 (full): everything painted on the machine; brands and goods in the local names the interface gives them
       (i18n-names.js, ECON.GOODS)
   app.js rebuilds a machine's drawing for every angle (rebuild, build_www.py hooks this file in there), so each rebuild
   swaps the words of the <text> it finds in the tables below; the screens that change while the machine works (3番 ·
   焼いています, あと 12 秒) are caught as they change. No layout read: the widths come from a canvas (cached), and a word
   longer than the Japanese it replaces is set smaller to fit the same room (or the room `w` gives it). A sign keeps
   Dela, the Japanese one's face, where Dela has the word's letters (platform.css, tools/mkfonts_mtext.py).
   A word spelled over several <text> (ミ ズ イ ロ down the side, the noren's 回転 / 寿司) is looked up whole in G and
   respelled along the same line (a string) or slot by slot (an array). The turning pictures (turn.html) load this file
   too, so they show the same words. 繁體中文 is the Chinese through i18n-hant.js (tools/make_hant.py collects it here),
   or `hant` where given. */
const MTEXT = (() => {
  const F = (zh, en, o) => ({ k: 'fn', zh, en, ...o }), N = (zh, en, o) => ({ k: 'name', zh, en, ...o }), L = o => ({ k: 'name', local: true, ...o });
  const W = {
    // ---- every machine: the money and the street's recycling box (env.js)
    '売切': F('售罄', 'SOLD OUT', { hant: '售完', w: 11 }), '返却': F('退币', 'RETURN', { w: 8 }), 'おつり': F('找零', 'CHANGE'),
    'とりだしぐち': F('取货口', 'TAKE OUT HERE'), 'お取りください': F('请取货', 'PLEASE TAKE'), '千円札': F('千元钞', '¥1000 BILLS'),
    'いらっしゃいませ': F('欢迎光临', 'WELCOME'), 'いらっしゃい': F('欢迎', 'WELCOME'), 'できあがり': F('做好了', 'READY'), 'できあがり！': F('做好了！', 'READY!'),
    'お待たせしました': F('久等了', 'HERE YOU GO'), 'お持ち帰り': F('外带', 'TAKEAWAY'), 'ご注文': F('点单', 'ORDER'), 'はじめました': N('新上市', 'NOW SERVING'),
    'かん · びん': F('罐 · 瓶', 'CANS · BOTTLES'),
    // ---- drink (ミズイロ)
    'ミズイロ': L(), '天然水': N('天然水', 'SPRING WATER'), '天然水 · 110ml〜': N('天然水 · 110ml起', 'Spring water · 110ml~'),
    'つめた〜い': F('冰～凉', 'ICE COLD'), 'あったか〜い': F('暖～呼', 'NICE & HOT'), '冷!': F('冰!', 'COLD!'), '冷えてます!': F('冰透了!', 'ICE COLD!'),
    'あたりでもう1本': F('中奖再来一瓶', 'WIN ONE MORE'), 'ねこ': F('猫', 'CAT'), '大容量': F('大容量', 'BIG LOAD'),
    // ---- spiral (なんでも)
    'なんでも': L(), '重': F('重', 'HEAVY'), '落下センサー': F('落货感应器', 'DROP SENSOR'), 'スピード出庫': F('快速出货', 'FAST OUT'),
    '大きい物 OK': F('大件也行', 'BIG ITEMS OK'), 'つまり…': F('卡住了…', 'JAMMED…'), 'ありがとう': F('谢谢', 'THANK YOU'),
    // ---- cup (ヨルカフェ)
    'ヨルカフェ': L(), '珈琲': F('咖啡', 'COFFEE'), 'ココア': F('可可', 'COCOA'), '抹茶': F('抹茶', 'MATCHA'), 'ミルク': F('牛奶', 'MILK'),
    '挽きたて': N('现磨', 'FRESH GROUND'), 'さとう': F('砂糖', 'SUGAR'), '一杯ずつ': N('一杯一杯做', 'ONE AT A TIME'), '夜': N('夜', 'NIGHT'),
    'カップ 90': F('杯 90', 'CUPS 90'), '豆から': F('整颗豆', 'WHOLE BEANS'), '挽きます': F('现场磨', 'GROUND HERE'),
    // ---- ramen (ゆげ屋)
    'ゆげ屋': L(), 'ボイラー': F('锅炉', 'BOILER'), 'だし': F('高汤', 'STOCK'), 'うどん · そば': N('乌冬 · 荞麦面', 'UDON · SOBA'),
    'らーめん · 24H': N('拉面 · 24H', 'RAMEN · 24H'), 'あと · 秒': F('还剩 · 秒', 'LEFT · SEC'), '準備中': F('准备中', 'PREPARING'),
    'あったかい めん類': N('热乎乎的面', 'HOT NOODLES'), '昭和の味': N('昭和的味道', 'SHOWA TASTE'), '回転': F('旋转', 'SPIN'),
    '湯切り': F('沥水', 'DRAIN'), '三段': F('三层', '3 TIERS'), '30食': F('30份', '30 MEALS'), '二釜': F('双锅', '2 POTS'),
    // ---- juice (しぼりたて)
    'しぼりたて': L(), '4℃ れいぞう': F('4℃ 冷藏', '4℃ CHILLED'), '4個で1杯': F('4个一杯', '4 MAKE 1 CUP'), '4個': F('4个', '4 PCS'),
    '1杯': F('1杯', '1 CUP'), '庫内': F('库内', 'INSIDE'), '圧縮中': F('榨汁中', 'PRESSING'), 'しぼりたて · いつでも': N('现榨 · 随时', 'FRESH · ANYTIME'),
    '皮入れ': F('果皮桶', 'PEELS'), '特大': F('特大', 'XL'), 'W搾り': F('双榨', 'DOUBLE PRESS'), '2こずつ': F('一次2个', '2 AT ONCE'),
    '4種': F('4种', '4 KINDS'), 'しぼり中…': F('榨汁中…', 'PRESSING…'),
    // ---- auto (オートレストラン)
    'オートレストラン': L(), 'レンジ用': F('微波用', 'FOR MICROWAVE'), '蒸気': F('蒸汽', 'STEAM'), '冷蔵 5℃': F('冷藏 5℃', 'CHILLED 5℃'),
    '換気': F('通风', 'VENT'), '24時間 あつあつ': N('24小时 热腾腾', '24H PIPING HOT'), 'トースト': N('吐司', 'TOAST'),
    'ハンバーガー': N('汉堡', 'BURGER'), 'カレー': N('咖喱', 'CURRY'), 'ライス': N('米饭', 'RICE'), 'トースト中': F('烤吐司中', 'TOASTING'),
    '近日登場': F('即将登场', 'COMING SOON'), 'あつあつ · 24時間営業': N('热腾腾 · 24小时营业', 'PIPING HOT · OPEN 24H'),
    '昭和の自販機': N('昭和的自贩机', 'SHOWA VENDING'), '空袋': F('空袋', 'EMPTY BAGS'), 'スチーム': F('蒸汽', 'STEAM'),
    'レンジ': F('微波炉', 'MICROWAVE'), 'マグネトロン': F('磁控管', 'MAGNETRON'), 'チン!': F('叮!', 'DING!'), '加熱中': F('加热中', 'HEATING'),
    'スチーム保温': F('蒸汽保温', 'STEAM WARM'), '調理中': F('烹调中', 'COOKING'), '両面焼': F('双面烤', 'BOTH SIDES'),
    // ---- digital (ピコ堂)
    'ピコ堂': L(), 'でんし部品': N('电子零件', 'ELECTRONICS'), 'PICO-OS 再起動中…': F('PICO-OS 重启中…', 'PICO-OS REBOOTING…'),
    'タッチ決済': F('感应支付', 'TAP TO PAY'), '再起動中': F('重启中', 'REBOOTING'), '無料充電': F('免费充电', 'FREE CHARGING'),
    '予備ストック': F('备用库存', 'SPARE STOCK'), 'Wアーム': F('双机械臂', 'TWIN ARMS'), '充電': F('充电', 'CHARGE'), 'フリーズ…': F('死机了…', 'FROZEN…'),
    'SDカード': N('SD卡', 'SD CARD'), '充電器': N('充电器', 'CHARGER'), 'キーキャップ': N('键帽', 'KEYCAPS'), 'ジャンク箱': N('杂货箱', 'JUNK BOX'),
    'USBケーブル': N('USB线', 'USB CABLE'),
    // ---- frozen (ゆきんこ)
    'ゆきんこ': L(), 'ツイン': F('双份', 'TWIN'), 'ハーフ': F('半份', 'HALF'), 'シングル': F('单份', 'SINGLE'), 'クォーター': F('四分之一', 'QUARTER'),
    '−25℃ れいとう': F('−25℃ 冷冻', '−25℃ FROZEN'), '霜': F('霜', 'FROST'), '霜取り中': F('除霜中', 'DEFROSTING'), 'れいとう': N('冷冻', 'FROZEN'),
    'アイス · 餃子 · ラーメン · ピザ': N('冰淇淋 · 饺子 · 拉面 · 披萨', 'ICE CREAM · GYOZA · RAMEN · PIZZA'),
    '霜なし': F('无霜', 'NO FROST'), '送風': F('送风', 'FAN'), '落とさず': F('不掉落', 'NO DROPS'), 'お届け': F('送达', 'DELIVERY'),
    // ---- locker (たまご小屋)
    'たまご小屋': L(), '集金箱': F('收钱箱', 'CASH BOX'), '予備の袋': F('备用袋', 'SPARE BAGS'), '無人販売所': N('无人售货摊', 'HONOR STAND'),
    '朝どれ': N('今早摘', 'PICKED TODAY'), '野菜': N('蔬菜', 'VEGGIES'), 'おつりは': F('恕不', 'NO CHANGE'), '出ません': F('找零', 'GIVEN'),
    'いつもありがとう': N('一直以来谢谢您', 'THANK YOU, ALWAYS'), '— 小林農園': N('— 小林农园', '— Kobayashi Farm'),
    '100円玉': F('100日元硬币', '¥100 COINS'), '朝どれ野菜': N('今早摘的蔬菜', 'FARM FRESH'), '番号を押して': F('请按号码', 'PRESS A NUMBER'),
    // ---- teishoku (おぼん)
    'おぼん': L(), '洗い場': F('洗碗区', 'WASH'), '下げ膳': F('回收托盘', 'TRAY RETURN'), '小鉢 · 冷': F('小菜 · 冷', 'SIDES · COLD'),
    '箸': F('筷子', 'CHOPSTICKS'), 'ごはん おかわり': N('米饭 可续碗', 'FREE RICE REFILLS'), '定食のセット': F('定食的组成', 'WHAT\'S IN A SET'),
    'ごはん': F('米饭', 'RICE'), 'みそ汁': F('味噌汤', 'MISO SOUP'), '主菜': F('主菜', 'MAIN'), '小鉢': F('小菜', 'SIDE'), '漬物': F('腌菜', 'PICKLES'),
    '食券の買い方': F('餐券怎么买', 'HOW TO BUY A TICKET'), 'お金を入れる': F('投钱', 'INSERT MONEY'), 'ボタンを押す': F('按按钮', 'PRESS A BUTTON'),
    '食券をとる': F('取餐券', 'TAKE THE TICKET'), '食券': F('餐券', 'TICKET'), '食器': F('餐具', 'DISHES'), '洗い物中': F('洗碗中', 'WASHING'),
    'お食事処': N('食堂', 'DINER'), '返却口': F('餐具回收口', 'TRAY RETURN'), 'ごちそうさま': F('谢谢款待', 'THANKS FOR THE MEAL'),
    'いただきます': N('开动了', 'LET\'S EAT'), '食洗機': F('洗碗机', 'DISHWASHER'), '揚げ場': F('油炸台', 'FRYER'), 'プリン': F('布丁', 'PUDDING'),
    '+プリン': F('+布丁', '+PUDDING'), '高速': F('高速', 'FAST'), '揚げたて': N('现炸', 'FRESH FRIED'), 'からっと': N('酥脆', 'CRISPY'),
    '食器を洗っています': F('正在洗碗', 'WASHING DISHES'),
    // ---- sushi (すし丸)
    'すし丸': L(), '冷蔵': F('冷藏', 'FRIDGE'), '保温': F('保温', 'WARM'), 'シャリ': F('醋饭', 'RICE'), '一皿 ¥100〜': F('一盘 ¥100起', '¥100+ A PLATE'),
    '寿司': N('寿司', 'SUSHI'), '寿': N('寿', 'SUSHI', { hant: '壽' }), 'TOUCH · タッチで注文': F('TOUCH · 触屏点单', 'TOUCH · TAP TO ORDER'), 'お皿の色で': F('按盘子颜色', 'PRICE BY'),
    'お値段': F('决定价格', 'PLATE COLOR'), 'まわるお皿は 右の窓 →': F('转动的盘子在 右边窗口 →', 'PLATES GO ROUND IN THE RIGHT WINDOW →'),
    '回転中': F('转动中', 'RUNNING'), 'レーン': F('传送带', 'LANE'), '半額あり': F('有半价', 'HALF PRICE'), 'まわる': N('转呀转', 'ROUND & ROUND'),
    'ガス': F('燃气', 'GAS'), '炙り': F('炙烧', 'TORCH'), '特急': F('特快', 'EXPRESS'), '鮮度': F('鲜度', 'FRESH'), '鮮度管理': F('鲜度管理', 'FRESHNESS CHECK'),
    'シャリ切れ': F('醋饭用完', 'OUT OF RICE'), 'レーンからどうぞ': F('请从传送带取', 'TAKE FROM LANE'), '握っています': F('正在捏寿司', 'MAKING'),
    // ---- oden (ぐつぐつ)
    'ぐつぐつ': L(), 'カップ': F('杯', 'CUPS'), 'おでん': N('关东煮', 'ODEN'), 'からし': F('黄芥末', 'MUSTARD'), 'あつあつ': N('热腾腾', 'PIPING HOT'),
    '一品 ¥100〜': F('一样 ¥100起', '¥100+ EACH'), 'おしながき · OSHINAGAKI': F('菜单 · MENU', 'MENU · OSHINAGAKI'), 'だし自慢': N('高汤一绝', 'PROUD OF OUR BROTH'),
    '二個入り · からし付き': F('两个装 · 附黄芥末', '2 PER CUP · WITH MUSTARD'), 'だし少': F('高汤少', 'LOW BROTH'), '味噌': F('味噌', 'MISO'),
    '自動給湯': F('自动加汤', 'AUTO REFILL'), '二番かご': F('第二个煮篮', '2ND BASKET'), 'だし切れ': F('高汤用完', 'OUT OF BROTH'), '盛り付け中': F('装盘中', 'SERVING UP'),
    // ---- taiyaki (しっぽまで)
    'しっぽまで': L(), '生地': F('面糊', 'BATTER'), 'たい焼き袋': F('鲷鱼烧袋', 'BAGS'), '焼きたて ¥100〜': F('现烤 ¥100起', 'FRESH ¥100+'),
    'たい': N('鲷鱼', 'TAI'), '焼き': N('烧', 'YAKI'), '焼きたて · ひとつずつ': N('现烤 · 一个一个烤', 'FRESH · ONE BY ONE'), '焼成中': F('烤制中', 'BAKING'),
    '焦げあり': F('有烤焦', 'SCORCHED'), 'しっぽまで あんこぎっしり': N('红豆馅满到尾巴', 'FILLED TO THE TAIL'), 'しっぽ': N('尾巴', 'TAIL'),
    '中身はメニューで選べます': F('馅料可在菜单里选', 'PICK THE FILLING IN THE MENU'), '焼きあがり': F('烤好了', 'DONE'), 'クロワッサン': F('可颂', 'CROISSANT'),
    'たい焼き': N('鲷鱼烧', 'TAIYAKI'), '毎回おそうじ': F('每次都清洁', 'CLEANED EVERY TIME'), '強火': F('猛火', 'HIGH HEAT'),
    '生地切れ': F('面糊用完', 'OUT OF BATTER'), '焼いています': F('正在烤', 'BAKING'), '焦げあり 値引き': F('烤焦了 打折', 'SCORCHED · DISCOUNT'),
    '焼きあがりました': F('烤好了', 'ALL DONE'),
    // ---- kakigori (ふわゆき)
    'ふわゆき': L(), '氷 冷凍庫': F('冰 冷冻库', 'ICE FREEZER'), '紙カップ': F('纸杯', 'PAPER CUPS'), '氷': F('冰', 'ICE'), 'トッピング': F('配料', 'TOPPINGS'),
    '削りたて ¥100〜': F('现刨 ¥100起', 'FRESH ¥100+'), 'かき': N('刨', 'SHAVED'), '一杯ずつ 削ります': N('一杯一杯现刨', 'SHAVED ONE BY ONE'),
    '削り中': F('刨冰中', 'SHAVING'), '氷切れ': F('冰用完', 'OUT OF ICE'), 'ふわふわ 削りたて': N('绵绵的 现刨', 'FLUFFY · FRESH SHAVED'),
    '雪みたいに': N('像雪一样', 'LIKE SNOW'), 'うすく削ります': N('刨得薄薄的', 'SHAVED THIN'), 'シロップはメニューで': F('糖浆在菜单里选', 'PICK SYRUP IN THE MENU'),
    '二枚刃': F('双刀片', 'TWIN BLADE'), '予備氷': F('备用冰', 'SPARE ICE'), '練乳': F('炼乳', 'CONDENSED MILK'), '氷 自動補給': F('冰 自动补给', 'AUTO ICE'),
    '削っています': F('正在刨', 'SHAVING'),
    // ---- gacha (ころころ)
    'ころころ': L(), 'カプセル': F('扭蛋', 'CAPSULES'), 'ガチャ': N('扭蛋', 'GACHA'), '1回 ¥200〜': F('一次 ¥200起', '¥200+ A TURN'),
    'つまり': F('卡住了', 'JAMMED'), 'おすし': N('寿司', 'SUSHI'), 'じはんき': N('自贩机', 'VENDING'), 'どうぶつ': N('动物', 'ANIMALS'),
    'なにが出るかな': N('会出什么呢', 'WHAT WILL YOU GET?'), 'シークレット': F('隐藏款', 'SECRET'), 'シークレット 出るかも!': N('可能出隐藏款!', 'MAYBE A SECRET!'),
    '6いろ ＋ ひみつの きんいろ': N('6种颜色 ＋ 神秘的金色', '6 COLORS ＋ A SECRET GOLD'), 'でてきたよ': F('出来了', 'HERE IT IS'),
    'カプセル とりだし口': F('扭蛋 取出口', 'CAPSULE OUT'), '急こう配': F('陡坡', 'STEEP'), 'つまり防止': F('防卡', 'ANTI-JAM'), 'ジャンボ': F('大号', 'JUMBO'),
    'トントンしてね': F('拍拍我', 'TAP TAP'), 'ガチャ…': F('扭蛋中…', 'GACHA…'), 'シークレット!': F('隐藏款!', 'SECRET!'),
    // ---- kissa (しずく)
    'しずく': L(), '浄水': F('净水', 'FILTERED'), '食器洗浄': F('餐具清洗', 'DISHWASH'), '仕上げ': F('收尾', 'FINISH'), 'サイフォン珈琲': N('虹吸咖啡', 'SIPHON COFFEE'),
    '珈琲 しずく': N('咖啡 一滴', 'COFFEE SHIZUKU'), 'いらっしゃいませ ごゆっくり': F('欢迎光临 慢慢享用', 'WELCOME · TAKE YOUR TIME'), 'サイフォン式': N('虹吸式', 'SIPHON'),
    '抽出中': F('萃取中', 'BREWING'), 'フィルター交換': F('换滤布', 'CHANGE FILTER'), 'アイス珈琲': N('冰咖啡', 'ICED COFFEE'), 'ウインナー珈琲': N('维也纳咖啡', 'VIENNA COFFEE'),
    '創業 昭和四十八年': N('创业于 昭和四十八年', 'SINCE 1973'), 'ネル': F('法兰绒', 'FLANNEL'), 'ハロゲン×2': F('卤素灯 ×2', 'HALOGEN ×2'),
    '毎回ネル洗浄': F('每次清洗滤布', 'FILTER WASHED EVERY TIME'), 'クリーム': F('奶油', 'CREAM'), 'ソーダ': F('汽水', 'SODA'), 'ただいま抽出中': F('正在萃取', 'BREWING NOW'),
    // ---- bakery (こむぎ堂)
    'こむぎ堂': N('小麦堂', 'WHEAT HOUSE'), '冷蔵 4℃': F('冷藏 4℃', 'CHILLED 4℃'), 'パン袋': F('面包袋', 'BREAD BAGS'), '生地 冷蔵': F('面团 冷藏', 'DOUGH CHILLED'),
    '定量': F('定量', 'MEASURE'), '発酵 38℃': F('发酵 38℃', 'PROOF 38℃'), 'ひとつから ¥200〜': F('一个起卖 ¥200起', 'FROM ¥200 EACH'),
    'こむぎ堂 ベーカリー': N('小麦堂 面包房', 'WHEAT HOUSE BAKERY'), '発酵中': F('发酵中', 'PROOFING'), '毎日 この窓で焼いています': N('每天 就在这扇窗里烤', 'BAKED IN THIS WINDOW DAILY'),
    'ぜんぶ 焼きたて · 中身はメニューで': F('全部现烤 · 馅料在菜单里选', 'ALL FRESH · PICK IN THE MENU'), 'フライ 170℃': F('油炸 170℃', 'FRY 170℃'),
    '折込生地': F('折叠面团', 'LAMINATED DOUGH'), 'カレーパン': N('咖喱面包', 'CURRY BUN'), 'サクサク': N('酥酥脆脆', 'CRUNCHY'), 'できたて': N('刚出炉', 'FRESH'),
    'サンド': F('三明治', 'SANDWICH'),
    // ---- teppan (てっぱん丸)
    'LPガス': F('液化气', 'LP GAS'), '舟皿': F('船形盘', 'BOATS'), 'たこ 4℃': F('章鱼 4℃', 'OCTOPUS 4℃'), 'ガス 中火': F('燃气 中火', 'GAS · MEDIUM'),
    'たこ': F('章鱼', 'OCTOPUS'), 'マヨ': F('蛋黄酱', 'MAYO'), '青のり': F('青海苔', 'NORI'), 'ねぎ': F('葱', 'SCALLION'), 'かつお': F('木鱼花', 'BONITO'),
    '6こ入り ¥300〜': F('6个装 ¥300起', '6 PCS ¥300+'), '焼き中': F('烤制中', 'COOKING'), '仕上げ中': F('收尾中', 'FINISHING'),
    '外はカリッ 中はトロッ': N('外脆 里嫩', 'CRISPY OUT · GOOEY IN'), '注文ごとに 鉄板からひと舟': N('每单一船 现从铁板上', 'ONE BOAT PER ORDER · OFF THE GRIDDLE'),
    'のり': F('海苔', 'NORI'), '玉子': N('鸡蛋', 'EGG'), '麺': F('面', 'NOODLES'), 'いか': N('鱿鱼', 'SQUID'), '昇降': F('升降', 'LIFT'),
    '仕上げています': F('收尾中', 'FINISHING'), '揚げています': F('正在炸', 'FRYING'), '生地をのばしています': F('正在擀面', 'ROLLING DOUGH'), '鉄板から': F('出铁板', 'OFF THE GRILL'),
    // ---- the comic look's stickers and speech bubbles (zzz-deco.js)
    'なんでもアリ!': N('什么都有!', 'ANYTHING GOES!'), 'なんでも売ってる!': N('什么都卖!', 'WE SELL IT ALL!'), '挽きたて!': N('现磨!', 'FRESH GROUND!'),
    'おつかれさま': N('辛苦啦', 'GOOD WORK TODAY'), 'あと': F('还剩', 'LEFT'), 'あつあつ!': N('热腾腾!', 'PIPING HOT!'), 'いただきます!': N('开动了!', 'LET\'S EAT!'),
    '4個で': F('4个', '4 PCS ='), 'しぼりたて!': N('现榨!', 'FRESH SQUEEZED!'), 'ぎゅーっ!': N('挤～!', 'SQUEEZE!'), 'ゴトッ!': N('咣当!', 'THUNK!'),
    '安い!': N('便宜!', 'CHEAP!'), 'ガジェット!': N('小玩意!', 'GADGETS!'), 'ピコッ!': N('哔哔!', 'BEEP!'), 'ひんやり!': N('凉飕飕!', 'CHILLY!'),
    '朝どれ!': N('今早摘!', 'PICKED TODAY!'), 'おいしいよ!': N('好吃哦!', 'TASTY!'), 'おかわり!': N('再来一碗!', 'SECONDS!'), 'まわってます!': N('转着呢!', 'GOING ROUND!'),
    'いらっしゃい!': N('欢迎!', 'WELCOME!'), 'ぐつぐつ!': N('咕嘟咕嘟!', 'SIMMER!'), 'やきたて!': N('现烤!', 'FRESH BAKED!'), 'しっぽまで!': N('满到尾巴!', 'TO THE TAIL!'),
    'ふわっふわ!': N('松松软软!', 'FLUFFY!'), 'ガチャッ!': N('咔嚓!', 'CLACK!'), 'なにがでる?': N('会出什么?', 'WHAT\'S INSIDE?'), 'ごゆっくり': N('慢慢享用', 'TAKE YOUR TIME'),
    'サイフォン!': N('虹吸!', 'SIPHON!'),
  };
  // a word over several <text> (their texts joined by /): the side signs, the noren
  const G = {
    'ミ/ズ/イ/ロ': L({ en: 'AQUA' }), 'な/ん/で/も': L({ en: 'ANY' }), '珈/琲': N('咖啡', 'CAFE'), 'う/ど/ん/そ/ば': N(['乌', '冬', '', '荞', '麦'], ['U', 'DO', 'N', 'SO', 'BA']),
    'し/ぼ/り': N('现榨', 'JUICE'), 'オ/ー/ト': N('自动', 'AUTO'), 'ピ/コ/堂': L({ en: 'PICO' }), '冷/凍': N('冷冻', 'ICE'), 'た/ま/ご': N('鸡蛋', 'EGGS'),
    '定/食': N('定食', ['SET', 'MEAL']), '回/転/寿/司': N('回转寿司', 'SUSHI'), '回転/寿司': N(['回转', '寿司'], ['CONVEYOR', 'SUSHI']), 'お/でん': N('关东煮', 'ODEN'),
    'お/で/ん': N('关东煮', 'ODEN'), 'た/い/焼/き': N('鲷鱼烧', 'TAIYAKI'), 'たい/焼き': N(['鲷鱼', '烧'], ['TAI', 'YAKI']), 'た/い/焼': N('鲷鱼烧', 'TAI'),
    'かき/氷': N(['刨', '冰'], ['SHAVED', 'ICE']), '練/乳': F(['炼', '乳'], ['MILK', '']), 'ガ/チ/ャ/ガ/チ/ャ': N('扭蛋扭蛋', 'GACHA'),
    '純/純/喫/喫/茶/茶': N(['纯', '纯', '喫', '喫', '茶', '茶'], ['CA', 'CA', 'FÉ', 'FÉ', '', '']), '焼/き/た/て': N('现烤', 'FRESH'), 'こ/む/ぎ': N('小麦', 'WHEAT'),
    '粉/も/ん': N('粉物', 'KONA'), 'て/っ/ぱ/ん/丸': N(['', '铁', '板', '丸', ''], ['TEP', 'PAN', '', 'MA', 'RU']), 'た/こ/焼': N('章鱼烧', 'TAKO'),
  };
  const code = I18N.code || I18N.lang, lang = I18N.hant ? 'hant' : I18N.lang, full = I18N.full, off = lang === 'ja';
  const hz = s => !I18N.hant || !I18N.hz ? s : Array.isArray(s) ? s.map(I18N.hz) : I18N.hz(s);
  const loc = jp => { const n = I18N.name(jp); return n !== jp ? n : null; };
  let goods = null;   // a good's Japanese name → its local one (全部翻译), as the interface names it
  const good = jp => { if (!goods) { goods = new Map(); try { for (const l of Object.values(ECON.GOODS)) for (const g of l) if (g.jp && g.name !== g.jp) goods.set(g.jp, g.name); } catch (e) { /* none */ } } return goods.get(jp) || null; };
  function pick(e, jp) {
    if (!e || (e.k === 'name' && !full)) return null;
    if (lang === 'en' && e.en !== undefined) return e.en;
    if (e.local) return loc(jp);
    return lang === 'hant' ? e.hant ?? hz(e.zh) : e.zh;
  }
  const t3 = (zh, hant, en) => lang === 'en' ? en : lang === 'hant' ? hant : zh;
  // the word for this language and mode, or null (keep the Japanese)
  function word(jp) {
    if (W[jp]) return pick(W[jp], jp);
    if (full) { const g = good(jp) || loc(jp); if (g) return g; }
    // the screens: numbers inside, parts joined by ·
    let m;
    if ((m = /^(\d+)番$/.exec(jp))) return t3(`${m[1]}号`, `${m[1]}號`, `No.${m[1]}`);
    if ((m = /^あと ?(\d+) ?秒$/.exec(jp))) return t3(`还剩${m[1]}秒`, `還剩${m[1]}秒`, `${m[1]}s LEFT`);
    if ((m = /^(\d+)円$/.exec(jp))) return `¥${m[1]}`;
    if ((m = /^(\d+)皿$/.exec(jp))) return t3(`${m[1]}盘`, `${m[1]}盤`, `${m[1]} PLATES`);
    if ((m = /^(\d+)秒$/.exec(jp))) return t3(`${m[1]}秒`, `${m[1]}秒`, `${m[1]} SEC`);
    if ((m = /^(\d+)本$/.exec(jp))) return t3(`${m[1]}瓶`, `${m[1]}瓶`, `${m[1]} BOTTLES`);
    if (jp.includes(' · ')) { const ps = jp.split(' · ').map(p => JP.test(p) ? word(p) : p); if (ps.every(p => p != null)) return ps.join(' · '); }
    return null;
  }
  const JP = /[぀-ヿ一-鿿]/;
  // the face a translated sign is set in (platform.css): Dela like the Japanese (its second cut, tools/mkfonts_mtext.py),
  // or, for a word with a character Dela lacks, the whole word in Noto Sans Black (data-mf="b"). The rest stay DM Mono
  // (index.html), their Chinese in the system's face as the Japanese was
  const LACKS = '业东丝两临么乌乡买伞传內兰关冈军农冻净刚创刨动势单卖卤厅发叠启呢咔咕咣咪哔啟啡啦嗶嘟噜噹嚓嚕团园场壳备奖奶妇层币带库应弹录您戏扭挤换摊擀时杂枪柠标样榨欢汉汤沥洁浆浓满滤炖炼烧热玛现电盐盘码种筷篮糰絕红纯纳纸纹线组绒结给绝续绳维绵综缽罄罗腌腾舰苏荞萝营萨蓝蔥虾补见请调谢貓贝财货贩费转轮软边达还这选鄉酱钞钮钱钳铁锅键陡隐颂颗颜颼风飕饭饮饺馅马魷鱼鱿鲑鲜鲷鳍鳗鸡鸭鹅龙＋';   // (tools/mkfonts_mtext.py writes this line)
  const black = s => lang !== 'en' && [...[].concat(s).join('')].some(c => LACKS.includes(c));
  const FACE = { jp: '"ND Dela"', dela: '"ND Dela Plus"', b: lang === 'hant' ? '"ND Sign TC"' : '"ND Sign SC"', mono: '"DM Mono","PingFang SC","Hiragino Sans",sans-serif' };
  const faceOf = (t, s, jp) => !t.classList.contains('sign') ? 'mono' : jp ? 'jp' : black(s) ? 'b' : 'dela';
  // widths in the drawing's units, from a canvas (cached once the face has loaded: no layout read)
  const ctx = document.createElement('canvas').getContext('2d'), widths = new Map();
  if (!off) for (const f of ['dela', 'b']) document.fonts.load(`10px ${FACE[f]}`).catch(() => {});
  function width(s, face) {
    const key = face + s; let w = widths.get(key);
    if (w === undefined) { const font = `100px ${FACE[face]}`; ctx.font = font; w = ctx.measureText(s).width / 100; if (face === 'mono' || document.fonts.check(font, s)) widths.set(key, w); }
    return w;
  }
  // one <text>: the word, set smaller when it needs more room than the Japanese had (its own size kept for the next one)
  function swap(t, jp, to, room) {
    if (!t.dataset.small) t.dataset.fs = t.getAttribute('font-size') || 6;
    const fs = +t.dataset.fs, face = faceOf(t, to, false);
    const have = room || width(jp, faceOf(t, jp, true)) * fs, need = width(to, face) * fs;
    t.textContent = to; t.dataset.mt = to; if (face === 'b') t.dataset.mf = 'b'; else delete t.dataset.mf;
    if (need > have * 1.04) { t.setAttribute('font-size', (fs * have / need).toFixed(2)); t.dataset.small = 1; }
    else if (t.dataset.small) { t.setAttribute('font-size', fs); delete t.dataset.small; }
  }
  // a word over several <text>: slot by slot (an array), or its letters along the line from the first to the last
  function spell(ts, to) {
    const n0 = ts.length, b = black(to), fs = +ts[0].getAttribute('font-size') || 10;
    ts.forEach(e => { e.dataset.mt = 1; if (b) e.dataset.mf = 'b'; });
    if (Array.isArray(to)) { ts.forEach((e, q) => { if (to[q]) swap(e, e.textContent, to[q]); else e.textContent = ''; e.dataset.mt = 1; }); return; }
    const xs = ts.map(e => +e.getAttribute('x') || 0), ys = ts.map(e => +e.getAttribute('y') || 0);
    const dx = xs[n0 - 1] - xs[0], dy = ys[n0 - 1] - ys[0], span = Math.hypot(dx, dy), ux = span ? dx / span : 0, uy = span ? dy / span : 1;
    const mx = (xs[0] + xs[n0 - 1]) / 2, my = (ys[0] + ys[n0 - 1]) / 2;
    if (lang === 'en' && Math.abs(dx) > Math.abs(dy)) {   // (English along a row: the whole word at the middle)
      ts.forEach((e, q) => { e.textContent = q ? '' : to; });
      ts[0].setAttribute('x', mx.toFixed(2)); ts[0].setAttribute('y', my.toFixed(2)); ts[0].setAttribute('text-anchor', 'middle');
      const need = width(to, faceOf(ts[0], to, false)) * fs, have = span + fs;
      if (need > have) ts[0].setAttribute('font-size', (fs * have / need).toFixed(2));
      return;
    }
    const ch = [...(lang === 'en' ? to.toUpperCase() : to)].filter(c => c !== ' '), n = ch.length;
    // (no more letters than slots: each in a slot of its own, the middle ones — a noren's cloths are drawn one over the
    // next, so a letter between two would be half under the next cloth)
    if (n <= n0) { const o = Math.floor((n0 - n) / 2); ts.forEach((e, q) => { e.textContent = ch[q - o] || ''; }); return; }
    const gap = n > 1 ? Math.min(span / (n0 - 1 || 1) * 1.5, span / (n - 1)) : 0, k = n > n0 ? n0 / n : 1;
    const at = (e, q) => { const d = (q - (n - 1) / 2) * gap; e.setAttribute('x', (mx + ux * d).toFixed(2)); e.setAttribute('y', (my + uy * d).toFixed(2)); if (k < 1) e.setAttribute('font-size', (fs * k).toFixed(2)); };
    ts.forEach((e, q) => { if (q >= n) { e.textContent = ''; return; } e.textContent = ch[q]; at(e, q); });
    for (let q = n0, last = ts[n0 - 1]; q < n; q++) { const e = ts[0].cloneNode(false); e.textContent = ch[q]; at(e, q); last.after(e); last = e; }
  }
  function apply(roots) {
    if (off) return;
    for (const r of roots) {
      if (!r) continue;
      const ts = [...r.querySelectorAll('text')];
      for (let i = 0; i < ts.length; i++) {
        const t = ts[i]; if (t.dataset.mt) continue;
        const s = t.textContent;
        // (a run of short <text> side by side in one group: a word spelled over them?)
        if (s.length <= 2 && JP.test(s)) {
          let j = i + 1; while (j < ts.length && ts[j].parentNode === t.parentNode && ts[j].textContent.length <= 2 && JP.test(ts[j].textContent)) j++;
          if (j - i > 1) { const run = ts.slice(i, j), key = run.map(e => e.textContent).join('/');
            if (G[key]) { const to = pick(G[key], key.replace(/\//g, '')); if (to) spell(run, to); i = j - 1; continue; } }
        }
        const to = word(s);
        if (to) swap(t, s, to, W[s] && W[s].w);
      }
    }
  }
  // the screens and lamps a machine changes while it works (textContent: the <text> gets a new child)
  const mo = new MutationObserver(recs => {
    for (const r of recs) { const t = r.target.nodeType === 3 ? r.target.parentNode : r.target;
      if (!t || t.nodeName !== 'text' || t.dataset.mt === t.textContent) continue;
      const s = t.textContent, to = JP.test(s) && word(s); if (to) swap(t, s, to, W[s] && W[s].w); }
  });
  if (!off) {
    document.querySelectorAll('.mroot').forEach(g => mo.observe(g, { childList: true, subtree: true, characterData: true }));
    apply(document.querySelectorAll('.mroot'));   // (what the game drew before this file loaded: the machines are built at start)
  }
  return { apply, word, W, G, lang: code };
})();
