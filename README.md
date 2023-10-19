#  用node脚本实现网站自动签到功能
每天自动签到脚本，解放你的双手，用到了 nodejs 里的 fetch 发送请求，获取到签到接口需要的登录态。然后用 node-corn 库创建定时任务，实现每天自动签到

## 参考文档
* [node-cron](https://www.npmjs.com/package/node-cron)
* [MDN fetch](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch)
* [Node fetch](https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch)

详细开发介绍请参考[博客文章](http://node123.cn/note/node/%E7%94%A8node%E8%84%9A%E6%9C%AC%E5%AE%9E%E7%8E%B0%E7%BD%91%E7%AB%99%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E5%8A%9F%E8%83%BD/)

### 注意问题
如果在自己本地电脑上运行，windows 进入睡眠状态时，定时任务是不会执行的，即使用 pm2 启动服务也不会执行的，只能设置让电脑从不睡眠了，或者有服务器的部署在自己的服务器上跑。

还有如果想要在每天随机一个时间执行内执行，用 cron 表达式是不行的，定时任务开启后只能在某个时间点执行或者间隔多长时间执行，想到的方案是可以开启两个定时任务，第一个都是每天同一时间触发，最好是每天0点0分0秒，然后在这个定时任务里再去随机获取一个时间，去开启另一个定时任务去执行，这个我还没实验，或者你有更好的方案可以分享下哟！