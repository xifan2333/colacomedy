const regeneratorRuntime = require('regenerator-runtime')
const timer = require("./timer")
class map {
    constructor(key) {
        this.key = key
    }
    getLngLat_promise(location) {
        return new Promise((resolve, reject) => {
            wx.request({
                url: `https://apis.map.qq.com/ws/geocoder/v1/?address=${location}&key=${this.key}`,
                success: (res) => {
                    resolve(res.data)
                },
                fail: (err) => {
                    reject(err)
                }
            })

        })
    }

    async getLngLat(location) {
        let res = await this.getLngLat_promise(location)
        await timer(200)
        console.log(res)
        return res.result.location
    }

}

 
module.exports = map