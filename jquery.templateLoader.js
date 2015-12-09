/**
 * jQuery TemplateLouder plugin
 *
 * Created by Yosef(Vlad) Kaminskyi
 * Mailto: moledet[at]ukr.net
 * Version:  1.0  on 09/04/2015.
 * Dependencies:
 *      jQuery https://jquery.com/
 *      jQuery appear plugin https://github.com/morr/jquery.appear/
 *      db.js is a wrapper for IndexedDB https://github.com/aaronpowell/db.js
 */
;(function($) {
    function jQueryTemplateLoaderObj(params){
        var TemplateLoader = {
            Database: null,
            databaseName: 'default',
            databaseVersion: 1,
            templateRenderCallback: null,
            selector: '[data-template-src]',
            debugMode: false,
            caching: true,
            cacheTime: null,
            sourceTemplateAttribute: 'data-template-src',
            isRenderedAttribute: 'data-template-is-rendered',
            expiryCacheTimeAttribute: 'data-template-expiry',
            init: function (params) {
                TemplateLoader.log('Initialization TemplateLoader...');

                for (var param in params) {
                    TemplateLoader[param] = params[param];
                }

                if(!this.isRenderedAttribute){
                    this.isRenderedAttribute = 'data-is-rendered-from-sourceTemplateAttribute-'+TemplateLoader.sourceTemplateAttribute;
                }

                this.databaseVersion = parseInt(this.databaseVersion);
                if(this.databaseVersion == NaN){
                    this.databaseVersion = 1;
                }

                if (this.caching) {
                    TemplateLoader.initDatabase();
                }else{
                    TemplateLoader.attachOnShowTemplatesEvent();
                }
            },
            onShowTemplatePlace:function(templatePlace){
                if ( !$(templatePlace).attr(TemplateLoader.isRenderedAttribute)||
                    TemplateLoader.checkIsExpired($(templatePlace).attr(TemplateLoader.expiryCacheTimeAttribute))
                )
                {
                    $(templatePlace).attr(TemplateLoader.isRenderedAttribute, true);
                    $(templatePlace).attr(TemplateLoader.expiryCacheTimeAttribute,null);
                    TemplateLoader.getTemplateHtml($(templatePlace).attr(TemplateLoader.sourceTemplateAttribute), TemplateLoader.renderTemplate);
                }
            },
            attachOnShowTemplatesEvent: function () {
                $(TemplateLoader.selector).appear();
                $(TemplateLoader.selector).on('appear', function (event, $all_appeared_elements) {
                    $all_appeared_elements.each(function () {
                        TemplateLoader.onShowTemplatePlace($(this));
                    })
                });
                $(TemplateLoader.selector).on('mouseover',function(){
                    TemplateLoader.onShowTemplatePlace($(this));
                });

                $(TemplateLoader.selector).on('click',function(){
                    TemplateLoader.onShowTemplatePlace($(this));
                });
                $(window).scroll();
            },
            initDatabase: function () {
                try {
                    db.open({
                        server: TemplateLoader.databaseName,
                        version: TemplateLoader.databaseVersion,
                        schema: {
                            templates: {
                                key: {keyPath: 'id', autoIncrement: true},
                                // Optionally add indexes
                                indexes: {
                                    source: {unique: true}
                                }
                            }
                        }
                    }).then(function (s) {
                        TemplateLoader.Database = s;
                        TemplateLoader.attachOnShowTemplatesEvent();
                    });
                } catch (e) {
                    TemplateLoader.log('IndexDB not supported by browser!!! Caching disabled!');
                    TemplateLoader.attachOnShowTemplatesEvent();
                }
            },
            insertTemplateData: function (data) {
                if (!TemplateLoader.Database) {
                    return false;
                }

                TemplateLoader.log('Insert new value to indexDB:', data);
                TemplateLoader.Database.templates.add(data);
            },
            getAjaxTemplate: function (source, callback) {
                TemplateLoader.log('Template from ajax, request...', source);
                $.ajax({
                    type: "GET",
                    url: source,
                    dataType: "html",
                    success: function (data) {
                        var param = {
                            source: source,
                            html: data,
                            cacheExpiry: TemplateLoader.cacheTime == null? null: new Date().getTime() + TemplateLoader.cacheTime
                        };

                        TemplateLoader.insertTemplateData(param);
                        callback(param);
                    }
                });
            },
            getTemplateHtml: function (source, callback) {
                TemplateLoader.log('Request for template', source);

                if (!TemplateLoader.Database) {
                    TemplateLoader.log('IndexedDB not initialized!');
                    return TemplateLoader.getAjaxTemplate(source, callback);
                }

                var timeBegin = new Date();
                TemplateLoader.Database.templates.query().filter('source', source)
                    .execute().then(function (data) {
                        var timeEnd = new Date;
                        TemplateLoader.log('Time of indexBD request', timeEnd - timeBegin);

                        if (data[0]) {
                            TemplateLoader.log('Template from indexDB', source);

                            if(data[0]['cacheExpiry'] && TemplateLoader.checkIsExpired(data[0]['cacheExpiry'])){
                                TemplateLoader.deleteItemDatabase(source);
                                return TemplateLoader.getAjaxTemplate(source, callback);
                            }

                            return callback(data[0], source);
                        } else {
                            return TemplateLoader.getAjaxTemplate(source, callback);
                        }
                    });
            },
            checkIsExpired:function(time){
                if(!time){
                    return false;
                }

                if((new Date(parseInt(time)).getTime()- new Date().getTime())<0){
                    TemplateLoader.log('Cache expired');
                    return true;
                }

                return false;
            },
            renderTemplate: function (data) {
                var placement = $('['+TemplateLoader.sourceTemplateAttribute+'="' + data['source'] + '"]');

                TemplateLoader.log('Rendering template...', data);
                placement.html(data['html']);
                placement.attr(TemplateLoader.expiryCacheTimeAttribute, data["cacheExpiry"]);

                if (TemplateLoader.templateRenderCallback) {
                    TemplateLoader.log('Call of callback after render template...');
                    TemplateLoader.templateRenderCallback(placement);
                }
            },
            refresh:function(selector){
                var elements = null;
                if(selector){
                    elements = $(selector);
                }else{
                    elements =$(TemplateLoader.selector);
                }
                TemplateLoader.log('Refreshing elements...',elements);
                elements.attr(this.isRenderedAttribute,null);
                elements.each(function(){
                    var key = $(this).attr(TemplateLoader.sourceTemplateAttribute);
                    TemplateLoader.deleteItemDatabase(key);
                });
                $(window).scroll();
            },
            deleteItemDatabase:function(key){
                TemplateLoader.log('Database delete item...',key);
                if (!TemplateLoader.Database) {
                    return false;
                }

                TemplateLoader.Database.templates.query().filter('source', key)
                    .execute().then(function (data) {
                        if(data[0]){
                            TemplateLoader.Database.remove('templates',data[0]["id"]);
                            TemplateLoader.log('Deleted!',data[0]);
                        }else{
                            TemplateLoader.log('Item not exists in indexDB with key:',key);
                        }
                    });
            },
            clearDatabase: function (callback) {
                TemplateLoader.Database.templates.clear().then(function () {
                    TemplateLoader.log('Database cleared!');
                    if (callback) {
                        callback();
                    }
                });
            },
            log: function () {
                if (this.debugMode) {
                    console.log(arguments);
                }
            }
        };
        TemplateLoader.init(params);

        return TemplateLoader;
    }

    $.fn.extend({
        // watching for element's appearance in browser viewport
        templateLoader: function(options) {
            var params = {selector:this};
            params = $.extend(params,options);

            return new jQueryTemplateLoaderObj(params);
        }
    });
})(jQuery);