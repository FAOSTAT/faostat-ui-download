/*global define*/
define(['jquery',
        'globals/Common',
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
        'bootstrap',
        'amplify'], function ($, Common, Handlebars, templates, translate, FAOSTATCommons, Tree,
                              DownloadSelectorsManager, OptionsManager, BulkDownloads, MetadataViewer,
                              swal, Q) {

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
            action: null,
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
                tab: 'a[data-toggle="tab"]'
            }
        };

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang !== null ? this.CONFIG.lang : 'en';

        /* Store FAOSTAT language. */
        this.CONFIG.lang_faostat = FAOSTATCommons.iso2faostat(this.CONFIG.lang);

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

    };

    DOWNLOAD.prototype.download = function () {

        /* Variables. */
        var user_selection;

        /* Get user selection. */
        user_selection = this.get_user_selection();

        /* Validate user selection. */
        try {

            /* Validate user selection. */
            this.validate_user_selection(user_selection);

        } catch (e) {
            swal({
                type: 'warning',
                title: 'Warning',
                text: e
            });
        }
       /* 1. get data size */
       /* 2. get data */
       /* 3. switch preview/download */
       /* 4. switch table/pivot */
    };

    DOWNLOAD.prototype.query_size = function (user_selection, options) {

        //var user_selection,
        //    options,
        //    data = {},
        //    that = config !== undefined ? config.context || this : this,
        //    data_size,
        //    isPreview = $('#download_options_modal_window').css('display') === 'none',
        //    options_manager_window;
        //
        ///* Determine whether the user is using the preview or the download. */
        //options_manager_window = isPreview ? 'preview_options' : 'download_options';
        //
        //try {
        //
        //    user_selection = that.download_selectors_manager.get_user_selection();
        //    dwld_options = that.options_manager.get_options_window(options_manager_window).collect_user_selection(null);
        //
        //    /* Validate user selection. */
        //    this.validate_user_selection(user_selection);
        //
        //    /* Calculate the output size if the user selected PIVOT as output type. */
        //    if (dwld_options.output_type === 'PIVOT') {
        //
        //        data = $.extend(true, {}, data, user_selection);
        //        data = $.extend(true, {}, data, dwld_options);
        //        data.datasource = 'faostat';
        //        data.domainCode = that.options.domain;
        //        data.lang = that.options.lang;
        //        data.limit = -1;
        //
        //        /* Add loading. */
        //        amplify.publish(E.WAITING_SHOW, {});
        //
        //        this.api.datasize({
        //            domain_code: that.options.code,
        //            List1Codes: user_selection.list1Codes || null,
        //            List2Codes: user_selection.list2Codes || null,
        //            List3Codes: user_selection.list3Codes || null,
        //            List4Codes: user_selection.list4Codes || null,
        //            List5Codes: user_selection.list5Codes || null,
        //            List6Codes: user_selection.list6Codes || null,
        //            List7Codes: user_selection.list7Codes || null,
        //            lang: that.options.lang
        //        }).then(function (json) {
        //
        //            /* Parse query size. */
        //            data_size = parseFloat(json.data[0].NoRecords);
        //
        //            /* Close waiting window. */
        //            amplify.publish(E.WAITING_HIDE, {});
        //
        //            /* Query size exceeds the limit. */
        //            if (data_size > that.size_limit) {
        //                amplify.publish(E.NOTIFICATION_WARNING, {
        //                    title: i18nLabels.warning,
        //                    text: 'The size of your query exceeds the limit. Please consider to download data through the Bulk Downloads section, or switch to the Table output type.'
        //                });
        //            } else {
        //                that.preview(config);
        //            }
        //
        //        }).fail(function () {
        //
        //            /* Close waiting window. */
        //            amplify.publish(E.WAITING_HIDE, {});
        //
        //            amplify.publish(E.NOTIFICATION_WARNING, {
        //                title: i18nLabels.warning,
        //                text: 'The size of your query exceeds the limit. Please consider to download data through the Bulk Downloads section, or switch to the Table output type.'
        //            });
        //
        //        });
        //
        //    } else {
        //        that.preview(config);
        //    }
        //
        //} catch (e) {
        //
        //    /* Close waiting window. */
        //    amplify.publish(E.WAITING_HIDE, {});
        //
        //    amplify.publish(E.NOTIFICATION_WARNING, {
        //        title: i18nLabels.warning,
        //        text: e.responseText
        //    });
        //
        //}
    };

    DOWNLOAD.prototype.preview_table = function () {

    };

    DOWNLOAD.prototype.preview_pivot = function () {

    };

    DOWNLOAD.prototype.download_table = function () {

    };

    DOWNLOAD.prototype.download_pivot = function () {

    };

    DOWNLOAD.prototype.validate_user_selection = function (user_selection) {

        /* Variables. */
        var i;

        /* Check there's at least one selection for each box. */
        for (i = 0; i < this.CONFIG.download_selectors_manager.CONFIG.rendered_boxes.length; i += 1) {
            if (user_selection['list' + (i + 1) + 'Codes'].length < 1) {
                throw 'Please make at least one selection for "' + $('#tab_headers__' + i + ' li:first-child').text().trim() + '".';
            }
        }

    };

    DOWNLOAD.prototype.get_user_selection = function () {
        return this.CONFIG.download_selectors_manager.get_user_selection();
    };

    DOWNLOAD.prototype.get_options = function () {

    };

    DOWNLOAD.prototype.get_download_options = function () {

    };

    DOWNLOAD.prototype.get_preview_options = function () {

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
                onOutputTypeChange: function () {
                    $('#' + that.CONFIG.placeholders.download_output_area).empty();
                    //self.preview_size();
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