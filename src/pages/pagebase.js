
const PageBase = require('../lib/wxapp.min').PageBase();

const app = getApp(), Util = app.Util;

module.exports = PageBase.extend({
    
    // the default share setting
    onShareAppMessage() {
        return this.defaultShareInfo
    },

    // the page data that every page should have
    data: {
        cdnBase: app.config.cdnBase,
        imgVersion: '?v=' + Date.now()
    },

    // the default share data
    defaultShareInfo: {
        title: '到了机场也能买哦~',
        imageUrl: app.config.cdnBase + '/images/share.jpg',
        path: '/pages/index/index'
    },

    // go to homepage
    go_home(e) {
        this.switch_tab('/pages/index/index')
    }
})