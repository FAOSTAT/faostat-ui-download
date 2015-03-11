define([], function() {

    'use strict';

    function APP() {

        this.CONFIG = {

            lang: 'E',

            tree: {
                lang: 'E',
                placeholder_id: 'tree_placeholder'
            },

            bulk: {
                lang: 'E',
                domain: 'QC',
                placeholder_id: 'bulk_downloads_placeholder'
            }

        };

    }

    APP.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang != null ? this.CONFIG.lang : 'E';

        /* This... */
        var _this = this;

        /* Initiate components. */
        require(['FAOSTAT_TREE', 'FAOSTAT_BULK_DOWNLOADS'], function(TREE, BULK) {

            /* Tree. */
            var tree = new TREE();
            tree.init(_this.CONFIG.tree);

            /* Bulk downloads. */
            var bulk = new BULK();
            bulk.init(_this.CONFIG.bulk);
            bulk.create_flat_list();

        });

    };

    return APP;

});