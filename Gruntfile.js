module.exports = function(grunt) {

    grunt.initConfig({
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
                        { // Highest FF on OSX
                            browserName: 'firefox',
                            platform: 'Mac 10.6',
                            version: '14.0'
                        },
                        { // Lowest iPad on OSX (simulator)
                            browserName: 'ipad',
                            platform: 'Mac 10.6',
                            version: '4.3'
                        },
                        { // Highest iPad on OSX (simulator)
                          // NOTE: iOS 6 is available, but it hangs on SauceLabs...
                            browserName: 'ipad',
                            platform: 'Mac 10.6',
                            version: '5'
                        },
                        { // Lowest iPhone on OSX (simulator)
                            browserName: 'iphone',
                            platform: 'Mac 10.6',
                            version: '4.3'
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
                    ], // https://saucelabs.com/docs/browsers
                    onTestComplete: function(){
                        // Called after a qunit unit is done, per page, per browser
                        // Return true or false, passes or fails the test
                        // Returning undefined does not alter the test result

                        // For async return, call
                        var done = this.async();
                        setTimeout(function(){
                            // Return to this test after 1000 milliseconds
                            done(/*true or false changes the test result, undefined does not alter the result*/);
                        }, 1000);
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-express');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-saucelabs');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('build', ['browserify', 'uglify']);
    grunt.registerTask('saucelabs', ['test', 'saucelabs-qunit']);
    grunt.registerTask('test', ['express', 'qunit']);
    grunt.registerTask('serve', ['build', 'express', 'watch']);
};
