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
            }
        },
        qunit: {
            capturejs: {
              options: {
                timeout: 20000,
                urls: [
                  'http://localhost:3000/tests/index.html',
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
                        'http://localhost:3000/tests/index.html'
                    ],
                    concurrency: 16,
                    tunneled: true,
                    detailedError: true,
                    browsers: [ //https://saucelabs.com/docs/platforms
                        { // Only working version of IE compatable
                            browserName: 'internet explorer',
                            platform: 'Windows 2012',
                            version: '10'
                        },
                        { // Only working version of IE compatable
                            browserName: 'internet explorer',
                            platform: 'Windows 8.1',
                            version: '11'
                        },
                        { // Lowest known working version of FF
                            browserName: 'opera',
                            platform: 'Windows 2003',
                            version: '11'
                        },
                        { // Highest known working version of Opera
                            browserName: 'opera',
                            platform: 'Windows 2008',
                            version: '12'
                        },
                        { // Latest Chrome on Windows XP
                            browserName: 'chrome',
                            platform: 'Windows 2003'
                        },
                        { // Latest Chrome on Windows 7
                            browserName: 'chrome',
                            platform: 'Windows 2008'
                        },
                        { // Latest Chrome on Linux (unknown distro)
                            browserName: 'chrome',
                            platform: 'Linux'
                        },
                        { // Latest Chrome on Linux (unknown distro)
                            browserName: 'chrome',
                            platform: 'OS X 10.8'
                        },
                        { // Lowest known working version of FF
                            browserName: 'firefox',
                            version: '4.0'
                        },
                        { // Highest known working version of FF on Windows
                            browserName: 'firefox',
                            version: '18.0'
                        },
                        {
                            browserName: 'ipad',
                            platform: 'OS X 10.10',
                            version: '9.0'
                        },
                        {
                            browserName: 'ipad',
                            platform: 'OS X 10.10',
                            version: '8.4'
                        },
                        {
                            browserName: 'iphone',
                            platform: 'OS X 10.10',
                            version: '9.0'
                        },
                        {
                            browserName: 'iphone',
                            platform: 'OS X 10.10',
                            version: '8.4'
                        },
                        {
                          // NOTE: iOS 6 is available, but it hangs on SauceLabs...
                            browserName: 'ipad',
                            platform: 'Mac 10.6',
                            version: '5'
                        },
                        { // Highest iPhone on OSX (simulator)
                          // NOTE: iOS 6 is available, but it hangs on SauceLabs...
                            browserName: 'iphone',
                            platform: 'Mac 10.6',
                            version: '5'
                        },
                        { // Android 4.0 (simulator)
                            browserName: 'android',
                            platform: 'Linux',
                            version: '4'
                        }
                    ] // https://saucelabs.com/docs/browsers
                }
            }
        },
        s3: {
            options: {
                access: "public-read",
                headers: { "Cache-Control": "public,max-age=1800" }, // cache for 30 min
                maxOperations: 6
            },
            capturejs: {
                options: {
                    bucket: 'mobify',
                    gzip: true
                },
                upload: [
                    { // unminified dev build
                        src: "build/capture.js",
                        dest: "capturejs/capture-<%= pkg.version %>.js",
                    },
                    { // unminified dev build to latest
                        src: "build/capture.js",
                        dest: "capturejs/capture-latest.js",
                    },
                    { // minified production build
                        src: "build/capture.min.js",
                        dest: "capturejs/capture-<%= pkg.version %>.min.js",
                    },
                    { // minified production build to latest
                        src: "build/capture.min.js",
                        dest: "capturejs/capture-latest.min.js",
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-express');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-saucelabs');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-s3');

    grunt.registerTask('build', ['browserify', 'uglify']);
    grunt.registerTask('saucelabs', ['test', 'saucelabs-qunit']);
    grunt.registerTask('test', ['build', 'express', 'qunit']);
    grunt.registerTask('serve', ['build', 'express', 'watch']);
    grunt.registerTask('deploy', ['s3']);
};
