
// product code
var pcodes = {
}

// 各环境接口地址
var ENV_API = {
    test: "",
    uat: "",
    prd: ""
}

// 这里添加的属性，可以通过app.config 来访问
var config = {
    version: '0.0.1',
    appId: '',
    appName: 'wxapp_delay',
    appDesc: '小程序',
    env: 'test', // 在这里切换当前环境
    cdnBase: '',
    activityChannel: '',
    pcodes
};

config.apiBase = ENV_API[config.env];

module.exports = config;
