var root = '../modules/';
var repository = '//fenixapps.fao.org/repository/js/';

require.config({

    baseUrl: 'js/libs',

    paths: {

        jquery : repository + 'jquery/1.10.2/jquery-1.10.2.min',

        FAOSTAT_BULK_DOWNLOADS: root + 'faostat-bulk-downloads/faostat-bulk-downloads',
        faostat_bulk_downloads: root + 'faostat-bulk-downloads',

        FAOSTAT_DOWNLOAD_OPTIONS: root + 'faostat-download-options/faostat-download-options',
        faostat_download_options: root + 'faostat-download-options',

        FAOSTAT_DOWNLOAD_SUMMARY: root + 'faostat-download-summary-2/faostat-download-summary',
        faostat_download_summary: root + 'faostat-download-summary-2',

        FAOSTAT_DOWNLOAD_SELECTOR: root + 'faostat-download-summary-2/js/modules/faostat-download-selector/faostat-download-selector',
        faostat_download_selector: root + 'faostat-download-summary-2/js/modules/faostat-download-selector',

        FAOSTAT_TREE: root + 'faostat-tree/faostat-tree',
        faostat_tree: root + 'faostat-tree',

        FENIX_UI_METADATA_VIEWER: root + 'fenix-ui-metadata-viewer/fenix-ui-metadata-viewer',
        fenix_ui_metadata_viewer: root + 'fenix-ui-metadata-viewer'

    },

    shim: {

        'faostat_bulk_downloads': {
            deps :['jquery']
        }

    }

});

require(['FAOSTAT_BULK_DOWNLOADS',
         'FAOSTAT_TREE',
         'FAOSTAT_DOWNLOAD_OPTIONS',
         'FAOSTAT_DOWNLOAD_SUMMARY',
         'FENIX_UI_METADATA_VIEWER'], function(BULK, TREE, OPTIONS, SUMMARY, METADATDA) {

    /* Language. */
    var lang = 'S';

    /* Initiate components. */
    var tree = new TREE();
    var bulk = new BULK();
    var options = new OPTIONS();
    var summary = new SUMMARY();
    var metadata = new METADATDA();

    /* Initiate tree. */
    tree.init({
        placeholder_id: 'left_placeholder',
        lang: lang,
        max_label_width: 10
    });

    /* Initiate bulk downloads. */
    bulk.init({
        placeholder_id: 'bulk_downloads_placeholder',
        domain: 'GE',
        lang: lang
    });
    bulk.create_flat_list();

    /* Initiate options. */
    options.init({
        placeholder_id: 'options_placeholder',
        lang: lang
    });

    /* Initiate summary. */
    summary.init({
        placeholder_id: 'options_placeholder',
        lang: lang
    });

    /* Initiate metadata. */
    /* Initiate bulk downloads. */
    metadata.init({
        placeholder_id: 'metadata_placeholder',
        domain: 'GE',
        lang: lang
    });

});