define([], function() {

    'use strict';

    function APP() {

        this.CONFIG = {

            lang: 'E',

            tree: {
                lang: 'E',
                placeholder_id: 'tree_placeholder'
            }
            
        };

    }

    APP.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang != null ? this.CONFIG.lang : 'E';

        /* Initiate components. */
        this.init_tree();

    };

    APP.prototype.init_tree = function() {
        var _this = this;
        require(['FAOSTAT_TREE'], function(TREE) {
            var tree = new TREE();
            tree.init(_this.CONFIG.tree);
        });
    };

    return APP;

});