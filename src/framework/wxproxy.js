
const WxProxy = {};

function wrap(key) {
    return function (options = {}) {
        return new Promise(function (resolve, reject) {
            options.success = resolve;
            options.fail = function (res) {
                reject({
                    code: 'wxfail',
                    error: res
                })
            }
            wx[key](options)
        })
    }
}

function wrapSync(key) {
    return function (options) {
        return wx[key](options)
    }
}

for (let key in wx) {
    WxProxy[key] = key.endsWith('Sync') ? wrapSync(key) : wrap(key)
}

export default WxProxy;

// WxProxy.request(options).then(res => {
//     console.log('success')
// }).catch(res => {
//     console.log('fail')
// }).then(res => {
//     console.log('complete')
// })