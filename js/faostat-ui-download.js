define(['jquery',
        'handlebars',
        'text!faostat_ui_download/html/templates.html',
        'i18n!faostat_ui_download/nls/translate',
        'FAOSTAT_UI_COMMONS',
        'FAOSTAT_UI_TREE',
        'bootstrap',
        'sweetAlert',
        'amplify'], function ($, Handlebars, templates, translate, Commons, TREE) {

    'use strict';

    function DWLD() {

        this.CONFIG = {
            lang: 'en',
            group: null,
            domain: null,
            lang_faostat: 'E',
            prefix: 'faostat_ui_download_',
            placeholder_id: 'faostat_ui_download'
        };

    }

    DWLD.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang != null ? this.CONFIG.lang : 'en';

        /* Store FAOSTAT language. */
        this.CONFIG.lang_faostat = Commons.iso2faostat(this.CONFIG.lang);

        /* This... */
        var _this = this;

        /* Load template. */
        var source = $(templates).filter('#faostat_ui_download_structure').html();
        var template = Handlebars.compile(source);
        var dynamic_data = {};
        var html = template(dynamic_data);
        $('#' + this.CONFIG.placeholder_id).html(html);

        /* Initiate tree. */
        var tree = new TREE();
        tree.init({
            lang: this.CONFIG.lang,
            group: this.CONFIG.group,
            domain: this.CONFIG.domain,
            placeholder_id: 'left_placeholder'
        });

        /* Bind UI creation on domain leaf click. */
        tree.onDomainClick(function(id) {
            _this.load_faostat_domain_ui(id)
        });

    };

    DWLD.prototype.load_faostat_domain_ui = function(domain_code) {

        /* This... */
        var _this = this;

        require(['FAOSTAT_UI_BULK_DOWNLOADS',
                 'FENIX_UI_DOWNLOAD_OPTIONS',
                 'FENIX_UI_METADATA_VIEWER',
                 'FAOSTAT_UI_DOWNLOAD_SELECTORS_MANAGER'], function(BULK, OPTIONS, METADATDA, SELECTOR_MGR) {

            /* Bulk downloads. */
            var bulk = new BULK();
            bulk.init({
                lang: _this.CONFIG.lang,
                domain: _this.CONFIG.domain,
                placeholder_id: 'bulk_downloads_placeholder'
            });
            bulk.create_flat_list();

            /* Download options. */
            var download_options = new OPTIONS();
            download_options.init({
                lang: _this.CONFIG.lang,
                prefix: _this.CONFIG.prefix + 'download_',
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

            /* Preview options. */
            var preview_options = new OPTIONS();
            preview_options.init({
                lang: _this.CONFIG.lang,
                ok_button: true,
                csv_button: false,
                pdf_button: false,
                excel_button: false,
                prefix: _this.CONFIG.prefix + 'preview_',
                button_label: 'Preview Options',
                header_label: 'Preview Options',
                placeholder_id: 'preview_options_placeholder'
            });
            preview_options.show_as_modal_window();

            /* Metadata. */
            var metadata = new METADATDA();
            metadata.init({
                lang: _this.CONFIG.lang,
                domain: _this.CONFIG.domain,
                group: _this.CONFIG.group,
                placeholder_id: 'metadata_placeholder'
            });

            /* Download selectors manager. */
            var selector_mgr = new SELECTOR_MGR();
            selector_mgr.init({
                lang: _this.CONFIG.lang,
                domain: _this.CONFIG.domain,
                prefix: 'faostat_selectors_',
                datasource: 'faostatdb',
                placeholder_id: 'selectors_placeholder'
            });

        });

    };

    return DWLD;

});