module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        express: {
            capturejs: {
                options: {
                    hostname: '0.0.0.0',
                    port: 3000,
                    base: '.',
                    debug: true
                }
            },
            test: {
                options: {
                    hostname: '0.0.0.0',
                    port: 3001,
                    base: '.',
                    debug: true
                }
            }
        },
        qunit: {
            capturejs: {
              options: {
                timeout: 20000,
                urls: [
                  'http://localhost:3001/tests/index.html',
                ]
              }
            }
        },
        browserify: {
            capturejs: {
                src: ['src/capture.js'],
                dest: 'build/capture.js'
            },
        },
        uglify: {
            capturejs: {
                files: {
                    'build/capture.min.js': ['build/capture.js']
                }
            },
        },
        watch: {
            files: ["src/**/*.js"
            ],
            tasks: ['build'],
        },
        'saucelabs-qunit': {
            capturejs: {
                options: {
                    // Set the Saucelabs username and key in your environment variables
                    // by setting SAUCE_USERNAME and SAUCE_ACCESS_KEY
                    urls: [
                        'http://localhost:3001/tests/index.html'
                    ],
                    testname: 'CaptureJS QUnit Tests',
                    concurrency: 16,
                    tunneled: true,
                    detailedError: true,
                    // Poll for status every 10 seconds for 10 minutes
                    pollInterval: 10000,
                    statusCheckAttempts: 60,
                    // For available browsers and how to configure them see
                    // https://saucelabs.com/docs/platforms and
                    // https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/
                    browsers: [
                        { // IE 10 on Windows 8
                            browserName: 'internet explorer',
                            platform: 'Windows 2012',
                            version: '10'
                        },
                        { // IE 11 on Windows 8.1
                            browserName: 'internet explorer',
                            platform: 'Windows 8.1',
                            version: '11'
                        },
                        { // Latest IE Edge on Windows 10
                            browserName: 'MicrosoftEdge',
                            platform: 'Windows 10'
                        },
                        { // Latest Chrome on Windows 10
                            browserName: 'chrome',
                            platform: 'Windows 10'
                        },
                        { // Latest Chrome on Linux (unknown distro)
                            browserName: 'chrome',
                            platform: 'Linux'
                        },
                        { // Latest Chrome on macOS 10.13
                            browserName: 'chrome',
                            platform: 'macOS 10.13'
                        },
                        { // Lowest known working version of FF
                            platform: 'Windows 10',
                            browserName: 'firefox',
                            version: '4.0'
                        },
                        { // Highest known working version of FF on Windows
                            platform: 'Windows 10',
                            browserName: 'firefox',
                        },
                        {   // Newest iOS simulator as of 2019-04-02
                            browserName: 'ipad',
                            platform: 'macOS 10.13',
                            version: '12.0'
                        },
                        {   // Oldest iOS simulator as of 2019-04-02
                            browserName: 'ipad',
                            platform: 'macOS 10.11',
                            version: '9.3'
                        },
                        {   // Newest iOS simulator as of 2019-04-02
                            browserName: 'iphone',
                            platform: 'macOS 10.13',
                            version: '12.0'
                        },
                        {   // Oldest iOS simulator as of 2019-04-02
                            browserName: 'iphone',
                            platform: 'macOS 10.11',
                            version: '9.3'
                        },
                        { // Android 4.4 Android Browser (simulator)
                            browserName: 'android',
                            platform: 'Linux',
                            version: '4.4'
                        },
                        { // Android 8.0 Chrome? (simulator)
                            browserName: 'android',
                            platform: 'Linux',
                            version: '8.0'
                        },
                    ]
                }
            }
        },
        aws_s3: {
            capturejs: {
                options: {
                    bucket: 'mobify',
                    params: {
                        CacheControl: "public,max-age=1800", // cache for 30 min
                    }
                },
                files: [
                    { // unminified dev build
                        src: ["build/capture.js"],
                        dest: "capturejs/capture-<%= pkg.version %>.js",
                    },
                    { // unminified dev build to latest
                        src: ["build/capture.js"],
                        dest: "capturejs/capture-latest.js",
                    },
                    { // minified production build
                        src: ["build/capture.min.js"],
                        dest: "capturejs/capture-<%= pkg.version %>.min.js",
                    },
                    { // minified production build to latest
                        src: ["build/capture.min.js"],
                        dest: "capturejs/capture-latest.min.js",
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-express');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-aws-s3');
    grunt.loadNpmTasks('grunt-saucelabs');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('build', ['browserify', 'uglify']);
    grunt.registerTask('saucelabs', ['test', 'saucelabs-qunit']);
    grunt.registerTask('test', ['build', 'express:test', 'qunit']);
    grunt.registerTask('test-interactive', ['build', 'express:test', 'watch']);
    grunt.registerTask('serve', ['build', 'express:capturejs', 'watch']);
    grunt.registerTask('deploy', ['build', 'aws_s3']);
};
