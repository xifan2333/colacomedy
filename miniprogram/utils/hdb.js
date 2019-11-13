const cookies = require('weapp-cookie')
const moment = require('moment')
const regeneratorRuntime = require('regenerator-runtime')
const Map = require('./map')
const config = require('../config/config')
const {key} = config


moment.locale("zh-cn")
let map = new Map(key)

class hdb {
    constructor(cookie={},username="", password="") {
        this.username = username
        this.password = password
        this.cookie = cookie
        for(let prop in this.cookie){
            cookies.set(prop,this.cookie[prop],{ domain: '.hudongba.com' })
        }
        console.log(cookies.dir())
    }
    is_login_promise() {
        return new Promise((resolve, reject) => {
            wx.request({
                url: 'https://post.hudongba.com/post/api:303',
                success: (res) => {
                    resolve(res.data)
                },
                fail: (err) => {
                    reject(err)
                }
            })
        })
    }
    async is_login() {
        let result = await this.is_login_promise()
        let login_status = result.is_login
        if (login_status == '0') {
            console.log("未登录")
            return false
        }
        console.log("已登录")
        return true
    }
    login_promise() {
        return new Promise((resolve, reject) => {
            wx.request({
                url: 'https://post.hudongba.com/post/api:2',
                data: {
                    login_name: this.username,
                    login_password: this.password
                },
                header: {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                success: (res) => {
                    resolve(res.data)
                },
                fail: (err) => {
                    reject(err)
                }
            })

        })
    }
    async login() {
        if (!await this.is_login()) {
            let res = await this.login_promise()
            if(res.error){
                console.log(res.error)
            }
        } else {
            console.log("使用cookie登录成功")
        }
    }
    party_promise(id = '') {
        if (!id) {
            return new Promise((resolve, reject) => {
                wx.request({
                    url: 'https://api.hudongba.com/ajax/api:500?infoType=party',
                    success: (res) => {
                        resolve(res.data.result.infoList)
                    },
                    fail: (err) => {
                        reject(err)
                    }
                })
            })
        } else {
            return new Promise((resolve, reject) => {
                wx.request({
                    url: `https://api.hudongba.com/ajax/api:100`,
                    data: {
                        'infoId36': id,
                        'infoType': 'party',
                        'test_uid': cookies.get('W_U_L_I', '.hudongba.com'),
                        'test_sign': cookies.get('W_U_L_S', '.hudongba.com')
                    },
                    success: (res) => {
                        resolve(res.data.result.payItemList)
                    },
                    fail: (err) => {
                        reject(err)
                    }
                })
            })
        }
    }
    async party() {
        await this.login()
        let nowDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        let parties = await this.party_promise()
        parties = parties.filter(item => item.startDate > nowDate)
        parties = parties.sort((pre, next) => moment(pre.startDate) - moment(next.startDate))
        for (let party of parties) {
            party.localeDate = `${moment(party.startDate).format("M月D日 ddd HH:mm")}`
            party.posterImage = `https://img-qn.hudongba.com${party.posterImage}`
            let res = await this.party_promise(party.id36)
            party.inventory = res.reduce((acc, cur) => acc + cur.inventory, 0)
            let r = /.*区(.*)/
            party.shortLocation = party.location.match(r)[1]
            party.remain = party.inventory - party.join
        }
        console.log(`演出数目:${parties.length}`)
        console.log(parties)
        return parties
    }
    async getLngLat(parties) {
        for (let party of parties) {
            party.lnglat = await map.getLngLat(party.location)
        }
        return parties
    }

}
module.exports = hdb
