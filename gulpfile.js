const { series, parallel, src, dest } = require('gulp')
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const tsify = require('tsify')
// const ts = require('gulp-typescript')
const watchify = require('watchify')
const fancy_log = require('fancy-log')
const postcss = require('gulp-postcss')
const cssnano = require('cssnano')
// const autoprefixer = require('autoprefixer')
// const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const buffer = require('vinyl-buffer')
const sourcemaps = require('gulp-sourcemaps')

var minifycss = function() {
    const plugins = [
        cssnano(),
        // autoprefixer()
    ]
    return src('app/static/css/app.css')
        .pipe(postcss(plugins))
        .pipe(dest('app/static/dist'))
}

var watch = function() {
    return watchBuild
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write('sourcemap/'))
        .pipe(dest('app/static/dist/'))
}

var watchBuild = browserify({
    basedir: '.',
    debug: true,
    entries: [ 'app/static/start.ts' ],
    cache: {},
    packageCache: {},
    plugin: [ watchify ],
}).plugin(tsify)

var defaultBuild = function() {
    return browserify({
        basedir: '.',
        debug: true,
        entries: [ 'app/static/start.ts' ],
        cache: {},
        packageCache: {},
    })
        .plugin(tsify)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write('sourcemap/'))
        .pipe(dest('app/static/dist/'))
}

watchBuild.on('update', watch)
watchBuild.on('log', fancy_log)

exports.default = parallel(defaultBuild, minifycss)
// exports.default = defaultBuild //series(uglify, cssnano);

exports.watch = series(minifycss, watch)
exports.minifycss = minifycss
