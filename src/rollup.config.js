// import uglify from 'rollup-plugin-uglify-es';
// import babel from 'rollup-plugin-babel';

export default {
    input: './framework/index.js',
    output: {
        file: './lib/wxapp.min.js',
        format: 'cjs'
    },
    plugins: [
        // babel({
        //     presets: [[
        //         'es2015',
        //         {
        //             "modules": false
        //         }
        //     ]]
        // }),
        // uglify()
    ]
};