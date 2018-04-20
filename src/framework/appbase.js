
import WxProxy from './wxproxy';
import Util from './util';
import User from './user';
import Logger from './logger';

export default function AppBase(config = {}) {

    console.info('AppVersion: ' + config.version);

    const Log = Logger({
        scopeName: '【' + config.appDesc + config.env.toUpperCase() + '】'
    });

    const OS = (function () {
        try { return wx.getSystemInfoSync() || {} } catch (e) { return {} }
    })();

    // global handler for promise error
    Promise.prototype.__catch = Promise.prototype.catch;
    Promise.prototype.catch = function (callback) {

        return this.__catch(function (error = {}) {

            if (error instanceof Error) {
                // avoid duplication
                if (!error.__logged2server){
                    // flag it
                    error.__logged2server = true;
                    Log.scriptError(error)
                }
            }

            return callback(error)
        })
    }

    return {

        __request_counter: 0,
        __user: {}, // initialized in onLaunch phases

        wx: WxProxy, 
        config,
        launchInfo: {
            query: {}
        },

        Util, Log, OS,

        User: {},

        onLaunch,
        onShow,
        onError,

        // overridable
        onBeforeLaunch,
        onBeforeShow: onBeforeLaunch,
        onGetLoginOptions,

        login, 
        doLogin,

        doRequest,
        request,
        ajax: request,

        showError,
        showToast,

        showPageLoading,
        hidePageLoading,

        showLoading,
        hideLoading: wx.hideLoading.bind(wx),

        postMessage,
        extend
    }

    function extend(childMemners) {

        this.__onLaunch = childMemners.onLaunch;
        this.__onShow = childMemners.onShow;
        this.__onError = childMemners.onError;

        delete childMemners.onLaunch;
        delete childMemners.onShow;
        delete childMemners.onError;

        return Util.merge(this, childMemners);
    }

    function onLaunch(options) {

        // {"path":"pages/index/index","scene":1001,"query":{}}

        // 老版本query可能为空
        if (!options.query) {
            options.query = {}
        }
        
        // 对参数进行预处理
        this.onBeforeLaunch(options);

        this.launchInfo = options;
        // 自定义场景
        this.launchInfo.subscene = options.query.scene || '';

        console.log('App.onLaunch：');
        console.log(this.launchInfo);

        var loginOptions = this.onGetLoginOptions();
        this.__user = User({ loginOptions });

        Object.defineProperty(this, 'User', {
            get(){
                return this.__user.UserData
            }
        })

        this.__onLaunch(options);
    }

    function onShow(options){

        this.onBeforeShow(options);
        
        this.launchInfo.subscene = options.query.scene || '';

        console.log('App.onShow：');
        console.log(this.launchInfo);

        this.__onShow(options);
    }

    function onError(msg){

        if (this.config.env != 'prd') {

            this.showError(msg.substr(0, 200), 3);
        }

        this.Log.scriptError(msg);

        if (Util.isFunc(this.__onError)){

            this.__onError(msg);
        }
    }

    function onBeforeLaunch(options){

        var qrParams = Util.tryMergeQrParam(options.query, options.query.scene);
        if (qrParams && !qrParams.scene) {
            // delete scene since it has been parsed;
            delete options.query.scene
        }
    }

    function onGetLoginOptions(options){

        return {
            url: this.config.apiBase + '?serviceName=SalesWeChatAppAuthLogin&serviceVersion=1.0.0',
            data: {
                activityChannel: this.config.activityChannel,
                activityScene: {
                    scene: this.launchInfo.scene,
                    subscene: this.launchInfo.subscene
                }
            },
            // 对结果进行处理， 通常是做字段map
            filter: res => res,
            method: 'POST'
        }
    }

    function postMessage(source, data) {

        getCurrentPages().reverse.map(page => {

            if (typeof page.onMessage === 'function') {
                
                page.onMessage(source, data)
            }
        })
    }

    /* === login === */

    // login from cache first
    function login() {

        return this.__user.login().catch(handleLoginError.bind(this))
    }

    // force login
    function doLogin() {

        return this.__user.doLogin().catch(handleLoginError.bind(this))
    }

    function handleLoginError(error) {

        this.showError('登录失败')

        if (error instanceof Error) {
            Log.error(error);
        }

        return Promise.reject(error);
    }

    /* ===  UI === */

    function showTip(tip_type, msg, interval, callback) {

        let currPage = Util.getCurrentPage();

        if (currPage) {

            let option = {};
            let timerKey = '_timer_' + tip_type;

            option[tip_type] = {
                hidden: false,
                msg: msg
            }

            currPage.setData(option);

            if (this[timerKey]) {
                clearTimeout(this[timerKey])
            }

            this[timerKey] = setTimeout(function () {
                option[tip_type].hidden = true;
                currPage.setData(option);
                callback && callback();
            }, (interval || 1.5) * 1000);
        }
    }

    function showError(msg, interval, callback) {
        showTip.call(this, 'ui_toptip', msg, interval, callback)
    }

    function showToast(msg, interval, callback) {
        showTip.call(this, 'ui_toast', msg, interval, callback)
    }

    function showPageLoading() {
        var page = Util.getCurrentPage();
        page && page.setData({
            ui_pageloading: {
                hidden: false
            }
        })
    }

    function hidePageLoading() {
        var page = Util.getCurrentPage();
        page && page.setData({
            ui_pageloading: {
                hidden: true
            }
        })
    }

    function showLoading(option = {}) {
        wx.showLoading(Util.merge({
            title: '加载中...',
            mask: true
        }, option))
    }

    /* === Api request === */

    function request(option, suppressTip) {

        return this.login().then(userData => {

            option.header = {
                'Session-Key': userData.sessionKey
            }

            return this.doRequest(option, suppressTip)
        }).catch(error => {

            if (error.statusCode == 403) {

                return this.doLogin().then(userData => {

                    option.header['Session-Key'] = userData.sessionKey;
                    return this.doRequest(option, suppressTip);
                })
            }

            return Promise.reject(error)
        })
    }

    // 无须登录接口请求
    function doRequest(option, suppressTip){

        if (!option.url) {

            option.url = this.config.apiBase + '?serviceName=' + option.serviceName
                + '&serviceVersion=' + (option.serviceVersion || '1.0.0');
        }

        if (!option.method) {

            option.method = 'POST'
        }

        var request_counter = ++this.__request_counter;

        console.log('【' + request_counter + '】开始请求接口:', option.serviceName || option.url);
        console.log('携带参数:', option.data);

        return WxProxy.request(option).then(res => {

            console.log('【' + request_counter + '】接口返回', res)

            switch (res.statusCode){

                case 200:
                    return res.data
                case 403:
                    return Promise.reject(res)
            }

            // 出错了
            if (suppressTip !== true) {
                this.showError('出错了，请稍后再试！');
            }

            var msg = "接口请求失败 - statusCode: " + res.statusCode

            console.error(msg, ' data:', option, ' response:', res);

            this.Log.error({
                summary: msg,
                option,
                response: res
            })
            
            return Promise.reject(res)
        })
    }
}