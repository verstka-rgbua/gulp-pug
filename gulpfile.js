const gulp = require('gulp');
const gulpPug = require('gulp-pug');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const del = require('del');
const browserSync = require('browser-sync').create();
const gulpImagemin  =  require('gulp-imagemin');
const concat = require('gulp-concat');
const gulpif = require('gulp-if');

const svgSprite = require('gulp-svg-sprite');
const	svgmin = require('gulp-svgmin');
const	cheerio = require('gulp-cheerio');
const	replace = require('gulp-replace');

let isBuildFlag = false;


function clean(){
	return del('dist');
}
function fonts(){
	return gulp.src('dev/static/fonts/**/*.*')
	.pipe(gulp.dest('dist/static/fonts'))
}
function pug3html(){
	return gulp.src('dev/pug/pages/*.pug')
	.pipe(plumber())
	.pipe(gulpPug({
		pretty:true
	}))
	.pipe(plumber.stop())
  .pipe(gulp.dest('dist'))
}
function scss2css(){
	return gulp.src('dev/static/styles/style.scss')
	.pipe(plumber())
	.pipe(sass())
	.pipe(plumber.stop())
	.pipe(cleanCSS({
  level: 2
}))
	.pipe(autoprefixer({ grid: 'autoplace' }))

	.pipe(browserSync.stream())
  .pipe(gulp.dest('dist/static/css'))


}
function script(){
	return gulp.src('dev/static/js/main.js')
	.pipe(babel({
            presets: ['@babel/env']
        }))
	.pipe(gulpif(isBuildFlag, uglify()))
	.pipe(browserSync.stream())
  .pipe(gulp.dest('dist/static/js/'))
}
function vendors(){
	return gulp.src(['node_modules/slick-carousel/slick/slick.min.js'])
	.pipe(concat('libs.js'))

  .pipe(gulp.dest('dist/static/js/libs/'))
}
function imageMin(){
	return gulp.src([
		'dev/static/images/**/*',
		'!dev/static/images/sprite/*'
	])
	.pipe(gulpImagemin([
	gulpImagemin.gifsicle({interlaced: true}),
	gulpImagemin.mozjpeg({quality: 75, progressive: true}),
	gulpImagemin.optipng({optimizationLevel: 5}),
	gulpImagemin.svgo({
		plugins: [
			{removeViewBox: true},
			{cleanupIDs: false}
		]
	})
]))

		.pipe(gulp.dest('dist/static/images/'));

}
 function svgSpriteBuild() {
	return gulp.src('dev/static/images/sprite/*.svg')
	// minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// remove all fill, style and stroke declarations in out shapes
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
			},
			parserOptions: {xmlMode: true}
		}))
		// cheerio plugin create unnecessary string '&gt;', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(svgSprite({
      mode: {
        symbol: {
          sprite: "sprite.svg"
        }
      }
    }))
		.pipe(gulp.dest('dist/static/images/sprite'))

}

function setMod(isBuild){
	return cb=>{
		isBuildFlag = isBuild;
		cb()
	}

}
function watch(){
	browserSync.init({
			server: {
					baseDir: "dist"
			}
	});
	gulp.watch("dev/pug/**/*.pug", pug3html);
	gulp.watch("dev/static/js/main.js", script);
	gulp.watch("dev/static/styles/**/*.scss",scss2css);
	gulp.watch("dev/static/images/**/*",imageMin);
	gulp.watch("dev/static/images/sprite/*",svgSpriteBuild);
  gulp.watch("dist/*.html").on('change', browserSync.reload);
}

const dev = gulp.parallel(fonts,pug3html,scss2css,imageMin,svgSpriteBuild,script,vendors,)
exports.default = gulp.series(clean,dev,watch);
exports.build = gulp.series(clean,setMod(true),dev);
