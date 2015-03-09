var root = '../modules/';
var repository = '//fenixapps.fao.org/repository/js/';
var wds = 'http://faostat3.fao.org/wds/';

require.config({

    baseUrl: 'js/libs',

    paths: {

        jquery : repository + 'jquery/1.10.2/jquery-1.10.2.min',
        'bootstrap': repository + 'bootstrap/3.2/js/bootstrap.min',

        FAOSTAT_BULK_DOWNLOADS: root + 'faostat-bulk-downloads/faostat-bulk-downloads',
        faostat_bulk_downloads: root + 'faostat-bulk-downloads',

        FAOSTAT_DOWNLOAD_OPTIONS: root + 'faostat-download-options/faostat-download-options',
        faostat_download_options: root + 'faostat-download-options',

        FAOSTAT_DOWNLOAD_SELECTOR: root + 'faostat-selector/faostat-download-selector',
        faostat_download_selector: root + 'faostat-selector',

        FAOSTAT_TREE: root + 'faostat-tree/faostat-tree',
        faostat_tree: root + 'faostat-tree',

        FENIX_UI_METADATA_VIEWER: root + 'fenix-ui-metadata-viewer/fenix-ui-metadata-viewer',
        fenix_ui_metadata_viewer: root + 'fenix-ui-metadata-viewer'

    },

    shim: {

        'bootstrap': {
            deps :['jquery']
        },

        'faostat_bulk_downloads': {
            deps :['jquery']
        }

    }

});

require(['FAOSTAT_BULK_DOWNLOADS',
         'FAOSTAT_TREE',
         'FAOSTAT_DOWNLOAD_OPTIONS',
         'FENIX_UI_METADATA_VIEWER',
         'FAOSTAT_DOWNLOAD_SELECTOR'], function(BULK, TREE, OPTIONS, METADATDA, SELECTOR) {

    /* Language. */
    var lang = 'S';
    var domain = 'GE';
    var datasource = 'faostat';
    var prefix = 'faostat_download_';

    /* Initiate components. */
    var tree = new TREE();
    var bulk = new BULK();
    var options = new OPTIONS();
    var metadata = new METADATDA();
    var selector_1 = new SELECTOR();

    /* Initiate tree. */
    tree.init({
        placeholder_id: 'left_placeholder',
        lang: lang,
        max_label_width: 10
    });

    /* Initiate bulk downloads. */
    bulk.init({
        placeholder_id: 'bulk_downloads_placeholder',
        domain: domain,
        lang: lang
    });
    bulk.create_flat_list();

    /* Initiate options. */
    options.init({
        placeholder_id: 'options_placeholder',
        lang: lang,
        prefix: prefix
    });
    options.show_as_modal_window();

    /* Initiate metadata. */
    metadata.init({
        placeholder_id: 'metadata_placeholder',
        domain: domain,
        lang: lang,
        view_type: 'accordion'
    });

    /* Initiate selector. */
    var rest_1 = wds + 'rest/procedures/usp_GetListBox/' + datasource + '/' + domain + '/1/1/' + lang;
    var rest_2 = wds + 'rest/procedures/usp_GetListBox/' + datasource + '/' + domain + '/1/2/' + lang;
    selector_1.init({
        lang: lang,
        placeholder_id: 'selector_1_placeholder',
        suffix: 'area',
        tabs :   [
            {label: 'Country', rest: rest_1},
            {label: 'Group', rest: rest_2}
        ]
    });

});