
const cron = require('node-cron')
let cookies = null
console.log("每天自动签到脚本开始运行啦：", new Date().toLocaleString())

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
        "body": "email=510878689%40qq.com&passwd=123456&code=&remember_me=week",
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
        console.log(element)
        if (element[0] === 'set-cookie') {
            const val = element[1].split(';')[0]
            cookies.push(val)
        }
    }
    console.log(cookies)
    checkin()
}

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

/**
 * 定时任务
 */
cron.schedule("30 11 14 * * *", function() {
    // node-cron 表达式总共6位，首位的秒可以省略，所以也可以5位
    // 每秒执行一次 * * * * * *
    // 每天12点30分执行一次  30 12 * * *
    // 每隔5秒执行一次  */5 * * * * *
    // 每天早上8点到晚上6点之间每个正点执行任务一次  0 0 8-18 * * *，等同于  0 0 8,9,10,11,12,13,14,15,16,17,18 * * *
    console.log("触发定时任务：", new Date().toLocaleString())
    checkin()
})