import eslint from '@rollup/plugin-eslint';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import { uglify } from "rollup-plugin-uglify";

export default {
    input: 'src/nwhval.js',
    output: {
        file: 'dist/nwhval.min.js',
        format: 'es',
        name: 'nwhval'
    },
    plugins: [
        resolve({
            jsnext: true,
            main: true,
            browser: true,
        }),
        commonjs(),
        eslint(),
        replace({
            ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
        uglify(),
    ],
}