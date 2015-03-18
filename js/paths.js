define(function() {

    var config = {
        paths: {
            FAOSTAT_DOWNLOAD_UI: 'faostat-download-ui',
            faostat_download_ui: '../'
        },
        shim: {
            FAOSTAT_DOWNLOAD_UI: {
                deps: ['jquery']
            }
        }
    };

    return config;

});