(function(){

    'use strict';
    
    window.error = { privileged:{} };
    
    error.bad_things = function(msg)
    {
        $("#bad-things").text(msg).removeClass("hide");
    };
    
    error.get_error_f = function(msg)
    {
        return function error_f(er)
        {
            error.bad_things(msg + " " + er.toString());
        };
    };
    
})();