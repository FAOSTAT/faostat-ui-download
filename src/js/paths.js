/*global define*/
define(function () {

    'use strict';

    return {
        paths: {
            FAOSTAT_UI_DOWNLOAD: 'start',
            faostat_ui_download: '../../'
        },
        shim: {
            bootstrap: {
                deps: ['jquery']
            }
        }
    };

});