(function(){

'use strict';

 window.utils = { privileged:{} }; 
    
    /**
     *  very primitive version of sprintf.
     *  If a more capable one is needed, look here: http://www.diveintojavascript.com/projects/javascript-sprintf
     */
    utils.sprintf = function(format, etc)
    {
        var arg = arguments;
        var i = 1;
        return format.replace(/%((%)|s)/g, function (m) { return m[2] || arg[i++] })
    }
    
    
})();