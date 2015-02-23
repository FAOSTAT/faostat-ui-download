var root = '../../';

require.config({

    baseUrl: 'js/libs',

    paths: {

        FAOSTAT_DOWNLOAD: root + 'faostat-download',
        faostat_download: root

    }

});

require(['FAOSTAT_DOWNLOAD'], function(F3DWLD) {
    var f3dwld = new F3DWLD();
    f3dwld.init({});
});