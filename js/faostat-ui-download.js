define(['jquery',
        'handlebars',
        'text!faostat_ui_download/html/templates.hbs',
        'i18n!faostat_ui_download/nls/translate',
        'faostat_commons',
        'FAOSTAT_UI_TREE',
        'pivot',
        'pivotRenderers',
        'pivotAggregators',
        'submodules/faostat-ui-download/submodules/fenix-ui-olap/config/dataConfig',
        'bootstrap',
        'sweetAlert',
        'amplify'], function ($, Handlebars, templates, translate, FAOSTATCommons, TREE,
                              pivot, pivotRenderers, pivotAggregators, dataConfig) {

    'use strict';

    function DWLD() {

        this.CONFIG = {
            lang: 'en',
            group: null,
            domain: null,
            lang_faostat: 'E',
            datasource: 'faostatdb',
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
        this.CONFIG.lang_faostat = FAOSTATCommons.iso2faostat(this.CONFIG.lang);

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
            placeholder_id: 'left_placeholder',
            callback: {
                onGroupClick: function(config) {
                    Backbone.history.navigate('/' + _this.CONFIG.lang +
                                              '/download/' + _this.CONFIG.group.toUpperCase(), {trigger: false});
                    _this.load_faostat_group_ui(config.id)
                },
                onDomainClick: function(config) {
                    Backbone.history.navigate('/' + _this.CONFIG.lang +
                                              '/download/' + _this.CONFIG.group.toUpperCase() +
                                              '/' + config.id.toUpperCase() +
                                              '/' + _this.CONFIG.section, {trigger: false});
                    _this.load_faostat_domain_ui(config.id)
                }
            }
        });

    };

    DWLD.prototype.load_faostat_group_ui = function(group_code) {

        /* Implementation of the language change from the main menu. */
        amplify.subscribe('language_event', function(data) {
            Backbone.history.navigate('/' + data.language +
                                      '/download/' + _this.CONFIG.group.toUpperCase(), {trigger: true});
        });

        /* Highlight selected language. */
        $('#' + this.CONFIG.lang + '_language_selector').css('text-decoration', 'underline');

        /* Load template. */
        var source = $(templates).filter('#faostat_ui_download_group').html();
        var template = Handlebars.compile(source);
        var dynamic_data = {};
        var html = template(dynamic_data);
        $('#faostat_ui_download_main_content').html(html);

        /* This... */
        var _this = this;

        require(['FENIX_UI_METADATA_VIEWER'], function(METADATDA) {

            /* Metadata. */
            var metadata = new METADATDA();
            metadata.init({
                domain: null,
                group: group_code,
                lang: _this.CONFIG.lang,
                placeholder_id: 'metadata_panel'
            });

        });

    };

    DWLD.prototype.load_faostat_domain_ui = function(domain_code) {

        /* Implementation of the language change from the main menu. */
        amplify.subscribe('language_event', function(data) {
            Backbone.history.navigate('/' + data.language +
                                     '/download/' + _this.CONFIG.group.toUpperCase() +
                                     '/' + _this.CONFIG.domain.toUpperCase() +
                                     '/' + _this.CONFIG.section, {trigger: true});
        });

        /* Highlight selected language. */
        $('#' + this.CONFIG.lang + '_language_selector').css('text-decoration', 'underline');

        /* Load template. */
        var source = $(templates).filter('#faostat_ui_download_domain').html();
        var template = Handlebars.compile(source);
        var dynamic_data = {
            metadata_label: translate.metadata,
            bulk_label: translate.bulk,
            custom_label: translate.custom,
            preview_label: translate.preview
        };
        var html = template(dynamic_data);
        $('#faostat_ui_download_main_content').html(html);

        /* Update the URL on tab's click. */
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var target = $(e.target).attr('href');
            var section = target.substr(1);
            Backbone.history.navigate('/' + _this.CONFIG.lang +
                                      '/download/' + _this.CONFIG.group.toUpperCase() +
                                      '/' + _this.CONFIG.domain.toUpperCase() +
                                      '/' + section, {trigger: false});
        });

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
                domain: domain_code,
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
            var preview_options_config = {
                lang: _this.CONFIG.lang,
                prefix: _this.CONFIG.prefix + 'preview_',
                button_label: 'Preview Options',
                header_label: 'Preview Options',
                placeholder_id: 'preview_options_placeholder'
            };
            preview_options_config = $.extend(true, {}, preview_options_config, _this.CONFIG.preview_options);
            var preview_options = new OPTIONS();
            preview_options.init(preview_options_config);
            preview_options.show_as_modal_window();

            /* Metadata. */
            var metadata_config = {
                lang: _this.CONFIG.lang,
                domain: domain_code,
                group: _this.CONFIG.group,
                placeholder_id: 'metadata_placeholder'
            };
            metadata_config = $.extend(true, {}, metadata_config, _this.CONFIG.metadata);
            var metadata = new METADATDA();
            metadata.init(metadata_config);

            /* Download selectors manager. */
            var selector_mgr_config = {
                lang: _this.CONFIG.lang,
                domain: domain_code,
                prefix: 'faostat_selectors_',
                datasource: 'faostatdb',
                placeholder_id: 'selectors_placeholder'
            };
            selector_mgr_config = $.extend(true, {}, selector_mgr_config, _this.CONFIG.selector_manager);
            var selector_mgr = new SELECTOR_MGR();
            selector_mgr.init(selector_mgr_config);

            /* Preview button. */
            $('#download_preview_button').click(function() {
                _this.preview(selector_mgr, preview_options);
            });

            /* Select tab. */
            switch (_this.CONFIG.section) {
                case 'metadata':
                    $('#download_tab_panel li:eq(0) a').tab('show');
                    break;
                case 'bulk':
                    $('#download_tab_panel li:eq(1) a').tab('show');
                    break;
                case 'custom':
                    $('#download_tab_panel li:eq(2) a').tab('show');
                    break;
            }

        });

    };

    DWLD.prototype.preview = function(selector_mgr, preview_options) {
        var user_selection = selector_mgr.get_user_selection();
        var dwld_options = preview_options.collect_user_selection();
        var data = {};
        var _this = this;
        data = $.extend(true, {}, data, user_selection);
        data = $.extend(true, {}, data, dwld_options);
        data.datasource = this.CONFIG.datasource;
        data.domainCode = this.CONFIG.domain;
        data.lang = this.CONFIG.lang_faostat;
        data.limit = 50;
        $.ajax({
            type: 'POST',
            url: 'http://faostat3.fao.org/wds/rest/procedures/data',
            data: {
                'payload': JSON.stringify(data)
            },
            success: function (response) {

                /* Cast data, if needed. */
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);

                /* Create OLAP. */
                dataConfig = _.extend(dataConfig, {aggregatorDisplay: pivotAggregators});
                dataConfig = _.extend(dataConfig, {rendererDisplay: pivotRenderers});
                var p = new pivot();
                p.render('download_output_area', json, dataConfig);

            },
            error: function(a) {
                swal({
                    title: translate.error,
                    type: 'error',
                    text: a.responseText
                });
            }
        });
    };

    DWLD.prototype.create_tmp_table = function(data) {
        var blacklist = [0, 1, 14, 15, 16, 17, 18, 19];
        var s = '<table class="table table-striped table-bordered table-condensed table-responsive">';
        try {
            s += '<thead><tr>';
            for (var i = 0 ; i < data[0].length ; i++) {
                if ($.inArray(i, blacklist) < 0)
                    s += '<th>' + data[0][i] + '</th>';
            }
            s += '</tr></thead>';
            for (i = 1; i < data.length; i++) {
                s += '<tr>';
                for (var j = 0; j < data[i].length; j++) {
                    if ($.inArray(j, blacklist) < 0)
                        s += '<td>' + data[i][j] + '</td>';
                }
                s += '</tr>';
            }
        } catch (e) {

        }
        s += '</table>';
        return s;
    };

    return DWLD;

});