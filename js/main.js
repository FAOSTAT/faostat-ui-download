require(['../js/modules/fenix-ui-common/js/Compiler',
         '../js/modules/faostat-tree/js/paths',
         '../js/modules/faostat-bulk-downloads/js/paths',
         '../js/modules/faostat-download-options/js/paths'
        ], function(Compiler, TREE, BULK, OPTIONS) {

    var treeConfig = TREE;
    treeConfig['baseUrl'] = 'js/modules/faostat-tree/js';

    var bulkConfig = BULK;
    bulkConfig['baseUrl'] = 'js/modules/faostat-bulk-downloads/js';

    var optionsConfig = OPTIONS;
    optionsConfig['baseUrl'] = 'js/modules/faostat-download-options/js';

    Compiler.resolve([treeConfig, bulkConfig, optionsConfig],
        {
            placeholders: {
               FENIX_CDN: '//fenixapps.fao.org/repository'
            },
            config: {
                locale: 'en',
                baseUrl: './',
                paths: {
                    jquery: '{FENIX_CDN}/js/jquery/2.1.1/jquery.min',
                    amplify : '{FENIX_CDN}/js/amplify/1.1.2/amplify.min',
                    jstree: '{FENIX_CDN}/js/jstree/3.0.8/dist/jstree.min',
                    i18n: '{FENIX_CDN}/js/requirejs/plugins/i18n/2.0.4/i18n',
                    handlebars: '{FENIX_CDN}/js/handlebars/2.0.0/handlebars',
                    text: '{FENIX_CDN}/js/requirejs/plugins/text/2.0.12/text',
                    sweetAlert: '{FENIX_CDN}/js/sweet-alert/0.4.2/sweet-alert',
                    bootstrap: '{FENIX_CDN}/js/bootstrap/3.3.2/js/bootstrap.min',
                    domReady: '{FENIX_CDN}/js/requirejs/plugins/domready/2.0.1/domReady'
                },
                shim: {
                    handlebars: {
                        exports: 'Handlebars'
                    },
                    amplify: {
                        deps: ['jquery'],
                        exports: 'amplifyjs'
                    }
                }
            }
        }
    );

    require(['js/application'], function(APP) {

        /* Initiate components. */
        var app = new APP();

        /* Common settings. */
        var lang = 'E';
        var domain = 'GT';
        var prefix = 'faostat_download_';

        /* Initiate application and modules. */
        app.init();

    });

});