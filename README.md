# capture.js

A library for capturing your DOM.

[![npm version](https://badge.fury.io/js/mobify-capturejs.svg)](http://badge.fury.io/js/mobify-capturejs)

## How to use

Right now, there are no instructions on how to use capture.js standalone. Please
go to www.mobifyjs.com for information on how to use capturing.

## How to create and ship a change

### Install the dependencies:

Get NodeJS v8.10 with npm v5.7: https://nodejs.org/en/download/

```bash
npm install
$(npm bin)/bower install
```

### Run the build with a watcher

Then, run the following command to watch and build the capture.js file as you
develop:

```bash
$(npm bin)/grunt serve
```

### Running tests

To run the tests in your browser

```
$(npm bin)/grunt serve
open http://localhost:3000/tests/index.html
```

To run the tests from the comamndline

```
$(npm bin)/grunt test
```

To run the tests across several browsers using suacelabs
```
export SAUCE_USERNAME=<saucelabs username>
export SAUCE_ACCESS_KEY=<saucelabs access key>
$(npm bin)/grunt saucelabs
```
You can monitor test progress via the suacelabs dashbaord: 
[https://app.saucelabs.com/dashboard/tests](https://app.saucelabs.com/dashboard/tests)

The test suite will likely take several minutes to run across the test matrix
defined in `Gruntfile.js`

Then, do the following to ship the change:

* Make your code changes
* Ensure the tests still work in your browser, on the commandline, in 
  continuous integration and in Sauce Labs
* Create a pull-request
* Get your change reviewed and :+1:'ed

## Where to get help

Talk to @stellafang, @noahadams or @johnboxall
