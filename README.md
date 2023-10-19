#  用node脚本实现网站自动签到功能
每天自动签到脚本，解放你的双手，用到了 nodejs 里的 fetch 发送请求，获取到签到接口需要的登录态。然后用 node-corn 库创建定时任务，实现每天自动签到

## 参考文档
* [node-cron](https://www.npmjs.com/package/node-cron)
* [MDN fetch](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch)
* [Node fetch](https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch)

有一个网站每天签到可以获取流量，之前每天都是自己打开网页登录然后手动点签到，但是如果连续7天没签到之前获取的所有流量都会清空。类似的需求会有很多，很多网站、应用也都会提供签到获取积分、金币、能量、饲料...其实用node脚本来实现每天自动签到很简单的。

## 想到的实现方案
* 用无头浏览器 Puppeteer、Playwright 之类的库模拟dom操作，这个稍微复杂点，涉及到比较离谱的图形验证还需要接入第三方验证码识别
* 抓包应用的网络请求，直接通过分析登录、签到接口，发起网络请求实现签到

下方示例采用了第二种接口签到方式，一般我们只需要先分析登录接口，拿到登录态，如果是直接返回的 token 那就更简单了，也有的网站会自动通过 cookie 设置登录态，拿到登录态我们再带上登录态去请求签到接口就可以了。

## 实现步骤

### 1、分析登录接口，拿到登录态参数
输入账号密码登录后，发现登录接口 Response 里并没有数据返回，然后看 Headers 里的 Response Headers 里的 Set-Cookies 就是登陆成功服务端自动设置的登录态信息：

<img src="http://node123.cn/assets/1.a3708eff.png" />

这一步只需要带着账号密码参数去请求登录接口，然后再解析出 Set-Cookies 里我们需要的参数就行了，发起请求不需要用第三方库，17.5.0版本后 node 里也可以直接使用 fetch 发送请求了，可以直接在浏览器控制台 network 里选中接口右键 Copy - Copy as Node.js  fetch 复制，示例代码如下

```javascript
/**
 * 获取登录态 cookies
 * @returns
 */
const getCookie = async function() {
    const res = await fetch("https://cafe123.cn/auth/login", {
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "zh-CN,zh;q=0.9",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\"Google Chrome\";v=\"117\", \"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"117\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "Referer": "https://cafe123.cn/auth/login",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": "email=123456%40qq.com&passwd=123456&code=&remember_me=week",
        "method": "POST"
    })

    if (res.status !== 200) {
        console.log('登录失败：', new Date(), res)
        return
    }

    // res.json().then(r => {
    //   console.log(r)
    // })
    const headers = res.headers
    cookies = []
    for (const element of headers) {
        if (element[0] === 'set-cookie') {
            const val = element[1].split(';')[0]
            cookies.push(val)
        }
    }
    checkin()
}
```

拿到响应结果后，通过 res.headers 可以拿到响应头里的所有参数，然后可以用 for of 遍历下取出我们需要的参数就行了。

### 发起签到请求
先按照上面登录接口类似的方法分析签到接口的构成，这一步主要是请求头里面的 cookie 参数，直接用上一步拿到的响应头里的 Set-Cookies 里的登录信息按 key=value 用分号分隔拼接好就行了。

```javascript
/**
 * 签到
 */
const checkin = async function() {
    if (!cookies) {
        getCookie()
        return
    }

    const res = await fetch("https://cafe123.cn/user/checkin", {
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "zh-CN,zh;q=0.9",
            "sec-ch-ua": "\"Google Chrome\";v=\"117\", \"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"117\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": cookies.join(';'),
            "Referer": "https://cafe123.cn/user",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "POST"
    })
    if (res.status !== 200) {
        console.log('签到失败：', new Date().toLocaleString(), res)
        cookies = null
        getCookie()
    } else {
        console.log('签到成功：', new Date().toLocaleString(), res)
        res.json().then(r => {
            console.log(r)
        })
    }
}
```

### 3、发起签到请求
这一步需要借助定时任务 node-cron 库，注意 node-cron 表达式总共6位，首位的秒是可以省略的，所以也可以5位：

```javascript
/**
 * 定时任务
 */
cron.schedule("30 2 8 * * *", function() {
    // node-cron 表达式总共6位，首位的秒可以省略，所以也可以5位
    // 每秒执行一次 * * * * * *
    // 每天12点30分执行一次  30 12 * * *
    // 每隔5秒执行一次  */5 * * * * *
    // 每天早上8点到晚上6点之间每个正点执行任务一次  0 0 8-18 * * *，等同于  0 0 8,9,10,11,12,13,14,15,16,17,18 * * *
    console.log("触发定时任务：", new Date().toLocaleString())
    checkin()
})
```

### 注意问题
如果在自己本地电脑上运行，windows 进入睡眠状态时，定时任务是不会执行的，即使用 pm2 启动服务也不会执行的，只能设置让电脑从不睡眠了，或者有服务器的部署在自己的服务器上跑。

还有如果想要在每天随机一个时间执行内执行，用 cron 表达式是不行的，定时任务开启后只能在某个时间点执行或者间隔多长时间执行，想到的方案是可以开启两个定时任务，第一个都是每天同一时间触发，最好是每天0点0分0秒，然后在这个定时任务里再去随机获取一个时间，去开启另一个定时任务去执行，这个我还没实验，或者你有更好的方案可以分享下哟！