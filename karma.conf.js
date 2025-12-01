// karma.conf.js
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-coverage'),
      require('karma-jasmine-html-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    client: {
      // Mantiene visible el runner de Jasmine en el navegador
      jasmine: {
				// you can add configuration options for Jasmine here
				// the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
				// for example, you can disable the random execution with `random: false`
				// or set a specific seed with `seed: 4321`
			},
      clearContext: false
    },
    jasmineHtmlReporter: {
			suppressAll: true, // removes the duplicated traces
		},

    coverageReporter: {
      // Carpeta de salida: ./coverage
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },

    // Muestra progreso en consola y el reporte HTML de Jasmine
    reporters: ['progress', 'kjhtml'],

    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
			ChromeHeadlessNoSandbox: {
				base: 'ChromeHeadless',
				flags: ['--no-sandbox'],
			},
		},

    // Ejecuta una Ãºnica vez
    singleRun: true,
		restartOnFileChange: true,
    autoWatch: false,

    port: 9876,
		colors: true,

    // Tiempo de espera para arrancar el browser
    browserNoActivityTimeout: 60000,

    // Nivel de logs
    logLevel: config.LOG_INFO
  });
};