# jQueryTemplateLouderPlugin
jQuery plugin for ajax rendering html on appear block whith indexDB caching

## Requirements ##
* jQuery https://jquery.com/
* jQuery appear plugin https://github.com/morr/jquery.appear/
* db.js is a wrapper for IndexedDB https://github.com/aaronpowell/db.js

## How to use ##
You need to include the libraries and init the plugin.

```
<script src="jquery.js"></script>
<script src="jquery.appear.js"></script>
<script src="db.js"></script>
<script src="jquery.templateLouder.js"></script>

<div id="templatePlaceDiv" data-template-src="/puth/to/html"></div>

<script>
    $('#templatePlaceDiv).templateLouder();
</sctipt>
```
or attach on all divs

```
 $('[data-template-src]').templateLouder();
```
