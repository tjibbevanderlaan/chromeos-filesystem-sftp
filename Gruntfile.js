"use strict";

module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    var config = {
        app: 'app',
        dist: 'dist',
        tasks: grunt.cli.tasks
    };

    grunt.initConfig({
        config: config,
        watch: {
            cc: {
                files: ['<%= config.app %>/nacl_src/*.cc'],
                tasks: ['make'],
                options: {
                    livereload: true
                }
            },
            h: {
                files: ['<%= config.app %>/nacl_src/*.h'],
                tasks: ['make'],
                options: {
                    livereload: true
                }
            },
            js: {
                files: ['<%= config.app %>/scripts/{,*/}*.js'],
                tasks: ['jshint'],
                options: {
                    livereload: true
                }
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            styles: {
                files: ['<%= config.app %>/styles/{,*/}*.css'],
                tasks: [],
                options: {
                    livereload: true
                }
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '.tmp/styles/{,*/}*.css',
                    '<%= config.app %>/*.html',
                    '<%= config.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                    '<%= config.app %>/manifest.json',
                    '<%= config.app %>/_locales/{,*/}*.json'
                ]
            }
        },
        connect: {
            options: {
                port: 9000,
                livereload: 35729,
                hostname: 'localhost',
                open: true
            },
            server: {
                options: {
                    middleware: function(connect) {
                        return [
                            connect.static('.tmp'),
                            connect().use('/bower_components', connect.static('./bower_components')),
                            connect.static(config.app)
                        ];
                    }
                }
            },
            chrome: {
                options: {
                    open: false,
                    base: [
                        '<%= config.app %>'
                    ]
                }
            },
            test: {
                options: {
                    open: false,
                    base: [
                        'test',
                        '<%= config.app %>'
                    ]
                }
            }
        },
        clean: {
            server: '.tmp',
            chrome: '.tmp',
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= config.dist %>/*',
                        '!<%= config.dist %>/.git*'
                    ]
                }]
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= config.app %>/scripts/{,*/}*.js',
                '!<%= config.app %>/scripts/vendor/*',
                'test/spec/{,*/}*.js'
            ]
        },
        mocha: {
            all: {
                options: {
                    run: true,
                    urls: ['http://localhost:<%= connect.options.port %>/index.html']
                }
            }
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.app %>',
                    dest: '<%= config.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        'images/{,*/}*.png',
                        'styles/{,*/}*.*',
                        '_locales/{,*/}*.json',
                        'newlib/Release/*.{nexe,nmf}'
                    ]
                }]
            }
        },
        concat: {
            dist: {
                src: [
                    '<%= config.app %>/bower_components/cryptojslib/components/core-min.js',
                    '<%= config.app %>/bower_components/cryptojslib/components/enc-base64-min.js',
                    '<%= config.app %>/bower_components/cryptojslib/components/lib-typedarrays-min.js',
                    '<%= config.app %>/scripts/task_queue.js',
                    '<%= config.app %>/scripts/sftp_client.js',
                    '<%= config.app %>/scripts/sftp_fs.js',
                    '<%= config.app %>/scripts/background.js'
                ],
                dest: '<%= config.dist %>/background.js'
            }
        },
        chromeManifest: {
            dist: {
                options: {
                    buildnumber: false,
                    background: {
                        target: 'background.js'
                    }
                },
                src: '<%= config.app %>',
                dest: '<%= config.dist %>'
            }
        },
        compress: {
            dist: {
                options: {
                    archive: function() {
                        var manifest = grunt.file.readJSON('app/manifest.json');
                        return 'package/chromeos-filesystem-sftp-' + manifest.version + '.zip';
                    }
                },
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**'],
                    dest: ''
                }]
            }
        },
        bower: {
            install: {
                options: {
                    targetDir: '<%= config.dist %>/bower_components',
                    verbose: true,
                    install: true
//                    cleanup: true
                }
            }
        },
        shell: {
            make: {
                command: [
                    'cd <%= config.app %>/nacl_src',
                    'make CONFIG=Release',
                    'cd ../..'
                ].join(';')
            }
        },
        vulcanize: {
            main: {
                options: {
                    csp: true,
                    inline: true
                },
                files: {
                    '<%= config.dist %>/window.html': '<%= config.app %>/window.html'
                }
            }
        }
    });

    grunt.registerTask('debug', function (platform) {
        var watch = grunt.config('watch');
        platform = platform || 'chrome';
        if (platform === 'server') {
            watch.styles.tasks = ['newer:copy:styles'];
            watch.styles.options.livereload = false;
        }
        grunt.config('watch', watch);
        grunt.task.run([
            'clean:' + platform,
            'connect:' + platform,
            'watch'
        ]);
    });

    grunt.registerTask('test', [
        'connect:test'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'make',
        'bower:install',
        'concat',
        'chromeManifest:dist',
        'copy',
        'vulcanize',
        'compress'
    ]);

    grunt.registerTask('default', [
        'newer:jshint',
        'test',
        'build'
    ]);

    grunt.registerTask('make', [
        'shell:make'
    ]);
};
