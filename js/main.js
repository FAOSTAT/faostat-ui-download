var root = '../modules/';
var repository = '//fenixapps.fao.org/repository/js/';

require.config({

    baseUrl: 'js/libs',

    paths: {

        //FAOSTAT_BULK_DOWNLOADS: root + 'faostat-bulk-downloads/faostat-bulk-downloads',
        //faostat_bulk_downloads: root + 'faostat-bulk-downloads',
        //
        //FAOSTAT_DOWNLOAD_OPTIONS: root + 'faostat-download-options/faostat-download-options',
        //faostat_download_options: root + 'faostat-download-options',
        //
        //FAOSTAT_DOWNLOAD_SUMMARY: root + 'faostat-download-summary/faostat-download-summary',
        //faostat_download_summary: root + 'faostat-download-summary',

        FAOSTAT_TREE: root + 'faostat-tree/faostat-tree',
        faostat_tree: root + 'faostat-tree'

    }

});

require(['FAOSTAT_TREE'], function(TREE) {
    console.log('hallo');
    var tree = new TREE();
    tree.init({
        placeholder_id: 'left_placeholder'
    });
});