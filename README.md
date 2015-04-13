#jQueryTemplateLoader
jQuery plugin for ajax rendering html on appear block with indexDB caching
### Version
1.0.0

## Requirements ##
* jQuery [https://jquery.com/]
* jQuery appear plugin [https://github.com/morr/jquery.appear/]
* db.js is a wrapper for IndexedDB [https://github.com/aaronpowell/db.js]

## How to use ##
You need to include the libraries and init the plugin.

```javascript
<script src="jquery.js"></script>
<script src="jquery.appear.js"></script>
<script src="db.js"></script>
<script src="jquery.templateLoader.js"></script>

<div id="templatePlaceDiv" data-template-src="/puth/to/html"></div>

<script>
    $('#templatePlaceDiv').templateLoader();
</script>
```
or attach on all divs

```javascript
 $('[data-template-src]').templateLoader(); 
```

Also you can disable caching (by IndexDB), or enable dev mode with messages.
 
```javascript
 $('[data-template-src]').templateLoader({
             debugMode: true,
             caching: false
         });         
```

For refreshing template place need to save [templateLoader] object
```javascript
        var templateLoader = $('[data-template-src]').templateLoader({
                                          cacheTime: 100000, // 1 second =  1000 milliseconds (if need)
                                          templateRenderCallback: function(tamplate){
                                                console.log(template);
                                          }
                                      });
                                      
        //refresh all         
         $("#buttonRfreshAll").on("click",function(){
               templateLoader.refresh();
         }
         
         //refresh some selected templates
         $("#buttonRfreshSomeTemplates").on("click",function(){
                        var someTemplates = $("#template1, .refreshableTemplates");
                        templateLoader.refresh(someTemplates);
                  }
                  
         //clear all current database
           templateLoader.clearDatabase();
                  
         //delete one item from data base
           templateLoader.deleteItemDatabase('puth/to/html/source');        
```
each refreshable template will be deleted from IndexBD and loaded by ajax request on appear.

### More options
> **databaseName** - default 'default', the name of indexDB database

> **databaseVersion** - default 1, the version of indexDB database in integer (NOTICE: the right way change on deploy new version)

> **templateRenderCallback** - default null, the callback after render html block in page. Argument the template that was rendered.

> **selector** - default '[data-template-src]', the selector or selected html nodes of templates.

> **debugMode** - default false, flag that give some console.log messages of working plugin for debug.

> **caching** - default true, flag of enabling/disabling a caching in indexDB. Without caching templates will be rendering from ajax
request on first appear on page.

> **cacheTime** - default null, the time in milliseconds of caching templates. After expire on appear, load, click or hover the template will be refreshed
 with ajax request and new set html data to indexDB as new cache.
  
> **sourceTemplateAttribute** - default 'data-template-src', the attribute of link to html into template place.

> **isRenderedAttribute** - default 'data-template-is-rendered', the attribute of plugin self work, that set flag to rendered template places.

> **expiryCacheTimeAttribute** - default 'data-template-expiry', the attribute with expired time of template. 
