module.exports = function (grunt) {

    //Initializing the configuration object
    grunt.initConfig({

        // get the configuration info from package.json ----------------------------
        // this way we can use things like name and version (pkg.name)
        pkg: grunt.file.readJSON('package.json'),

        // Task configuration
        concat: {
            options: {
            },
            libs: {
                src: [
                    './bower_components/draw2d/dist/shifty.js',
                    './bower_components/draw2d/dist/patched_raphael.js',
                    './bower_components/jquery/jquery.min.js',
                    './bower_components/draw2d/dist/jquery.autoresize.js',
                    './bower_components/draw2d/dist/jquery.contextmenu.js',
                    './bower_components/draw2d/dist/rgbcolor.js',
                    './bower_components/draw2d/dist/patched_canvg.js',
                    './bower_components/draw2d/dist/patched_Class.js',
                    './bower_components/draw2d/dist/json2.js',
                    './bower_components/draw2d/dist/pathfinding-browser.min.js',
                    './bower_components/draw2d/dist/draw2d.js',
                    './lib/jquery.browser.js',
                    './bower_components/jquery-ui/ui/minified/jquery-ui.min.js',
                    // must be after jquery-ui
                    './bower_components/draw2d/dist/jquery-touch_punch.js',
                    './lib/jquery.bootstrap-growl.js',
                    './bower_components/mousetrap/mousetrap.min.js',
                    './bower_components/remarkable/dist/remarkable.min.js',
                    './bower_components/bootstrap/dist/js/bootstrap.min.js',
                    './bower_components/bootstrap-touchspin/dist/jquery.bootstrap-touchspin.min.js',
                    './bower_components/bootstrap-toggle/js/bootstrap-toggle.min.js',
                    './bower_components/jsts/lib/javascript.util.js',
                    './bower_components/jsts/lib/jsts.js',
                    './bower_components/anglepicker/ui.anglepicker.js',
                    './bower_components/bootbox/bootbox.js',
                    './bower_components/hogan/web/1.0.0/hogan.min.js',
                    './bower_components/octokat/dist/octokat.js',
                    './bower_components/toastr/toastr.min.js',
                    './lib/Blob.js'
                ],
                dest: './dist/assets/javascript/dependencies.js'
            },
            application: {
                src: [

                    './src/assets/javascript/hardware/raspi.js',
                    './src/assets/javascript/polyfill.js',
                    './src/assets/javascript/Configuration.js',
                    './src/assets/javascript/Application.js',
                    './src/assets/javascript/View.js',
                    './src/assets/javascript/Layer.js',
                    './src/assets/javascript/FilterPane.js',
                    './src/assets/javascript/Toolbar.js',
                    './src/assets/javascript/Breadcrumb.js',

                    './src/assets/javascript/dialog/About.js',
                    './src/assets/javascript/dialog/FigureTest.js',
                    './src/assets/javascript/dialog/FigureMarkdownEdit.js',
                    './src/assets/javascript/dialog/FigureCodeExport.js',
                    './src/assets/javascript/dialog/FigureCodeEdit.js',
                    './src/assets/javascript/dialog/FileOpen.js',
                    './src/assets/javascript/dialog/FileSave.js',
                    './src/assets/javascript/dialog/FileSaveAs.js',
                    './src/assets/javascript/dialog/ShapeSettings.js',

                    './src/assets/javascript/filter/Filter.js',
                    './src/assets/javascript/filter/FanoutFilter.js',
                    './src/assets/javascript/filter/StrokeFilter.js',
                    './src/assets/javascript/filter/SizeFilter.js',
                    './src/assets/javascript/filter/OutlineStrokeFilter.js',
                    './src/assets/javascript/filter/BlurFilter.js',
                    './src/assets/javascript/filter/FillColorFilter.js',
                    './src/assets/javascript/filter/FontColorFilter.js',
                    './src/assets/javascript/filter/FontSizeFilter.js',
                    './src/assets/javascript/filter/OpacityFilter.js',
                    './src/assets/javascript/filter/LinearGradientFilter.js',
                    './src/assets/javascript/filter/TextLinearGradientFilter.js',
                    './src/assets/javascript/filter/PortTypeFilter.js',
                    './src/assets/javascript/filter/PortDirectionFilter.js',
                    './src/assets/javascript/filter/PositionFilter.js',
                    './src/assets/javascript/filter/RadiusFilter.js',

                    './src/assets/javascript/figure/DecoratedInputPort.js',
                    './src/assets/javascript/figure/MarkerFigure.js',
                    './src/assets/javascript/figure/MarkerStateAFigure.js',
                    './src/assets/javascript/figure/MarkerStateBFigure.js',
                    './src/assets/javascript/figure/TestSwitch.js',
                    './src/assets/javascript/figure/ExtLabel.js',
                    './src/assets/javascript/figure/ExtPolygon.js',
                    './src/assets/javascript/figure/ExtPort.js',
                    './src/assets/javascript/figure/ExtLine.js',
                    './src/assets/javascript/figure/PolyRect.js',
                    './src/assets/javascript/figure/PolyCircle.js',

                    './src/assets/javascript/io/BackendStorage.js',

                    './src/assets/javascript/io/FigureWriter.js',

                    './src/assets/javascript/policy/AbstractToolPolicy.js',
                    './src/assets/javascript/policy/AbstractGeoToolPolicy.js',
                    './src/assets/javascript/policy/GeoUnionToolPolicy.js',
                    './src/assets/javascript/policy/GeoDifferenceToolPolicy.js',
                    './src/assets/javascript/policy/GeoIntersectionToolPolicy.js',
                    './src/assets/javascript/policy/SelectionToolPolicy.js',
                    './src/assets/javascript/policy/RectangleToolPolicy.js',
                    './src/assets/javascript/policy/CircleToolPolicy.js',
                    './src/assets/javascript/policy/TextToolPolicy.js',
                    './src/assets/javascript/policy/PortToolPolicy.js',
                    './src/assets/javascript/policy/LineToolPolicy.js'
                ],
                dest: './dist/assets/javascript/app.js'
            },
            css:{
                src:[
                    './src/assets/stylesheets/application.css',
                    './bower_components/toastr/toastr.min.css',
                    './bower_components/anglepicker/ui.anglepicker.css',
                    './bower_components/bootstrap-touchspin/dist/jquery.bootstrap-touchspin.min.css',
                    './bower_components/bootstrap-toggle/css/bootstrap-toggle.min.css'
                ],
                dest: './dist/assets/stylesheets/application.css'
            }
        },

        copy: {
            application: {
                expand: true,
                cwd: 'src/',
                src: ['**/*.html', 'assets/images/**/*', 'assets/shapes/**/*'],
                dest: 'dist/'
            },
            awesome:{
                expand: true,
                cwd: 'bower_components/components-font-awesome/',
                src: ['./css/font-awesome.css','./fonts/*'],
                dest: './dist/lib/awesome'
            },
            ace:{
                expand: true,
                cwd: 'bower_components/ace/lib/ace',
                src: ['**/*'],
                dest: './dist/lib/ace'
            },
            jscolor:{
                expand: true,
                cwd: 'bower_components/jscolor/',
                src: ['**/*'],
                dest: './dist/lib/jscolor'
            },
            ionicons:{
                expand: true,
                cwd: 'bower_components/Ionicons/',
                src: ['./css/*', "./fonts/*"],
                dest: './dist/lib/ionicons'
            },
            jquery:{
                expand: true,
                cwd: 'bower_components/jquery-ui/themes/eggplant',
                src: ['**/*'],
                dest: 'dist/lib/jquery-ui'
            },
            bootstrap:{
                expand: true,
                cwd: 'bower_components/bootstrap/dist',
                src: ['**/*'],
                dest: 'dist/lib/bootstrap'
            },
            prettify:{
                expand: true,
                cwd: 'bower_components/google-code-prettify/',
                src: ['**/*'],
                dest: 'dist/lib/prettify'
            }
        },

        less: {
            development: {
                options: {
                    compress: false
                },
                files: {
                    "./dist/assets/stylesheets/main.css": [
                        "./src/assets/less/main.less",
                        "./src/assets/less/canvas.less",
                        "./src/assets/less/toolbar.less",
                        "./src/assets/less/layer.less",
                        "./src/assets/less/dialog_code.less",
                        "./src/assets/less/dialog_export.less",
                        "./src/assets/less/dialog_test.less",
                        "./src/assets/less/filter.less",
                        "./src/assets/less/markdown_dialog.less",
                        "./src/assets/less/file_dialog.less",
                        "./src/assets/less/file_open_dialog.less",
                        "./src/assets/less/file_save_dialog.less",
                        "./src/assets/less/file_saveas_dialog.less",
                        "./src/assets/less/breadcrumb.less"
                    ]
                }
            }
        },

        // configure jshint to validate js files -----------------------------------
        jshint: {
            options: {
                reporter: require('jshint-stylish') // use jshint-stylish to make our errors look and read good
            },

            // when this task is run, lint the Gruntfile and all js files in src
            build: ['Grunfile.js', 'src/**/*.js']
        },

        watch: {
            html: {
                files: [
                    './src/**/*.html',
                    './src/**/*.css'
                ],
                tasks: ['concat:css','copy']
            },
            js: {
                files: [
                    './src/assets/javascript/**/*.js'
                ],
                tasks: ['concat:application'],
                options: {
                    livereload: true
                }
            },

            less: {
                files: [
                    "./src/assets/less/**/*.less"
                ],
                tasks: ['less'],
                options: {
                    livereload: true
                }
            }
        },
        'gh-pages': {
            options: {
                base: 'dist'

            },
            src: ['**']
        }
    });

    // Plugin loading
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-gh-pages');

    // Task definition
    grunt.registerTask('default', ['jshint', 'concat', 'less', 'copy']);
    grunt.registerTask('publish', ['jshint', 'concat', 'less', 'copy', 'gh-pages']);


};

