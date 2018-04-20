
// product code
var pcodes = {
    // 国内
    // ch: 'ff633ad8736868f0bc0eaee14f48aa152adeb9ea16b9'
}

// 各环境接口地址
var ENV_API = {
    test: "https://tac-gw-api-itest.zhongan.com/gateway/api",
    uat: "https://tac-gw-api-uat.zhongan.com/gateway/api",
    prd: "https://tac-gw-api.zhongan.com/gateway/api"
}

// 这里添加的属性，可以通过app.config 来访问
var config = {
    version: '10.7.8',
    appId: 'wxd4a90ae9de03335a',
    appName: 'wxapp_delay',
    appDesc: '机场延误险小程序',
    env: 'test', // 在这里切换当前环境
    cdnBase: 'https://tac-cdn.zhongan.com/wxapp/wxapp_delay/20170822_1',
    activityChannel: 201,
    pcodes
};

config.apiBase = ENV_API[config.env];

module.exports = config;