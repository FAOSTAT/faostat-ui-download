/*global define, document, window, unescape, encodeURIComponent, setInterval, clearInterval, amplify*/
define(['jquery',
        'globals/Common',
        'config/Events',
        'handlebars',
        'text!faostat_ui_download/html/templates.hbs',
        'i18n!faostat_ui_download/nls/translate',
        'faostat_commons',
        'FAOSTAT_UI_TREE',
        'FAOSTAT_UI_DOWNLOAD_SELECTORS_MANAGER',
        'FAOSTAT_UI_OPTIONS_MANAGER',
        'FAOSTAT_UI_BULK_DOWNLOADS',
        'FENIX_UI_METADATA_VIEWER',
        'sweetAlert',
        'q',
        'faostatapiclient',
        'FAOSTAT_UI_TABLE',
        'FAOSTAT_UI_PIVOT',
        'pivot_exporter',
        'bootstrap',
        'amplify'], function ($, Common, E, Handlebars, templates, translate, FAOSTATCommons, Tree,
                              DownloadSelectorsManager, OptionsManager, BulkDownloads, MetadataViewer,
                              swal, Q, FAOSTATAPIClient, Table, FAOSTATPivot, PivotExporter) {

    'use strict';

    function DOWNLOAD(config) {

        this.CONFIG = {
            lang: 'en',
            group: null,
            domain: null,
            lang_faostat: 'E',
            datasource: 'faostatdb',
            prefix: 'faostat_ui_download_',
            placeholder_id: 'faostat_ui_download',
            pivot: null,
            action: 'PREVIEW',
            limit_pivot: 1000,
            limit_table: 1000000,
            page_size: 100,
            page_number: 1,
            placeholders: {
                tree: '#tree',
                interactive_tab: 'a[href="#interactive_download"]',
                metadata_tab: 'a[href="#metadata"]',
                bulk_tab: 'a[href="#bulk_downloads"]',
                interactive_download_selectors: 'interactive_download_selectors',
                download_output_area: 'downloadOutputArea',
                preview_options_placeholder: 'preview_options_placeholder',
                download_options_placeholder: 'download_options_placeholder',
                bulk_downloads: 'bulk_downloads',
                metadata_container: 'metadata_container',
                tab: 'a[data-toggle="tab"]',
                preview_button: 'preview_button',
                download_button: 'download_options_csv_button'
            }
        };

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang !== null ? this.CONFIG.lang : 'en';

        /* Store FAOSTAT language. */
        this.CONFIG.lang_faostat = FAOSTATCommons.iso2faostat(this.CONFIG.lang);

        /* Initiate FAOSTAT API's client. */
        this.CONFIG.api = new FAOSTATAPIClient();

        /* Initiate pivot exporter. */
        this.CONFIG.pivot_exporter = new PivotExporter({
            placeholder_id: 'downloadOutputArea',
            filename: 'FAOSTAT',
            url_csv2excel: 'http://fenixapps2.fao.org/api/v1.0/csv2excel/',
            url_output: 'http://fenixapps2.fao.org/api/v1.0/excels/'
        });

    }

    DOWNLOAD.prototype.init = function () {

        /* Variables. */
        var source, template, dynamic_data, html, that = this;

        /* Load main structure. */
        source = $(templates).filter('#faostat_ui_download_structure').html();
        template = Handlebars.compile(source);
        dynamic_data = {
            tree_title: translate.tree_title,
            interactive_download_label: translate.interactive_download_label,
            bulk_downloads_label: translate.bulk_downloads_label,
            metadata_label: translate.metadata_label,
            preview_label: translate.preview_label
        };
        html = template(dynamic_data);
        $('#' + this.CONFIG.placeholder_id).html(html);

        /* Build tree. */
        this.CONFIG.tree = new Tree();
        this.CONFIG.tree.init({
            lang: this.CONFIG.lang,
            placeholder_id: this.CONFIG.placeholders.tree,
            code: this.CONFIG.code,
            callback: {
                onTreeRendered: function (callback) {
                    that.CONFIG.code = callback.id;
                    that.render_section();
                },
                onClick: function (callback) {
                    that.CONFIG.code = callback.id;
                    Common.changeURL(that.CONFIG.section, [that.CONFIG.code], false);
                    that.render_section();
                }
            }
        });

        /* On tab change. */
        $(this.CONFIG.placeholders.tab).on('shown.bs.tab', function (e) {
            if ($(e.target).data('section') !== that.CONFIG.section) {
                that.CONFIG.section = $(e.target).data('section');
                Common.changeURL(that.CONFIG.section, [that.CONFIG.code], false);
                that.render_section();
            }
        });

        /* Store user's action: preview. */
        $('#' + this.CONFIG.placeholders.preview_button).off().click(function () {
            that.CONFIG.action = 'PREVIEW';
            that.download();
        });


    };

    DOWNLOAD.prototype.download = function (context) {

        /* Variables. */
        var user_selection,
            options,
            that = context || this,
            event;

        /* Get user selection. */
        user_selection = that.get_user_selection(that);

        /* Get options. */
        options = that.get_options(that);
        event = that.get_event(options, that);

        /* Add loading. */
        amplify.publish(E.WAITING_SHOW, {});

        /* Validate user selection. */
        try {

            /* Validate user selection. */
            that.validate_user_selection(user_selection, that);

            /* Evaluate query size. */
            that.query_size(user_selection, that).then(function (query_size) {

                /* Validate query size. */
                that.validate_query_size(options, query_size, that).then(function () {

                    /* The DOWNLOAD_TABLE event downloads the data by itself. */
                    if (event === 'DOWNLOAD_TABLE') {

                        /* Download data in CSV format. */
                        that.download_table(user_selection, options, that);

                    /* The data is downloaded and passed to the various rendering functions otherwise. */
                    } else {

                        /* Get data. */
                        that.get_data(user_selection, options, that).then(function (data) {
                            that.process_data(event, data, options, that);
                        });

                    }

                }).fail(function (e) {
                    swal({
                        type: 'warning',
                        title: 'Warning',
                        text: e
                    });
                    amplify.publish(E.WAITING_HIDE, {});
                });

            });

        } catch (e) {
            swal({
                type: 'warning',
                title: 'Warning',
                text: e
            });
            amplify.publish(E.WAITING_HIDE, {});
        }

    };

    DOWNLOAD.prototype.process_data = function (event, data, options, context) {
        var that = context || this;
        switch (event) {
        case 'PREVIEW_TABLE':
            this.preview_table(data, options, that);
            break;
        case 'PREVIEW_PIVOT':
            this.preview_pivot(data, options, that);
            break;
        case 'DOWNLOAD_PIVOT':
            this.download_pivot(data, options, that);
            break;
        }
    };

    DOWNLOAD.prototype.get_event = function (options, context) {
        var that = context || this;
        switch (options.output_type) {
        case 'TABLE':
            switch (that.CONFIG.action) {
            case 'PREVIEW':
                return 'PREVIEW_TABLE';
            case 'DOWNLOAD':
                return 'DOWNLOAD_TABLE';
            }
            break;
        case 'PIVOT':
            switch (that.CONFIG.action) {
            case 'PREVIEW':
                return 'PREVIEW_PIVOT';
            case 'DOWNLOAD':
                return 'DOWNLOAD_PIVOT';
            }
            break;
        }
    };

    DOWNLOAD.prototype.validate_query_size = function (options, query_size, context) {
        var that = context || this;
        return Q.fcall(function () {
            switch (options.output_type) {
            case 'TABLE':
                if (query_size > that.CONFIG.limit_table) {
                    throw 'The size of your query exceeds the limit. Please consider to download data through the Bulk Downloads section.';
                }
                break;
            case 'PIVOT':
                if (query_size > that.CONFIG.limit_pivot) {
                    throw 'The size of your query exceeds the limit. Please consider to download data through the Bulk Downloads section, or switch to the Table output type.';
                }
                break;
            }
        });
    };

    DOWNLOAD.prototype.get_data = function (user_selection, options, context) {
        var that = context || this,
            config = {
                domain_code: that.CONFIG.code,
                List1Codes: user_selection.list1Codes || null,
                List2Codes: user_selection.list2Codes || null,
                List3Codes: user_selection.list3Codes || null,
                List4Codes: user_selection.list4Codes || null,
                List5Codes: user_selection.list5Codes || null,
                List6Codes: user_selection.list6Codes || null,
                List7Codes: user_selection.list7Codes || null,
                lang: that.CONFIG.lang,
                page_size: that.CONFIG.page_size,
                page_number: that.CONFIG.page_number,
                group_by: null,
                decimal_places: options.decimal_numbers_value
            };
        return this.CONFIG.api.data(config).then(function (data) {
            return data;
        });
    };

    DOWNLOAD.prototype.query_size = function (user_selection, context) {

        /* Variables. */
        var that = context || this,
            config = {
                domain_code: that.CONFIG.code,
                List1Codes: user_selection.list1Codes || null,
                List2Codes: user_selection.list2Codes || null,
                List3Codes: user_selection.list3Codes || null,
                List4Codes: user_selection.list4Codes || null,
                List5Codes: user_selection.list5Codes || null,
                List6Codes: user_selection.list6Codes || null,
                List7Codes: user_selection.list7Codes || null,
                lang: that.CONFIG.lang
            };

        return that.CONFIG.api.datasize(config).then(function (query_size) {
            return parseFloat(query_size.data[0].NoRecords);
        });

    };

    DOWNLOAD.prototype.preview_table = function (data, options, context) {
        var that = context || this,
            table = new Table();
        table.init({
            placeholder_id: that.CONFIG.placeholders.download_output_area,
            data: data.data,
            metadata: data.metadata,
            show_units: options.units_value,
            show_flags: options.flags_value,
            show_codes: options.codes_value,
            decimal_places: options.decimal_numbers_value,
            decimal_separator: options.decimal_separator_value,
            thousand_separator: options.thousand_separator_value,
            page_size: that.CONFIG.page_size,
            //onPageClick: this.preview,
            context: that
        });
        that.CONFIG.action = null;
        amplify.publish(E.WAITING_HIDE, {});
    };

    DOWNLOAD.prototype.preview_pivot = function (data, options, context) {
        var that = context || this;
        return Q.fcall(function () {
            var pivot_table = new FAOSTATPivot();
            pivot_table.init({
                placeholder_id: that.CONFIG.placeholders.download_output_area,
                data: data.data,
                dsd: data.metadata.dsd,
                show_flags: options.flags_value,
                show_codes: options.codes_value
            });
            that.CONFIG.action = null;
            amplify.publish(E.WAITING_HIDE, {});
        });
    };

    DOWNLOAD.prototype.download_table = function (user_selection, options, context) {
        var that = context || this;
        that.CONFIG.api.data({
            domain_code: that.CONFIG.code,
            List1Codes: user_selection.list1Codes || null,
            List2Codes: user_selection.list2Codes || null,
            List3Codes: user_selection.list3Codes || null,
            List4Codes: user_selection.list4Codes || null,
            List5Codes: user_selection.list5Codes || null,
            List6Codes: user_selection.list6Codes || null,
            List7Codes: user_selection.list7Codes || null,
            lang: that.CONFIG.lang,
            output_type: 'csv',
            limit: -1
        }).then(function () {
            that.CONFIG.action = null;
        }).fail(function (e) {
            var csvString = e.responseText,
                a = document.createElement('a'),
                filename = $('#tree').find('.jstree-anchor.jstree-clicked').text().replace(/\s/g, '_') + '_' + (new Date()).getTime() + '.csv';
            a.href = 'data:text/csv;charset=utf-8;base64,' + window.btoa(unescape(encodeURIComponent(csvString)));
            a.target = '_blank';
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            that.CONFIG.action = null;
            amplify.publish(E.WAITING_HIDE, {});
        });
    };

    DOWNLOAD.prototype.download_pivot = function (data, options) {
        var that = this,
            timer,
            test;
        that.preview_pivot(data, options).then(function () {
            timer = setInterval(function () {
                test = $('#' + that.CONFIG.placeholders.download_output_area).html();
                if (test !== '') {
                    clearInterval(timer);
                    that.CONFIG.pivot_exporter.csv();
                    amplify.publish(E.WAITING_HIDE, {});
                }
            }, 100);
        });
    };

    DOWNLOAD.prototype.validate_user_selection = function (user_selection, context) {

        /* Variables. */
        var i,
            that = context || this;

        /* Check there's at least one selection for each box. */
        for (i = 0; i < that.CONFIG.download_selectors_manager.CONFIG.rendered_boxes.length; i += 1) {
            if (user_selection['list' + (i + 1) + 'Codes'].length < 1) {
                throw 'Please make at least one selection for "' + $('#tab_headers__' + i + ' li:first-child').text().trim() + '".';
            }
        }

    };

    DOWNLOAD.prototype.get_user_selection = function (context) {
        var that = context || this;
        return that.CONFIG.download_selectors_manager.get_user_selection();
    };

    DOWNLOAD.prototype.get_options = function (context) {
        console.debug(context);
        var that = context || this;
        switch (that.CONFIG.action) {
        case 'DOWNLOAD':
            return that.get_download_options(context);
        case 'PREVIEW':
            return that.get_preview_options(context);
        }
    };

    DOWNLOAD.prototype.get_download_options = function () {
        return this.CONFIG.options_manager.get_options_window('download_options').collect_user_selection(null);
    };

    DOWNLOAD.prototype.get_preview_options = function () {
        return this.CONFIG.options_manager.get_options_window('preview_options').collect_user_selection(null);
    };

    DOWNLOAD.prototype.render_section = function () {
        switch (this.CONFIG.section) {
        case 'metadata':
            this.render_metadata();
            break;
        case 'interactive':
            this.render_interactive();
            break;
        case 'bulk':
            this.render_bulk_downloads();
            break;
        }
    };

    DOWNLOAD.prototype.render_metadata = function () {
        var that = this;
        $(this.CONFIG.placeholders.metadata_tab).tab('show');
        this.CONFIG.metadata = new MetadataViewer();
        if (this.CONFIG.metadata.isNotRendered()) {
            this.CONFIG.metadata.init({
                placeholder_id: that.CONFIG.placeholders.metadata_container,
                domain: that.CONFIG.code,
                callback: {
                    onMetadataRendered: function () {
                        $('#metadata_loading').css('display', 'none');
                    }
                }
            });
        }
    };

    DOWNLOAD.prototype.render_interactive = function () {

        /* Variables. */
        var that = this;

        /* Show the tab. */
        $(this.CONFIG.placeholders.interactive_tab).tab('show');

        /* Initiate components. */
        this.CONFIG.download_selectors_manager = new DownloadSelectorsManager();
        this.CONFIG.options_manager = new OptionsManager();

        /* Initiate selectors. */
        if (this.CONFIG.download_selectors_manager.isNotRendered()) {
            this.CONFIG.download_selectors_manager.init({
                lang: this.CONFIG.lang,
                placeholder_id: this.CONFIG.placeholders.interactive_download_selectors,
                domain: this.CONFIG.code,
                callback: {
                    onSelectionChange: function () {
                        $('#' + that.CONFIG.placeholders.download_output_area).empty();
                    }
                }
            });
        }

        /* Initiate options manager. */
        this.CONFIG.options_manager.init({
            callback: {
                onOutputTypeChange: function (checked) {
                    that.CONFIG.action = 'PREVIEW';
                    $('#' + that.CONFIG.placeholders.download_output_area).empty();
                    that.download(that);
                },
                onCodesChange: function (isChecked) {
                    if (isChecked) {
                        $('th[data-type="code"]').css('display', 'table-cell');
                        $('td[data-type="code"]').css('display', 'table-cell');
                    } else {
                        $('th[data-type="code"]').css('display', 'none');
                        $('td[data-type="code"]').css('display', 'none');
                    }
                },
                onFlagsChange: function (isChecked) {
                    if (isChecked) {
                        $('th[data-type="flag"]').css('display', 'table-cell');
                        $('td[data-type="flag"]').css('display', 'table-cell');
                        $('th[data-type="flag_label"]').css('display', 'table-cell');
                        $('td[data-type="flag_label"]').css('display', 'table-cell');
                    } else {
                        $('th[data-type="flag"]').css('display', 'none');
                        $('td[data-type="flag"]').css('display', 'none');
                        $('th[data-type="flag_label"]').css('display', 'none');
                        $('td[data-type="flag_label"]').css('display', 'none');
                    }
                },
                onUnitsChange: function (isChecked) {
                    if (isChecked) {
                        $('th[data-type="unit"]').css('display', 'table-cell');
                        $('td[data-type="unit"]').css('display', 'table-cell');
                    } else {
                        $('th[data-type="unit"]').css('display', 'none');
                        $('td[data-type="unit"]').css('display', 'none');
                    }
                },
                onDecimalNumbersChange: function () {
                    //self.preview_size();
                },
                onDecimalSeparatorChange: function () {
                    //self.preview_size();
                }
            }
        });

        /* Add preview options. */
        this.CONFIG.options_manager.add_options_panel('preview_options', {
            ok_button: true,
            pdf_button: false,
            excel_button: false,
            csv_button: false,
            lang: that.CONFIG.lang,
            button_label: translate.preview_options_label,
            header_label: translate.preview_options_label,
            placeholder_id: that.CONFIG.placeholders.preview_options_placeholder,
            decimal_separators: true,
            thousand_separators: true,
            units_checked: true,
            codes_value: true
        });

        /* Add download options. */
        this.CONFIG.options_manager.add_options_window('download_options', {
            pdf_button: false,
            lang: that.CONFIG.lang,
            button_label: translate.download_as_label,
            header_label: translate.download_as_label,
            placeholder_id: that.CONFIG.placeholders.download_options_placeholder,
            decimal_separators: false,
            thousand_separators: false,
            units_checked: true,
            excel_button: false,
            metadata_button: true,
            codes_value: true
        });

        /* Store user's action: download. */
        $('#' + this.CONFIG.placeholders.download_button).off().click(function () {
            that.CONFIG.action = 'DOWNLOAD';
            that.download();
        });

    };

    DOWNLOAD.prototype.render_bulk_downloads = function () {
        var that = this;
        $(this.CONFIG.placeholders.bulk_tab).tab('show');
        this.CONFIG.bulk_downloads = new BulkDownloads();
        if (this.CONFIG.bulk_downloads.isNotRendered()) {
            this.CONFIG.bulk_downloads.init({
                placeholder_id: that.CONFIG.placeholders.bulk_downloads,
                domain: that.CONFIG.code
            });
            this.CONFIG.bulk_downloads.create_flat_list();
        }
    };

    return DOWNLOAD;

});