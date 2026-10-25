# nandemo-go

南丁猫自贩机（Nandemo Go: Idle Vending）的宣发站。纯静态网页，风格是 2026-10-24 定下的「夜街霓虹」，四种语言：简体、繁體、日本語、English。

上线后的网址：

| 页面 | 网址 | 用途 |
| --- | --- | --- |
| 首页 | https://michael2221807.github.io/nandemo-go/ | 一句话介绍、下载徽章、竖版和横版预告片、四台机器、猫、商店截图、常见问题 |
| 隐私政策 | https://michael2221807.github.io/nandemo-go/privacy.html | 填到 App Store Connect 的「隐私政策网址」 |
| 支持 | https://michael2221807.github.io/nandemo-go/support.html | 填到 App Store Connect 的「技术支持网址」 |

语言：网址后加 `?lang=zh-Hans`、`?lang=zh-Hant`、`?lang=ja`、`?lang=en`；不加时用上次选的，或按浏览器语言。

## 发布

- 公开联系邮箱：michaeltiktok999@gmail.com（隐私页、支持页）。
- GitHub Pages：从 `main` 分支根目录发布，推到 `main` 即更新网站。
- App Store 链接 `https://apps.apple.com/app/id6826643374` 在应用上架前打不开，上架后自动可用。

## 素材

- `assets/trailer-v.mp4`、`assets/trailer-h.mp4`：完整版预告片的网页压缩版（720p，71 秒）；繁中、日文、英文页分别用 `trailer-{v,h}-hant.mp4`、`-ja.mp4`、`-en.mp4`；原片在项目文件 `宣发/预告片样片/`。
- `assets/phone-*.jpg`：各语言的模拟器街景截图，放在首页的手机里，点播放后换成竖版预告片。
- `assets/m/`：四台机器的游戏内特写；`assets/cats.jpg`：猫围着碗吃饭。
- `assets/shots/`：商店截图缩小版，每种语言四张（第 3 张是霓虹涂装的机器页，没有价格）。
- 下载徽章直接引用 Apple 官方地址（tools.applemarketingtools.com），加载失败时显示柠檬色按钮。
- 字体来自 Google Fonts。网站没有 Cookie，也没有统计。
