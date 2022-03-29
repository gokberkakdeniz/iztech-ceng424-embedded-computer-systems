const gulp = require("gulp");
const postcss = require("gulp-postcss");
const htmlmin = require("gulp-htmlmin");
const MemoryFs = require("gulp-memory-fs");
const log = require("fancy-log");
const gulpIf = require("gulp-if");
const replace = require("gulp-replace");
const G = require('generatorics');

function withName(name, fn) {
  fn.displayName = name;

  return fn;
}

function buildCss(src) {
  return gulp.src(src)
    .pipe(postcss());
}

function buildHtml(src) {
  return gulp.src(src)
    .pipe(gulpIf(
      process.env.NODE_ENV === "production",
      htmlmin({ collapseWhitespace: true, html5: true, }))
    );
}

gulp.task("build:css", function () {
  return buildCss("src/*.css")
    .pipe(gulp.dest("../data"));
});

gulp.task("build:html", function () {
  return buildHtml("src/*.html")
    .pipe(gulp.dest("../data"));
});

gulp.task("build", gulp.parallel("build:css", "build:html"));

gulp.task("start", async function () {
  const mfs = new MemoryFs({
    dir: "/",
    port: 8000,
    reload: true,
  });

  function watch() {
    return gulp.watch("src/*")
      .on("change", (path) => {
        log("File changed: " + path);

        if (path.match(/\.css$/)) {
          return buildCss(path).pipe(mfs.dest());
        } else if (path.match(/\.html$/)) {
          return gulp.parallel(
            withName("build:html@mem", () => buildHtml(path).pipe(mfs.dest())),
            withName("build:css@mem", () => buildCss("src/*.css").pipe(mfs.dest()))
          )();
        } else {
          return gulp.src(path).pipe(mfs.dest());
        }
      });
  }

  async function serve() {
    await mfs.createServer();
  }

  return gulp.series(
    gulp.parallel(
      withName("build:html@mem", () => buildHtml("src/*.html").pipe(mfs.dest())),
      withName("build:css@mem", () => buildCss("src/*.css").pipe(mfs.dest())),
    ),
    gulp.parallel(watch, serve)
  )();
});

gulp.task("compress:classnames", async function () {
  const generator = G.baseNAll("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
  const classnames = {};

  function getClassName(classname) {
    if (!classnames[classname]) {
      classnames[classname] = generator.next().value.join('');
    }

    return classnames[classname];
  }

  return gulp.series(
    withName(
      "processHtmlFiles",
      () => gulp.src("../data/*.html")
        .pipe(replace(/class="(.*?)"/g, function handleReplace(match, p1, offset, string) {
          const classes = p1.split(" ").map(cls => getClassName(cls)).join(" ");
          return `class="${classes}"`;
        }))
        .pipe(gulp.dest("../data"))
    ),
    withName(
      "processCSSFiles",
      () => gulp.src("../data/*.css")
        .pipe(replace(/(?<=\.)[a-zA-Z0-9\\_\.-]+(?=\{)/g, function handleReplace(match, p1, offset, string) {
          return classnames[match.replace("\\", "")];
        }))
        .pipe(gulp.dest("../data"))
    ),
  )();
});