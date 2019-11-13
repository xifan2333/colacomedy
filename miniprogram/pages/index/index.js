const hdb = require("../../utils/hdb")
const moment = require('moment')
const plugin = requirePlugin('routePlan')
const config = require("../../config/config")
const timer = require("../../utils/timer")

let { key } = config
let { referer } = config
let { cookie } = config

Page({
  data: {
    calendarConfig: {
      multi: true,
      firstDayOfWeek: 'Mon',
      takeoverTap: true,
      showHandlerOnWeekMode: true
    },
    parties: [],
    showStatus: ['本周', '本月', '全部'],
    load:false,
    showIndex: 2,
    switchRank: false,
    switchTicketOk: false,
    switchCalander: false,
    partiesMargin: 80,
    start:"",
    end:""
  },
  onLoad: async function () {
    wx.stopPullDownRefresh()
    this.colacomedy = new hdb(cookie)
    let parties = await this.colacomedy.party()
    wx.setStorageSync("parties", parties)
    await this.getLngLat()
    this.startDate = moment(parties[0].startDate).format("YYYY-MM-DD HH:mm:ss")
    this.endDate = moment(parties[parties.length - 1].startDate).format("YYYY-MM-DD HH:mm:ss")
    this.updateParty()
    this.setData({
      load: true,
    })
  },
  onPullDownRefresh: function () {
    this.setData(
      {
        parties:this.data.parties,
        showIndex: this.data.showIndex,
        switchRank: this.data.switchRank,
        switchTicketOk: this.data.switchTicketOk,
        switchCalander: this.data.switchCalander,
        start:this.data.start,
        end:this.data.end
      }
    )
    this.onLoad()
    
  },

  onShareAppMessage: function () {

    return {

      title: '生活太多无趣，我有可乐喜剧！',
      imageUrl: '/images/logo.png',
      path: '/page/index/index'

    }

  },

  buyTicket(e) {
    let id = e.target.id
    console.log(id)
    wx.navigateToMiniProgram({
      appId: 'wx6f6831e5b83b7535',
      path: `pages/detail/detail?id=${id}`,
      success: (res) => {

      },
      fail: (err) => {
        console.log(err);
      }
    })

  },

  getTicket() {
    wx.navigateToMiniProgram({
      appId: 'wx6f6831e5b83b7535',
      path: 'pages/me/me',
    })
  },

  goHere(e) {
    let endPoint = JSON.stringify({
      'name': e.target.dataset.location,
      'latitude': e.target.dataset.lnglat.lat,
      'longitude': e.target.dataset.lnglat.lng
    })
    wx.navigateTo({
      url: 'plugin://routePlan/index?key=' + key + '&referer=' + referer + '&endPoint=' + endPoint
    })
  },

  pickerChange: async function (e) {
    let showIndex = e.detail.value
    console.log('显示模式改变,改变值为', this.data.showStatus[showIndex])
    this.setData({ showIndex })
    this.updateParty()
  },

  switchTicketOk: async function (e) {
    let switchTicketOk = e.detail.value
    console.log(`设置只显示可购买为:${switchTicketOk}`)
    this.setData({ switchTicketOk })
    if (this.data.switchCalander) {
      this.updateParty()
      this.calendar.cancelAllSelectedDay()
      this.highlightDays()
      
    } else {
      this.updateParty()
    }
  },

  switchRank: async function (e) {
    let switchRank = e.detail.value
    console.log(`设置日期升序排列为:${switchRank}`)
    this.setData({ switchRank })
    if (this.data.switchCalander) {
      this.updateParty(this.data.start, this.data.end)
      this.calendar.cancelAllSelectedDay()
      this.highlightDays()
    } else {
      this.updateParty()
    }
  },

  switchCalander: function (e) {
    if (e.detail.value) {
      this.setData({ 'partiesMargin': 0, "switchCalander": e.detail.value, "showIndex": 2 })
      this.updateParty()
    } else {
      this.setData({ 'partiesMargin': 80, "switchCalander": e.detail.value, "showIndex": 2 })
      this.updateParty()
    }
  },

  afterCalendarRender() {
    let ym = this.calendar.getCurrentYM()
    ym.month -= 1
    let start = moment(ym).startOf("month").format("YYYY-MM-DD HH:mm:ss")
    let end = moment(ym).endOf("month").format("YYYY-MM-DD HH:mm:ss")
    this.setData({
      start,end
    })
    this.updateParty()
    this.highlightDays()
  },

  async whenChangeMonth(e) {
    e.detail.next.month -= 1
    let year = moment(this.startDate, "YYYY-MM-DD HH:mm:ss").year()
    let month = moment(this.startDate, "YYYY-MM-DD HH:mm:ss").month() + 1
    let start = moment(e.detail.next).startOf("month").format("YYYY-MM-DD HH:mm:ss")
    let end = moment(e.detail.next).endOf("month").format("YYYY-MM-DD HH:mm:ss")
    this.setData({
      start,end
    })
    if (moment(this.data.end).isBefore(this.startDate)) {
      await timer(500)
      await wx.showToast({
        title: '该月演出已结束',
        icon: 'none',
        duration: 1000
      })
      await timer(1000)
      this.calendar.jump(year, month)
      let ym = this.calendar.getCurrentYM()
      ym.month -= 1
      let start = moment(ym).startOf("month").format("YYYY-MM-DD HH:mm:ss")
      let end = moment(ym).endOf("month").format("YYYY-MM-DD HH:mm:ss")
      this.setData({start,end})
      this.updateParty()
      this.calendar.cancelAllSelectedDay();
      this.highlightDays()
    } else if (moment(this.endDate).isBefore(start)) {
      await timer(500)
      await wx.showToast({
        title: '该月演出未开始',
        icon: 'none',
        duration: 2000
      })
      await timer(1000)
      this.calendar.jump(year, month)
      let ym = this.calendar.getCurrentYM()
      ym.month -= 1
      let start = moment(ym).startOf("month").format("YYYY-MM-DD HH:mm:ss")
      let end = moment(ym).endOf("month").format("YYYY-MM-DD HH:mm:ss")
      this.setData({
        start,end
      })
      this.updateParty()
      this.calendar.cancelAllSelectedDay();
      this.highlightDays()
    } else {
      this.updateParty()
      this.calendar.cancelAllSelectedDay();
      this.highlightDays()
    }
  },

  async onTapDay(e){
    let date = moment([e.detail.year,e.detail.month-1,e.detail.day]).format("YYYY-MM-DD")
    let parties = wx.getStorageSync("parties")
    let dates = parties.map(item=>{
      return moment(item.startDate).format("YYYY-MM-DD")
    })
    if (dates.indexOf(date)!=-1){
    let start = moment(date).startOf("day").format("YYYY-MM-DD HH:mm:ss")
    let end = moment(date).endOf("day").format("YYYY-MM-DD HH:mm:ss")
    this.setData({start,end})
    this.updateParty()
    this.calendar.cancelAllSelectedDay()
    this.highlightDays()
    }else{
      await wx.showToast({
        title: '请选择有演出的日期',
        icon: 'none',
        duration: 1000
      })
    }
    
  },

  updateParty() {
    let parties = wx.getStorageSync('parties')
    console.log(parties)
    if (parties) {
      if (this.data.showIndex == 0) {
        parties = parties.filter(item => item.startDate < moment().endOf('week').format("YYYY-MM-DD HH:mm"))
      }
      if (this.data.showIndex == 1) {
        parties = parties.filter(item => item.startDate < moment().endOf('month').format("YYYY-MM-DD HH:mm"))
      }
      if (this.data.switchCalander) {
        parties = parties.filter(item =>item.startDate>this.data.start && item.startDate<this.data.end)
      }
      if (this.data.switchRank) {
        parties = parties.sort((pre, next) => moment(next.startDate) - moment(pre.startDate))
      } else {
        parties = parties.sort((pre, next) => moment(pre.startDate) - moment(next.startDate))
      }

      if (this.data.switchTicketOk == true) {
        parties = parties.filter((item) => item.remain != 0)
      }
      this.setData({
        'parties': parties
      })
    }
  },

  highlightDays() {
    const toSet = this.data.parties.map(item => {
      let highlightDays = moment(item.startDate, "YYYY-MM-DD").toObject()
      highlightDays = {
        year: highlightDays.years,
        month: highlightDays.months + 1,
        day: highlightDays.date,
      }
      return highlightDays
    })
    this.calendar.setSelectedDays(toSet);
  },

  async getLngLat() {
    let parties = wx.getStorageSync("parties")
    parties = await this.colacomedy.getLngLat(parties)
    wx.setStorageSync("parties", parties)
  }
})