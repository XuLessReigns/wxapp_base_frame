var app = getApp();
var PageBase = require('../pagebase');

var p = PageBase.extend({

    page_loading: false,
    data: {

    },

    onLoad: function () {

    },

    onShow: function () {

        // app.login().then(user=>{
        //     console.log(user)
        // })

        // app.login().then(res=>console.log(res))

        this.getUserInfo()
        this.getUserInfo()
    },

    onHide: function () {

    },

    onUnload: function () {

    }
})

p.getUserInfo = function(){

    const data = {
        "activityChannel": app.config.activityChannel,
        "filterIdType": [1],
        "needUserInfo": [1, 3],
        "importUserInfo": true,
        "queryOrderCount": false
    }

    app.request({
        serviceName: 'SalesWeChatAppUnifiedOrderFindOrderUser',
        serviceVersion: '1.0.0',
        data
    }).then(res => {

        if (res.success) {

            var uinfo = {};
            if (res.value.length > 0 && res.value[0].name && res.value[0].idNo) {
                uinfo = res.value[0];
            }

            var phoneInfo = res.extraInfo.userPhoneList[0];
            if (phoneInfo) {
                uinfo.phone = phoneInfo.phone
            }

            return uinfo
        }
        
        return Promise.reject('获取用户信息失败')
    }).then(uinfo=>{
        console.log(uinfo)
    })
}


Page(p);