var root = '../modules/';
var repository = '//fenixapps.fao.org/repository/js/';
var wds = 'http://faostat3.fao.org/wds/';

require.config({

    baseUrl: 'js/libs',

    paths: {

        jquery : repository + 'jquery/1.10.2/jquery-1.10.2.min',
        bootstrap: repository + 'bootstrap/3.2/js/bootstrap.min',
        amplify: repository + 'amplify/1.1.2/amplify.min',

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
    var download_options = new OPTIONS();
    var preview_options = new OPTIONS();
    var metadata = new METADATDA();
    var selector_1 = new SELECTOR();
    var selector_2 = new SELECTOR();
    var selector_3 = new SELECTOR();
    var selector_4 = new SELECTOR();

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

    /* Initiate download options. */
    download_options.init({
        lang: lang,
        prefix: prefix + 'download_',
        placeholder_id: 'download_options_placeholder'
    });
    download_options.show_as_modal_window();
    download_options.onDownload({
        foo: 'bar'
    },function(user_selection, data) {
        switch (user_selection.output_format) {
            default:
                console.log(user_selection.output_format);
                console.log(user_selection);
                console.log(data);
                break;
        }
    });


    /* Initiate preview options. */
    preview_options.init({
        placeholder_id: 'preview_options_placeholder',
        lang: lang,
        prefix: prefix + 'preview_',
        csv_button: false,
        excel_button: false,
        pdf_button: false,
        ok_button: true,
        button_label: 'Preview Options',
        header_label: 'Preview Options'
    });
    preview_options.show_as_modal_window();

    /* Initiate metadata. */
    metadata.init({
        placeholder_id: 'metadata_placeholder',
        domain: domain,
        lang: lang,
        view_type: 'accordion'
    });

    /* Initiate selector 1. */
    var rest_1_1 = wds + 'rest/procedures/usp_GetListBox/' + datasource + '/' + domain + '/1/1/' + lang;
    var rest_1_2 = wds + 'rest/procedures/usp_GetListBox/' + datasource + '/' + domain + '/1/2/' + lang;
    var rest_1_3 = wds + 'rest/procedures/usp_GetListBox/' + datasource + '/' + domain + '/1/3/' + lang;
    selector_1.init({
        lang: lang,
        placeholder_id: 'selector_1_placeholder',
        suffix: 'area',
        tabs :   [
            {label: 'Countries', rest: rest_1_1},
            {label: 'Regions', rest: rest_1_2},
            {label: 'Special Groups', rest: rest_1_3}
        ]
    });

    /* Initiate selector 2. */
    var rest_2_1 = wds + 'rest/procedures/usp_GetListBox/' + datasource + '/' + domain + '/2/1/' + lang;
    selector_2.init({
        lang: lang,
        placeholder_id: 'selector_2_placeholder',
        suffix: 'element',
        tabs :   [
            {label: 'Elements', rest: rest_2_1}
        ]
    });

    /* Initiate selector 3. */
    var rest_3_1 = wds + 'rest/procedures/usp_GetListBox/' + datasource + '/' + domain + '/3/1/' + lang;
    var rest_3_2 = wds + 'rest/procedures/usp_GetListBox/' + datasource + '/' + domain + '/3/2/' + lang;
    selector_3.init({
        lang: lang,
        placeholder_id: 'selector_3_placeholder',
        suffix: 'item',
        tabs :   [
            {label: 'Items', rest: rest_3_1},
            {label: 'Item Aggregated', rest: rest_3_2}
        ]
    });

    /* Initiate selector 4. */
    var rest_4_1 = wds + 'rest/procedures/usp_GetListBox/' + datasource + '/' + domain + '/4/1/' + lang;
    var rest_4_2 = wds + 'rest/procedures/usp_GetListBox/' + datasource + '/' + domain + '/4/2/' + lang;
    selector_4.init({
        lang: lang,
        placeholder_id: 'selector_4_placeholder',
        suffix: 'year',
        tabs :   [
            {label: 'Years', rest: rest_4_1},
            {label: 'Year Projections', rest: rest_4_2}
        ]
    });

});