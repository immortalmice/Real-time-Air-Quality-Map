g0v零時空汙觀測網
------
>整合各方空汙監測站的觀測資料與各種汙染源的排放資料以地圖視覺化呈現
清楚明瞭的即時空汙動態追蹤，以此達到排汙監督的社會效益

專案簡介
------

緣由與欲解決之問題
最初的專案方向是在開發小型開源的arduino空氣品質監測器並組織一個非官方的共同觀測網
一路開發下來發現其實很多各路高手都在做類似的專案
但專案之間的資料並不互通且零散
各平台有各的優缺點，要著手去統一開發平台並不實際
所以決定把目標提高一個層次去整合各種觀測資源讓各空汙監測開發社群貢獻的效益最大化

專案最高原則
------
整合各方空汙監測站的觀測資料與各種汙染源的排放資料以地圖視覺化呈現
清楚明瞭的即時空汙動態追蹤，以此達到排汙監督的社會效益
在最後並可彈性化統一輸出方便後續應用的資料格式(json, tabular data)

執行環境
------
使用 [node.js](https://nodejs.org/en/) 作為編譯器，編譯並執行 WebServer.js 以及 FetchServer.js 兩個檔案

node.js使用到的模板有
* [express](http://expressjs.com/)
* [fs](https://nodejs.org/api/fs.html)
* [http](https://nodejs.org/api/http.html)
* [querystring](https://nodejs.org/api/querystring.html)

在前端部分，使用到了以下的支援
* [Google Maps Javascript API v3](https://developers.google.com/maps/documentation/javascript/)
* [jQuery](https://jquery.com/)
* [Bootstrap](http://getbootstrap.com/)
* [InfoBubble.js](http://google-maps-utility-library-v3.googlecode.com/svn/trunk/infobubble/examples/example.html/)
* [ThingSpeak APIs](https://thingspeak.com/)

環境安裝過程
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install express --save -g
sudo npm install file-system -g
sudo npm install http -g
sudo npm install query-string -g

運作簡介
------
FetchServer.js 會依據所登錄的站點類別，前去撈取最新一筆的資料，並整理放置於網頁提供範圍的目錄下(預設為/Web/Data/)<br/>
對於環保署站點，另外會上傳至ThiingSpeak已建立好的頻道<br/>
而 WebServer.js 則是提供網頁服務<br/>
map.html 會抓取由FetchServer.js 整理好的json格式資料，展現於地圖上<br/>
另外非LASS站點可點擊視窗中的歷史資料翻找舊的資料，LASS站點則是連網往LASS專案的網頁<br/>

成果展現(已搬家)
------
http://g0vairmap.3203.info/


註
------
G0V零時空污觀測網現已由[Asper](https://github.com/Asperhsu)接手後續開發及維護
新的網站網址為 https://v5.airmap.g0v.tw/#/map
