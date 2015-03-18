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

    function MENU() {

        this.CONFIG = {
            lang: 'en',
            lang_faostat: 'E',
            placeholder_id: 'faostat_ui_download',
            prefix: 'faostat_ui_download_'
        };

    }

    MENU.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang != null ? this.CONFIG.lang : 'en';

        /* Store FAOSTAT language. */
        this.CONFIG.lang_faostat = Commons.iso2faostat(this.CONFIG.lang);

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
            placeholder_id: 'left_placeholder'
        });

        /* Bind UI creation on domain leaf click. */
        tree.onDomainClick(function(id) {
            this.load_faostat_domain_ui(id)
        });

    };

    return MENU;

});