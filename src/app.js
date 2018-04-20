
const AppBase = require('./lib/wxapp.min').AppBase;
const appconfig = require('./app.config');

const app = AppBase(appconfig).extend({

    onLaunch(options) {
        // console.log('launch')
    },

    onShow(options) {
        // console.log('onShow')
    }
})

App(app)