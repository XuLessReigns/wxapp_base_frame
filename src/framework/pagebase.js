

export default function PageBase() {

    const app = getApp();
    const Util = app.Util;

    // jump_to 页面跳转传值
    let __page_data = null;

    return {

        onReachBottom() { },

        data: {
            ui_pageloading: {
                hide: false
            }
        },

        // tap to copy event handler
        tap_copy,
        // setData event handler
        set_data,
        // make a phone call event handler 
        call_phone,
        // jump to the 3td mini program event handler
        nav_to_mini,

        onBeforeLoad,
        onLoad,
        onShow,
        onReady,

        nav_to,
        nav_back,

        switch_tab,
        report_formid,

        open_epolicy,
        open_file(e) {
            app.openFile(app.config.cdnBase + e.currentTarget.dataset.url);
        },

        extend
    }

    function extend(childMembers) {

        var p = Util.merge({}, this);

        // 接管子页面的部分生命周期函数
        p.__onLoad = childMembers.onLoad;
        p.__onShow = childMembers.onShow;
        p.__onReady = childMembers.onReady;

        delete childMembers.onLoad;
        delete childMembers.onShow;
        delete childMembers.onReady;

        Util.merge(p, childMembers);

        if (p.page_loading === true) {
            p.data.ui_pageloading.hidden = true
        }

        return p;
    }

    function onBeforeLoad(options) {

        var qrParams = Util.tryMergeQrParam(options, options.scene);
        if (qrParams && !qrParams.scene) {
            // delete scene since it has been parsed;
            delete options.scene
        }
    }

    function onLoad(options) {

        this.onBeforeLoad(options)
        
        this.options = options;

        // 注入jump_to传递的数据
        if (__page_data !== null) {
            this.options.__page_data = __page_data;
            __page_data = null;
        }

        console.log(this.route, '页面入参:');
        console.log(this.options);

        if (typeof this.__onLoad === 'function') {
            this.__onLoad(this.options)
        }
    }

    function onShow() {

        if (typeof this.__onShow === 'function') {

            var data = {};
            if (__page_data !== null) {
                data.__page_data = __page_data;
                __page_data = null
            }

            this.__onShow(data)
        }
    }

    function onReady() {

        if (typeof this.__onReady === 'function') {
            this.__onReady.apply(this, arguments)
        }

        wx.showShareMenu && wx.showShareMenu({
            withShareTicket: true
        })

        if (this.route !== 'pages/index/index') {

            this.setData({
                mod_contactus_show: isOffwork()
            })
        }
    }

    function isOffwork() {

        var date = new Date();

        var d = date.getDay();

        var start = new Date(Util.formatDate(date, 'yyyy/MM/dd 09:00:00'));
        var end = new Date(Util.formatDate(date, 'yyyy/MM/dd 18:00:00'));

        return date > start && date < end && d >= 1 && d <= 5
    }

    function set_data(e) {

        var ds = e.currentTarget.dataset;
        if (ds.prop) {

            if (ds.prop.indexOf(',') == -1) {

                this.setData({
                    [ds.prop]: ds.val
                })
            }
            else {

                // 多属性设值
                var props = ds.prop.split(',');
                var vals = ds.val.split(',');
                var obj = {};
                for (var i = 0; i < props.length; i++) {
                    obj[props[i]] = vals[i]
                }

                this.setData(obj)
            }
        }
    }

    function call_phone(e) {

        var ds = e.currentTarget.dataset;
        wx.makePhoneCall({
            phoneNumber: ds.phone || '1010-9955'
        })
    }

    function nav_to(e, replace, data) {

        var url = e;
        if (e.currentTarget) {
            
            var ds = e.currentTarget.dataset;

            url = ds.url;
            replace = ds.replace === '1';
            data = ds.pagedata;
        }

        if (url.startsWith('pages')) {
            url = '/' + url
        }

        var pages = getCurrentPages().reverse(),
            urlRoute = url.split('?')[0],
            index = pages.findIndex(item => '/' + item.route === urlRoute);

        if (typeof data != 'undefined') {
            __page_data = data
        }

        if (index == -1) {

            if (replace === true) {
                wx.redirectTo({ url })
            }
            else {
                wx.navigateTo({ url })
            }
        }
        else {
            wx.navigateBack({
                delta: index
            })
        }
    }

    function nav_back(e, delt, data){

        if (e.currentTarget) {

            var ds = e.currentTarget.dataset;

            delt = +ds.delt;
            data = ds.pagedata;
        }
        else{

            delt = e;
            data = delt;
        }

        if (typeof data != 'undefined') {
            __page_data = data
        }

        wx.navigateBack({
            delta: delt || 1
        })
    }

    function switch_tab(e, data) {

        var url = e;
        if (e.currentTarget) {

            // 来自点击事件
            var ds = e.currentTarget.dataset;

            url = ds.url;
            data = data.pagedata;
        }

        if (typeof data != 'undefined') {
            __page_data = data
        }

        wx.switchTab({ url })
    }

    function tap_copy(e) {

        var data = e.target.dataset.copy;
        wx.setClipboardData({
            data: data,
            success: function (res) {
                wx.showToast({
                    title: '复制成功',
                    icon: 'success',
                    duration: 1000
                })
            }
        })
    }

    function nav_to_mini(e, data) {

        var ds = data || e.currentTarget.dataset;
        if (ds.appid) {

            if (!wx.navigateToMiniProgram) {
                app.showError('先升级下微信版本，再来点我哦！', 3);
                return;
            }

            var envVersions = {
                'prd': 'release',
                'uat': 'trial',
                'test': 'develop'
            };

            if (ds.extraData && typeof ds.extraData === 'string') {

                try {
                    ds.extraData = JSON.parse(ds.extraData)
                } catch (e) {
                    console.error('navigateToMiniProgram: extraData传参有误')
                }
            }

            wx.navigateToMiniProgram({
                appId: ds.appid,
                path: ds.path,
                envVersion: envVersions[app.config.env],
                extraData: ds.extraData
            })
        }
    }

    function open_epolicy(e) {

        var url = e.target.dataset.contracturl;
        app.openFile(url, function (res) {
            if (res.statusCode == 301) {
                app.showError('超过每日最大下载次数（20次），请明天再来下载哦')
                return false
            }
        })
    }

    function report_formid(e, data) {

        if (!e || e.type !== 'submit' || e.__formid_handled === true) return;

        e.__formid_handled = true;

        var ds = e.detail.target.dataset, reportData = {
            activityChannel: app.config.activityChannel,
            formId: e.detail.formId,
            // extraInfo: {
            //     phone: e.detail.value.phone
            // },
            formType: 1,
            formSourceType: ds.formsource || ds.nwname,
            totalMessageCount: 1
        }

        data && Util.merge(reportData, data);

        if (!reportData.formSourceType) {
            console.warn('缺少 data-formsource 或 data-nwname')
        }

        if (reportData.formId == 'the formId is a mock one') {
            return;
        }

        if (reportData.extraInfo) {
            reportData.extraInfo = JSON.stringify(reportData.extraInfo)
        }

        app.request({
            serviceName: 'za.sales.weChatApp.userFormId.create',
            method: 'POST',
            data: reportData
        })
    }
}