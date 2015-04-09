/**
 * jQuery TemplateLouder plugin
 *
 * Created by Yosef Kaminskyi
 * Mailto: moledet[at]ukr.net
 * Version:  1.0  on 09/04/2015.
 * Dependencies:
 *      jQuery https://jquery.com/
 *      jQuery appear plugin https://github.com/morr/jquery.appear/
 *      db.js is a wrapper for IndexedDB https://github.com/aaronpowell/db.js
 */
(function($) {
   function TemplateLouderObj(params){
       var TemplateLouder = {
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
               TemplateLouder.log('Initialization TemplateLouder...');

               for (var param in params) {
                   TemplateLouder[param] = params[param];
               }

               if(!this.isRenderedAttribute){
                   this.isRenderedAttribute = 'data-is-rendered-from-sourceTemplateAttribute-'+TemplateLouder.sourceTemplateAttribute;
               }

               if (this.caching) {
                   TemplateLouder.initDatabase();
               }else{
                   TemplateLouder.attachOnShowTemplatesEvent();
               }
           },
           onShowTemplatePlace:function(templatePlace){
               if ( !$(templatePlace).attr(TemplateLouder.isRenderedAttribute)||
                   TemplateLouder.checkIsExpired($(templatePlace).attr(TemplateLouder.expiryCacheTimeAttribute))
               )
               {
                   $(templatePlace).attr(TemplateLouder.isRenderedAttribute, true);
                   $(templatePlace).attr(TemplateLouder.expiryCacheTimeAttribute,null);
                   TemplateLouder.getTemplateHtml($(templatePlace).attr(TemplateLouder.sourceTemplateAttribute), TemplateLouder.renderTemplate);
               }
           },
           attachOnShowTemplatesEvent: function () {
               $(TemplateLouder.selector).appear();
               $(TemplateLouder.selector).on('appear', function (event, $all_appeared_elements) {
                   $all_appeared_elements.each(function () {
                       TemplateLouder.onShowTemplatePlace($(this));
                   })
               });
               $(TemplateLouder.selector).on('mouseover',function(){
                   TemplateLouder.onShowTemplatePlace($(this));
               });

               $(TemplateLouder.selector).on('click',function(){
                   TemplateLouder.onShowTemplatePlace($(this));
               });
               $(window).scroll();
           },
           initDatabase: function () {
               db.open({
                   server: TemplateLouder.databaseName,
                   version: TemplateLouder.databaseVersion,
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
                   TemplateLouder.Database = s;
                   TemplateLouder.attachOnShowTemplatesEvent();
               });
           },
           insertTemplateData: function (data) {
               if (!TemplateLouder.Database) {
                   return false;
               }

               TemplateLouder.log('Insert new value to indexDB:', data);
               TemplateLouder.Database.templates.add(data);
           },
           getAjaxTemplate: function (source, callback) {
               TemplateLouder.log('Template from ajax, request...', source);
               $.ajax({
                   type: "GET",
                   url: source,
                   dataType: "html",
                   success: function (data) {
                       var param = {
                           source: source,
                           html: data,
                           cacheExpiry: TemplateLouder.cacheTime == null? null: new Date().getTime() + TemplateLouder.cacheTime
                       };

                       TemplateLouder.insertTemplateData(param);
                       callback(param);
                   }
               });
           },
           getTemplateHtml: function (source, callback) {
               TemplateLouder.log('Request for template', source);

               if (!TemplateLouder.Database) {
                   TemplateLouder.log('IndexedDB not initialized!');
                   return TemplateLouder.getAjaxTemplate(source, callback);
               }

               var timeBegin = new Date();
               TemplateLouder.Database.templates.query().filter('source', source)
                   .execute().then(function (data) {
                                   var timeEnd = new Date;
                                   TemplateLouder.log('Time of indexBD request', timeEnd - timeBegin);

                                   if (data[0]) {
                                       TemplateLouder.log('Template from indexDB', source);

                                       if(data[0]['cacheExpiry'] && TemplateLouder.checkIsExpired(data[0]['cacheExpiry'])){
                                             TemplateLouder.deleteItemDatabase(source);
                                             return TemplateLouder.getAjaxTemplate(source, callback);
                                       }

                                       return callback(data[0], source);
                                   } else {
                                       return TemplateLouder.getAjaxTemplate(source, callback);
                                   }
                   });
           },
           checkIsExpired:function(time){
               if(!time){
                   return false;
               }

               if((new Date(parseInt(time)).getTime()- new Date().getTime())<0){
                   TemplateLouder.log('Cache expired');
                   return true;
               }

               return false;
           },
           renderTemplate: function (data) {
               var placement = $('['+TemplateLouder.sourceTemplateAttribute+'="' + data['source'] + '"]');

               TemplateLouder.log('Rendering template...', data);
               placement.html(data['html']);
               placement.attr(TemplateLouder.expiryCacheTimeAttribute, data["cacheExpiry"]);

               if (TemplateLouder.templateRenderCallback) {
                   TemplateLouder.log('Call of callback after render template...');
                   TemplateLouder.templateRenderCallback(placement);
               }
           },
           refresh:function(selector){
               var elements = null;
               if(selector){
                   elements = $(selector);
                }else{
                   elements =$(TemplateLouder.selector);
               }
               TemplateLouder.log('Refreshing elements...',elements);
               elements.attr(this.isRenderedAttribute,null);
               elements.each(function(){
                   var key = $(this).attr(TemplateLouder.sourceTemplateAttribute);
                   TemplateLouder.deleteItemDatabase(key);
               });
               $(window).scroll();
           },
           deleteItemDatabase:function(key){
               TemplateLouder.log('Database delete item...',key);
               if (!TemplateLouder.Database) {
                   return false;
               }

               TemplateLouder.Database.templates.query().filter('source', key)
                   .execute().then(function (data) {
                       if(data[0]){
                           TemplateLouder.Database.remove('templates',data[0]["id"]);
                           TemplateLouder.log('Deleted!',data[0]);
                       }else{
                           TemplateLouder.log('Item not exists in indexDB with key:',key);
                       }
                   });
           },
           clearDatabase: function (callback) {
               TemplateLouder.Database.templates.clear().then(function () {
                   TemplateLouder.log('Database cleared!');
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
       TemplateLouder.init(params);

       return TemplateLouder;
   }

    $.fn.extend({
        // watching for element's appearance in browser viewport
        templateLouder: function(options) {
            var params = {selector:this};
            params = $.extend(params,options);

            return new TemplateLouderObj(params);
        }
    });
})(jQuery);
