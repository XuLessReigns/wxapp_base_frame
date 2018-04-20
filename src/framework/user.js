
import Util from './util';
import WxProxy from './wxproxy';

export default function User(option = {}) {

    if (!option.loginOptions || !option.loginOptions.url) {

        console.error('at User: loginOption/loginOption.url is required!');
        return;
    }

    const STORE_SESSION_KEY = 'session';

    const UserData = {
        userInfo: {},
        sessionKey: '',
        extraInfo: {
            openUserId: 0,
            containsUnionId: false
        }
    }

    try {
        var value = wx.getStorageSync(STORE_SESSION_KEY)
        value && Util.merge(UserData, value);
    } catch (e) { }

    return {

        _logining_request: null,
        _config: option,

        STORE_SESSION_KEY,

        UserData,
        login,
        doLogin,
        doLoginRequest
    }

    function login() {

        return WxProxy.checkSession().then(res => {

            return UserData.sessionKey ? UserData : this.doLogin()
        }).catch(res => {

            return this.doLogin()
        })
    }

    function doLogin() {

        // handle concurrent login request;
        if (this._logining_request) {

            return this._logining_request
        }

        return this._logining_request = WxProxy.login().then(logininfo => {

            if (logininfo.code) {

                return WxProxy.getUserInfo({
                    withCredentials: true,
                    lang: 'zh_CN'
                }).then(userInfo => {

                    UserData.userInfo = userInfo.userInfo;

                    return {
                        encryptedData: userInfo.encryptedData,
                        iv: userInfo.iv
                    }
                }).catch(res => {

                    // This catch clause must be reserved even if you removed the following line!;
                    console.log('用户未授权获取信息');
                    // and this error should not be thrown upwards!
                }).then(encryptInfo => {

                    return this.doLoginRequest(logininfo.code, encryptInfo)
                })
            } else {

                var msg = 'wx.login invalid code - ' + JSON.stringify(logininfo);
                console.error(msg);

                return Promise.reject(msg)
            }
        }).catch(error => {

            // reset value so that another login request can step in
            this._logining_request = null;

            if (error.code == 'wxfail'){

                var msg = 'wx.login failed - ' + JSON.stringify(error);
                console.error(msg);

                error = msg
            }

            return Promise.reject(error)
        }).then(UserData => {

            this._logining_request = null;
            return UserData;
        })
    }

    function doLoginRequest(code, encryptInfo = {}) {

        Util.merge(this._config.loginOptions, {
            data: {
                loginCode: code,
                userInfo: UserData.userInfo,
                encryptedData: encryptInfo.encryptedData || '',
                iv: encryptInfo.iv || ''
            }
        })

        return WxProxy.request(this._config.loginOptions).then(sessionInfo => {

            var filteredInfo = this._config.loginOptions.filter(sessionInfo) || {};

            var sessionData = filteredInfo.data;
            if (sessionData.success && sessionData.value) {

                UserData.sessionKey = sessionData.value;

                if (sessionData.extraInfo) {
                    UserData.extraInfo = sessionData.extraInfo;
                }

                wx.setStorage({
                    key: STORE_SESSION_KEY,
                    data: UserData
                })

                return UserData;
            }
            else {

                var msg = 'doLoginRequest failed - ';
                console.error(msg, error)

                return Promise.reject({
                    summary: msg,
                    option: this._config.loginOptions,
                    response: error
                })
            }
        })
    }
}