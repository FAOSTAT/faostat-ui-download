define(function() {

    var config = {
        paths: {
            FAOSTAT_UI_DOWNLOAD: 'faostat-ui-download',
            faostat_ui_download: '../'
        },
        shim: {
            FAOSTAT_DOWNLOAD_UI: {
                deps: ['jquery']
            }
        }
    };

    return config;

});