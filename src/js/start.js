/*global define, console, amplify */
define([
        'jquery',
        'loglevel',
        'config/Config',
        'config/Events',
        'config/Analytics',
        'globals/Common',
        'text!fs-i-d/html/templates.hbs',
        //'i18n!fs-i-d/nls/translate',
        'i18n!nls/download',
        'fs-s-m/start',
        'fs-d-o/start',
        'FAOSTAT_UI_TABLE',
        'fs-t-c/table',
        //'lib/table/table',
        'FAOSTAT_UI_PIVOT',
        'pivot_exporter',
        'faostatapiclient',
        'handlebars',
        'underscore',
        'amplify'
    ],
    function ($, log,
              C, E, A,
              Common, template, i18nLabels,
              SelectorManager, DownloadOptions,
              FAOSTATTable,
              Table,
              FAOSTATPivot, PivotExporter,
              FAOSTATAPI, Handlebars, _) {

        'use strict';

        var s = {

                SELECTORS: '[data-role="selectors"]',
                OPTIONS: '[data-role="options"]',
                EXPORT_BUTTON: '[data-role="export"]',
                PREVIEW_BUTTON: '[data-role="preview"]',

                DATE_UPDATE: '[data-role="date-update"]',
                METADATA_BUTTON: '[data-role="metadata"]',

                // this could be customized if configured in config.
                OUTPUT: {
                    //CONTAINER: '[data-role="output-area"]',
                    // table/pivot
                    CONTENT: '[data-role="content"]',
                    MESSAGE: '[data-role="message"]',

                    // this could also not been needed
                    EXPORT: '[data-role="export"]'
                },

                // this is used to check if the pivot table is rendered or not
                PIVOT_TABLE: '[data-role="pivot"]'

            },
            defaultOptions = {

                // TODO: move to config/Download
                TABLE: {
                    MAX_ROWS: 250000, // 250000 ~40/50MB
                    //MAX_ROWS: 350000, // export: 300000 ~50/60MB (13sec query). query page: 9sec.
                    PAGE_SIZE: 50,
                    PAGE_NUMBER: 1,
                    PAGE_LIST: "[25, 50, 100, 250]"
                },

                PIVOT: {
                    //MAX_ROWS: 1500,
                    MAX_ROWS: 15000,
                    //MAX_ROWS: 25000,

                    // this is due of how the pivot is rendered
                    // it requires all the fields
                    REQUEST_FIXED_PARAMETERS: {
                        show_flags: 1,
                        show_codes: 1,
                        show_unit: 1
                    }
                },

                DEFAULT_REQUEST: {
                    limit:-1,
                    page_size: 0,
                    per_page: 0,
                    page_number: -1,
                    null_values: false,
                    List1Codes: null,
                    List2Codes: null,
                    List3Codes: null,
                    List4Codes: null,
                    List5Codes: null,
                    List6Codes: null,
                    List7Codes: null
                }

            };

        function InteractiveDownload() {

            return this;
        }

        InteractiveDownload.prototype.init = function (config) {

            this.o = $.extend(true, {}, defaultOptions, config);
            this.api = new FAOSTATAPI();


            log.info("InteractiveDownload.init; o:", this.o);

            this.initVariables();
            this.initComponents();
            this.configurePage();
            this.bindEventListeners();

        };

        InteractiveDownload.prototype.initVariables = function () {

            this.$CONTAINER = $(this.o.container);

            var t = Handlebars.compile(template);

            this.$CONTAINER.html(t(i18nLabels));

            this.$SELECTORS = this.$CONTAINER.find(s.SELECTORS);
            this.$EXPORT_BUTTON = this.$CONTAINER.find(s.EXPORT_BUTTON);
            this.$PREVIEW_BUTTON = this.$CONTAINER.find(s.PREVIEW_BUTTON);
            this.$OPTIONS = this.$CONTAINER.find(s.OPTIONS);
            this.$METADATA_BUTTON = this.$CONTAINER.find(s.METADATA_BUTTON);
            this.$DATE_UPDATE = this.$CONTAINER.find(s.DATE_UPDATE);

            // output_area
            // this.$OUTPUT_AREA = this.$CONTAINER.find(s.OUTPUT_AREA);

            this.$OUTPUT_CONTAINER = $(this.o.output_container);

            // if this.o.output_area
            if (this.o.hasOwnProperty('output_container')) {


                log.info(this.o.output_container.length)

                this.$OUTPUT_CONTAINER = $(this.o.output_container);

                log.info(this.$OUTPUT_CONTAINER.length)
                    
                // show the container
                this.$OUTPUT_CONTAINER.show();

                this.$OUTPUT_CONTENT = this.$OUTPUT_CONTAINER.find(s.OUTPUT.CONTENT);
                this.$OUTPUT_MESSAGE = this.$OUTPUT_CONTAINER.find(s.OUTPUT.MESSAGE);
                this.$OUTPUT_EXPORT = this.$OUTPUT_CONTAINER.find(s.OUTPUT.EXPORT);

            }

        };

        InteractiveDownload.prototype.initComponents = function () {

            var code = this.o.code;

            this.$DATE_UPDATE.html(this.o.date_update);

            // Init Selector Manager
            this.selectorsManager = new SelectorManager();
            this.selectorsManager.init({
                container: this.$SELECTORS,
                code: code
            });

            // Init Download Options
            this.downloadOptions = new DownloadOptions();
            this.downloadOptions.init({
                container: this.$OPTIONS
            });

            this.downloadOptions.show_as_panel();

        };

        InteractiveDownload.prototype.configurePage = function () {

        };

        InteractiveDownload.prototype.preview = function () {

            var requestObj = this.getRequestObject(),
                options = this.downloadOptions.getSelections(),
                type = options.type,
                self = this;

            amplify.publish(E.WAITING_SHOW);

            log.info("InteractiveDownload.preview; ", type, options);
            log.info("InteractiveDownload.preview; requestObj", requestObj);

            try {
                // get query size
                this.api.datasize(requestObj).then(function (d) {

                    if(self.checkDataSize(d)) {

                        switch (type) {
                            case "table":
                                self.previewTable(d, requestObj, options);
                                break;
                            case "pivot":
                                self.previewPivot(d, requestObj, options);
                                break;
                        }
                    }

                }).fail(function (e) {
                    log.error("InteractiveDownload.preview; ", e);
                    amplify.publish(E.WAITING_HIDE);
                   // amplify.publish(E.NOTIFICATION_WARNING, {title: e});

                });

            }catch(e) {
                log.error("InteractiveDownload.preview; ", e);
                amplify.publish(E.WAITING_HIDE);
            }

        };

        InteractiveDownload.prototype.previewTable = function (d, requestObj, options) {

            log.info(" InteractiveDownload.previewTable size:", d);

            var rowsNumber = d.data[0].NoRecords,
                show_flags = (requestObj.show_flags === 1)? true : false,
                show_codes = (requestObj.show_codes === 1)? true : false,
                show_units = (requestObj.show_unit === 1)? true : false,
                thousand_separator = options.options.thousand_separator,
                decimal_separator = options.options.decimal_separator,
                querySizeCheck = rowsNumber <= this.o.TABLE.MAX_ROWS,
                self = this,
                // Override of the Request with Fixed parameters
                r = $.extend(true, {}, requestObj, {}); //this.o.PIVOT.REQUEST_FIXED_PARAMETERS);

                // initializing request
                r.page_number = this.o.TABLE.PAGE_NUMBER;
                r.page_size = this.o.TABLE.PAGE_SIZE;


            log.info("InteractiveDownload.previewTable; requestObj", requestObj, options);

            // analytics
            this.analyticsTablePreview({
                querySizeCheck: querySizeCheck,
                querySize: rowsNumber
            });

            // check if data size is right
            if(querySizeCheck) {

                // Table
                self.api.databean(r).then(function(d) {

                    // change output state
                    self.stateOutputInPreview();

                    //amplify.publish(E.WAITING_HIDE, {});
                    amplify.publish(E.SCROLL_TO_SELECTOR, {container: self.$OUTPUT_CONTENT});

                    // TODO: the Table requires to be simplified and a refactoring!
                    // TODO: config should be moved to a configuration file
                    var table = new Table();
                    table.render({
                        model: d,
                        request: r,
                        container: self.$OUTPUT_CONTENT,
                        adapter: {
                            columns: [],
                            show_flags: show_flags,
                            show_codes: show_codes,
                            show_unit: show_units,
                            thousand_separator: thousand_separator,
                            decimal_separator: decimal_separator
                        },
                        template: {
                            height: '650',
                            tableOptions: {
                                'data-pagination': true,
                                'data-sortable': false,
                                'data-page-size': self.o.TABLE.PAGE_SIZE,
                                'data-page-list':  self.o.TABLE.PAGE_LIST,
                                'data-side-pagination': 'server'
                                //'data-ajax': 'ajaxRequest'
                            },
                            sortable: false,
                            addPanel: false,
                            ajax: function(request) {
                                $.ajax({
                                    url: "",
                                    method: "",
                                    dataType: "",
                                    success: function () {
                                    },
                                    error: function(data) {
                                        log.error(JSON.stringify(data));
                                    },
                                    complete: function (){

                                        amplify.publish(E.WAITING_SHOW, {});

                                        var limit = request.data.limit,
                                            offset = request.data.offset,
                                            pageNumber = (offset / limit) + 1,
                                            pageSize = limit;

                                        // alter base request
                                        r.page_number = pageNumber;
                                        r.page_size = pageSize;

                                        log.info("InteractiveDownload.previewTable; limit, offset: ", limit, offset);
                                        log.info("InteractiveDownload.previewTable; page_size, page_number: ", pageSize, pageNumber);
                                        log.info("InteractiveDownload.previewTable; New request: ", (( pageSize !== self.o.TABLE.PAGE_SIZE && pageNumber === 1) || pageNumber !== 1));

                                        // if is it not the cached model
                                        if (( pageSize !== self.o.TABLE.PAGE_SIZE && pageNumber === 1) || pageNumber !== 1) {
                                            self.api.databean(r).then(function (v) {

                                                amplify.publish(E.WAITING_HIDE, {});

                                                request.success({
                                                    total: rowsNumber,
                                                    rows: table.formatData(v)
                                                });
                                                request.complete();
                                            });
                                        }else {

                                            log.info("InteractiveDownload.previewTable; cached model", d);

                                            amplify.publish(E.WAITING_HIDE, {});

                                            // cached page 1
                                            request.success({
                                                total: rowsNumber,
                                                rows: table.formatData(d)
                                            });
                                            request.complete();

                                        }
                                    }
                                });
                            }
                        }
                    });
                });

            }
            else {
                this.suggestBulkDownloads();
            }

        };

        InteractiveDownload.prototype.previewPivot = function (d, requestObj, options, exportPivot) {

            var rowsNumber = d.data[0].NoRecords,
                show_flags = (requestObj.show_flags === 1)? true : false,
                show_codes = (requestObj.show_codes === 1)? true : false,
                show_units = (requestObj.show_unit === 1)? true : false,
                render = (exportPivot !== undefined || exportPivot === true)? false : true,
                thousand_separator = options.options.thousand_separator,
                decimal_separator = options.options.decimal_separator,
                querySizeCheck = rowsNumber <= this.o.PIVOT.MAX_ROWS,
                self = this,

                // Override of the Request with Fixed parameters
                r = $.extend(true, {}, requestObj, this.o.PIVOT.REQUEST_FIXED_PARAMETERS);


            log.info(' InteractiveDownload.previewPivot; request:', r);

            // analytics (preview or download depending if the table will be rendered)
            //TODO: this should be fixed with a proper pivot table.
            if (render === true) {
                this.analyticsPivotPreview({
                    querySizeCheck: querySizeCheck,
                    querySize: rowsNumber
                });
            }else {
                this.analyticsPivotDownload({
                    querySizeCheck: querySizeCheck,
                    querySize: rowsNumber
                });
            }

            // check if data size is right
            if(querySizeCheck) {

                this.api.databean(r).then(function(d) {

                    amplify.publish(E.SCROLL_TO_SELECTOR, {container: self.$OUTPUT_CONTENT});

                    log.info('InteractiveDownload.previewPivot; data:', d);
                    log.info('InteractiveDownload.previewPivot; render:', render);

                    try {
                        // preview pivot
                        var pivotTable = new FAOSTATPivot();
                        pivotTable.init({
                            container: self.$OUTPUT_CONTENT,
                            data: d.data,
                            dsd: d.metadata.dsd,
                            show_flags: show_flags,
                            show_codes: show_codes,
                            show_units: show_units,
                            render: render,
                            thousand_separator: thousand_separator,
                            decimal_separator: decimal_separator
                        });

                        // export hidden table
                        if (render === false) {

                            var timer = setInterval(function () {
                                if (self.checkIfPivotRendered()) {
                                    clearInterval(timer);
                                    var pivotExporter = new PivotExporter({
                                        container: self.$OUTPUT_CONTENT,
                                        // TODO: consistent filename
                                        filename: 'FAOSTAT'
                                    });

                                    pivotExporter.csv();

                                }
                            }, 100);
                        } else {

                            // change output state
                            self.stateOutputInPreview();

                        }


                    }catch(e) {
                        // TODO: show an error message?
                        amplify.publish(E.WAITING_HIDE, {});
                        log.error('InteractiveDownload.previewPivot; error:', e);
                    }

                    amplify.publish(E.WAITING_HIDE, {});

                });

            }
            else {
                this.suggestBulkDownloadsOrTable();
            }

        };

        InteractiveDownload.prototype.export = function () {

            var requestObj = this.getRequestObject(),
                options = this.downloadOptions.getSelections(),
                type = options.type,
                self = this;

            amplify.publish(E.WAITING_SHOW);

            try {
                // get query size
                this.api.datasize(requestObj).then(function (d) {

                    if (self.checkDataSize(d)) {

                        switch (type) {
                            case "table":
                                self.exportTable(d, requestObj, options);
                                break;
                            case "pivot":
                                self.exportPivot(d, requestObj, options);
                                break;
                        }

                    }

                }).fail(function (e) {
                    log.error("InteractiveDownload.export; ", e);
                    amplify.publish(E.WAITING_HIDE);
                    //amplify.publish(E.NOTIFICATION_WARNING, {title: e});
                });

            }catch(e) {
                log.error("InteractiveDownload.export; ", e);
                amplify.publish(E.WAITING_HIDE);
            }

        };

        InteractiveDownload.prototype.exportTable = function (d, requestObj) {

            log.info(" InteractiveDownload.exportTable size:", d);

            var rowsNumber = d.data[0].NoRecords,
                querySizeCheck = rowsNumber <= this.o.TABLE.MAX_ROWS;

            // analytics
            this.analyticsTableDownload({
                querySizeCheck: querySizeCheck,
                querySize: rowsNumber
            });

            // check if data size is right
            if(querySizeCheck) {

                log.info('InteractiveDownload.exportTable; ', requestObj);

                amplify.publish(E.EXPORT_DATA, requestObj);

            }
            else {
                this.suggestBulkDownloadsOrTable();
            }


        };

        InteractiveDownload.prototype.exportPivot = function (d, requestObj, options) {

            amplify.publish(E.WAITING_HIDE);

            if (this.checkIfPivotRendered()) {
                // TODO: check if PivotAlready rendered and export the pivot
                var pivotExporter = new PivotExporter({
                    container: this.$OUTPUT_CONTENT,
                    // TODO: consistent filename
                    filename: 'FAOSTAT'
                });

                pivotExporter.csv();

                if(this.checkDataSize(d)) {
                    this.analyticsPivotDownload({
                        querySizeCheck: true,
                        querySize: d.data[0].NoRecords
                    });
                }else{
                    log.warn("InteractiveDownload.exportPivot; Data didn't pass the checkDataSize for analytics:", d);
                }

            }else{
                this.previewPivot(d, requestObj, options, true);
            }

        };

        InteractiveDownload.prototype.checkIfPivotRendered = function() {

            log.info(this.$OUTPUT_CONTENT.find(s.PIVOT_TABLE).length, this.$OUTPUT_CONTENT.find(s.PIVOT_TABLE));

            return (this.$OUTPUT_CONTENT.find(s.PIVOT_TABLE).length > 0)? true : false;
        };

        InteractiveDownload.prototype.getRequestObject = function () {

            // get options and selections

            // get selections
            var selections = this.selectorsManager.getSelections(),
                options = this.downloadOptions.getSelections(),
                domain_codes = [this.o.code],
                selectionRequest = {};

            // get request for each selection
            _.each(selections, function(s) {
                selectionRequest = $.extend(true, {}, selectionRequest, s.request);
            });

            log.info('InteractiveDownload.preview; selections', selections);
            log.info('InteractiveDownload.preview; options', options);

            return $.extend(true, {},
                this.o.DEFAULT_REQUEST,
                {
                    datasource: C.DATASOURCE,
                    lang: Common.getLocale(),
                    domain_codes: domain_codes
                },
                selectionRequest,
                options.request
            );

        };

        InteractiveDownload.prototype.suggestBulkDownloads = function () {

            amplify.publish(E.WAITING_HIDE, {});
            amplify.publish(E.NOTIFICATION_INFO, {
                title: i18nLabels.suggest_bulk_downloads
            });

            // TODO: focus on bulk downloads

            this.stateOutputInSelection();

        };

        InteractiveDownload.prototype.suggestBulkDownloadsOrTable = function () {

            amplify.publish(E.WAITING_HIDE, {});
            amplify.publish(E.NOTIFICATION_INFO, {
                title: i18nLabels.suggest_bulk_downloads_or_table
            });

            // TODO: focus on bulk downloads
            this.stateOutputInSelection();

        };

        InteractiveDownload.prototype.selectionChange = function () {

            log.info('InteractiveDownload.selectionChange');


            // this should be
/*            this.$OUTPUT_CONTENT.empty();

            // show message
            this.$OUTPUT_MESSAGE.show();*/

            this.stateOutputInSelection();

        };



        InteractiveDownload.prototype.checkDataSize = function (d) {

            log.info("InteractiveDownload.checkDataSize; ", d);

            if (d.data.length === 0 || d.data[0].NoRecords === undefined || d.data[0].NoRecords <= 0) {
                amplify.publish(E.WAITING_HIDE);
                amplify.publish(E.NOTIFICATION_INFO, {title: i18nLabels.no_data_available_for_current_selection});
                return false;
            }

            return true;

        };

        InteractiveDownload.prototype.noDataAvailablePreview = function () {

            // TODO: a common no data available?
            this.$OUTPUT_CONTENT.html('<h2>'+ i18nLabels.no_data_available_for_current_selection +'</h2>');

        };

        /* Analytics */
        InteractiveDownload.prototype.getAnalyticsLabel = function (obj, addSize) {

            var o = {},
                obj = obj || {};
            
            o.querySizeCheck = obj.hasOwnProperty("querySizeCheck")? obj.querySizeCheck : true;
            o.code = this.o.code;

            if (addSize === true && obj.hasOwnProperty("querySize")) {
               o.querySize = obj.querySize;
            }

            return o;

        };
        
        InteractiveDownload.prototype.analyticsTableQuerySize = function (obj) {

            amplify.publish(E.GOOGLE_ANALYTICS_EVENT,
                $.extend({}, true,
                    A.interactive_download.table_query_size,
                    this.getAnalyticsLabel(obj, true)
                )
            );

        };

        InteractiveDownload.prototype.analyticsPivotQuerySize = function (obj) {

            amplify.publish(E.GOOGLE_ANALYTICS_EVENT,
                $.extend({}, true,
                    A.interactive_download.pivot_query_size,
                    this.getAnalyticsLabel(obj, true)
                )
            );

        };

        InteractiveDownload.prototype.analyticsTablePreview = function (obj) {

            amplify.publish(E.GOOGLE_ANALYTICS_EVENT,
                $.extend({}, true,
                    A.interactive_download.table_preview,
                    this.getAnalyticsLabel(obj)
                )
            );

            this.analyticsTableQuerySize(obj);

        };

        InteractiveDownload.prototype.analyticsTableDownload = function (obj) {

            amplify.publish(E.GOOGLE_ANALYTICS_EVENT,
                $.extend({}, true,
                    A.interactive_download.table_download_csv,
                    this.getAnalyticsLabel(obj)
                )
            );

            this.analyticsTableQuerySize(obj);

        };

        InteractiveDownload.prototype.analyticsPivotPreview = function (obj) {

            amplify.publish(E.GOOGLE_ANALYTICS_EVENT,
                $.extend({}, true,
                    A.interactive_download.pivot_preview,
                    this.getAnalyticsLabel(obj)
                )
            );

            this.analyticsPivotQuerySize(obj);

        };

        InteractiveDownload.prototype.analyticsPivotDownload = function (obj) {

            amplify.publish(E.GOOGLE_ANALYTICS_EVENT,
                $.extend({}, true,
                    A.interactive_download.pivot_download,
                    this.getAnalyticsLabel(obj)
                )
            );

            this.analyticsPivotQuerySize(obj);

        };

        InteractiveDownload.prototype.bindEventListeners = function () {

            var self = this;

            this.$PREVIEW_BUTTON.on('click', function () {
                self.preview();
            });

            this.$EXPORT_BUTTON.on('click', function () {
                self.export();
            });

            this.$OUTPUT_EXPORT.on('click', function () {

                // TODO: check if there is a better way to check if the button is disabled
                if(!$(this).hasClass('disabled')) {
                    self.export();
                }

            });

            this.$METADATA_BUTTON.on('click', function () {
                amplify.publish(E.METADATA_SHOW, {
                    code: self.o.code
                });
            });

            amplify.subscribe(E.DOWNLOAD_SELECTION_CHANGE, this, this.selectionChange);

        };

        InteractiveDownload.prototype.unbindEventListeners = function () {

            this.$PREVIEW_BUTTON.off('click');
            this.$EXPORT_BUTTON.off('click');
            this.$METADATA_BUTTON.off('click');
            this.$OUTPUT_EXPORT.off('click');

            amplify.unsubscribe(E.DOWNLOAD_SELECTION_CHANGE, this.selectionChange);
        };

        InteractiveDownload.prototype.destroySelectorManager = function () {

            if (this.selectorsManager && _.isFunction(this.selectorsManager.destroy)) {
                this.selectorsManager.destroy();
            }

        };

        InteractiveDownload.prototype.stateOutputInPreview = function () {

            // TODO: check if it works in all situations
            this.$OUTPUT_MESSAGE.hide();

            // this.$OUTPUT_EXPORT.enable();
            // TODO: find a nicer way to enable/disable the export button
            this.$OUTPUT_EXPORT.removeClass('disabled');
            this.$OUTPUT_EXPORT.addClass('enabled');

        };

        InteractiveDownload.prototype.stateOutputInSelection = function () {

            // TODO: check if it works in all situations
            this.$OUTPUT_CONTENT.empty();

            this.$OUTPUT_MESSAGE.show();

            // this.$OUTPUT_EXPORT.enable();
            // TODO: find a nicer way to enable/disable the export button
            this.$OUTPUT_EXPORT.removeClass('enabled');
            this.$OUTPUT_EXPORT.addClass('disabled');

        };

        InteractiveDownload.prototype.destroy = function () {

            log.info('InteractiveDownload.destroy;');

            this.unbindEventListeners();

            this.destroySelectorManager();

            this.$CONTAINER.empty();

        };

        return InteractiveDownload;
    });