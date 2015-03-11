require(['../js/modules/fenix-ui-common/js/Compiler',
         '../js/modules/faostat-tree/js/paths'
        ], function(Compiler, TREE) {

    var treeConfig = TREE;
    treeConfig['baseUrl'] = 'js/modules/faostat-tree/js';

    Compiler.resolve([treeConfig],
        {
            placeholders: {
               FENIX_CDN: '//fenixapps.fao.org/repository'
            },
            config: {
                locale: 'en',
                baseUrl: './',
                paths: {
                    jquery: '{FENIX_CDN}/js/jquery/2.1.1/jquery.min',
                    jstree: '{FENIX_CDN}/js/jstree/3.0.8/dist/jstree.min',
                    'sweet-alert': 'js/libs/sweet-alert',
                    handlebars: '{FENIX_CDN}/js/handlebars/2.0.0/handlebars',
                    amplify : '{FENIX_CDN}/js/amplify/1.1.2/amplify.min'
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

        /* Initiate tree. */
        app.init({
            lang: lang,
            tree: {
                lang: lang,
                placeholder_id: 'left_placeholder'
            }
        });

    });

});