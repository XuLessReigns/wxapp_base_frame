
export default function logger(options = {}) {

    return {

        scopeName: options.scopeName + '-',
        info,
        error,
        scriptError,
        test,

        _OSInfo: '',
        _logger,
        _newLine: '<br>\r\n'
    }

    function scriptError() {

        this._logger('ERROR', arguments, 'script')
    }

    function error() {

        this._logger('ERROR', arguments)
    }

    function info() {

        this._logger('INFO', arguments)
    }

    function test() {

        var arr = Array.from(arguments);
        arr.unshift('【测试ERROR，请自动忽略】');

        this._logger('ERROR', arr)
    }

    function _logger(level, msgArr, err_type) {
        
        try {

            var app = getApp();
            if (!app || app.OS.platform == "devtools") return;

            var arr = Array.from(msgArr);

            arr.unshift(this.scopeName, {
                AppVersion: app.config.version,
                UID: app.User.extraInfo.openUserId
            }, this._newLine);

            if (err_type == 'script') {

                if (!this._OSInfo) {
                    this._OSInfo = JSON.stringify(app.OS)
                }

                arr.push(this._newLine, this._OSInfo);
            }

            var pages = getCurrentPages();
            if (pages && pages.length) {

                var currPage = pages.reverse()[0];
                arr.push(this._newLine, 
                    '当前页面：', 
                    currPage.route, 
                    this._newLine, 
                    '页面入参：', 
                    currPage.options);
            }

            var message = arr.map(item => {
                return typeof item != 'string' ? JSON.stringify(item) : item;
            }).join('')

            wx.request({
                url: 'https://tac-gw-api.zhongan.com/logRecord/print',
                method: 'POST',
                data: {
                    level,
                    message
                }
            })

        } catch (e) { }
    }

    return logger;
}