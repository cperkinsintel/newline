(function(){

    'use strict';
    
    /*
     this handles the recording of list items.  
    */
    
    window.record = { privileged:{last_item:null} };
    
    record.init = function()
    {
        setup_start_stop_linefeed_buttons();
    };
    
    //start stop ui
    function start_stop_ui(starting)
    {
        var methods = starting ? ["addClass", "removeClass"] : ["removeClass", "addClass"];
        $("#start")[methods[0]]("hide"); //add or remove
         $("#stop")[methods[1]]("hide");
         $("#amend")[methods[0]]("hide");
     $("#linefeed")[methods[1]]("disabled");
    }
    record.privileged.start_stop_ui = start_stop_ui;
    
    
    
    function add_item_event_handlers($itemNode, item)
    {
        $itemNode.find(".delete-item").click(get_delete_item_f($itemNode, item));
        $itemNode.find(".edit-item").click(get_toggle_recording_f($itemNode, item));
    }
    
    function get_delete_item_f($itemNode, item)
    {
        return function()
        {
            item.recognition.stop();
            $itemNode.remove();
            //TODO:  update remote list.
            app.update_current_list(item.kid);
        };
    }
    
    function get_toggle_recording_f($itemNode, item)
    {
        return function()
        {
            var $edit_item = $itemNode.find(".edit-item");
            if($edit_item.hasClass("recording"))
            {
                item.recognition.stop();
                $edit_item.removeClass("recording");
                //TODO: store updated list once the isFinal is done.
                console.log("need to store once isFinal", item);
                $itemNode.one("isFinal", function(evt){ app.update_current_list(item.kid || app.privileged.current_kid); });
            }
            else
            {
                setup_item_recognition(item); 
                item.recognition.start(); 
                $edit_item.addClass("recording"); 
            }
        };
    }
    
    
    function get_resulting_f(item)
    {
        return function resulting_f(event) // event = {emma, interpretation,  results: [ {//is also array, isFinal:boolean}]    
        {
            var item_string = build_item(event.results);
            item.$domNode.html(item_string);
            var last_result = _.last(event.results);
            if(last_result.isFinal) //we made it.
            {
                item.$domNode.trigger("isFinal", [item]);
            }
            
        };
    }
    
    function build_item(results_array)
    {
        return _.reduce(results_array, function(str, result)
         {
             return str + result[0].transcript;  //Technically there may be alternate transcripts.  We just use first one.
         }, "");
    }
    
    function get_end_f(item)
    {
        return function end_f()
        {
            if(!item.$domNode.html()){ item.$domNode.parent().remove(); }
            else{ item.$domNode.parent().find(".edit-item").removeClass("hide recording"); }
        };
    }
    
    function get_error_f(item)
    {
        return function error_f(er)
        {
            console.log("gee whiz", er);
        };
    }
    
    var new_item_template_k = '<a class="list-group-item allow-badge widget">' 
                                + '<span class="delete-item badge glyphicon glyphicon-trash"></span>'
                                + '<span class="edit-item   badge glyphicon glyphicon-pencil%s"></span>'
                                + '<p class="list-group-item-text">%s</p></a>';
    record.privileged.new_item_template_k = new_item_template_k;
    
    function start_it(evt, preserve_current_p)
    {
        if(record.privileged.last_item)
        {
            record.privileged.last_item.end_it();
        }
        //toggle button
        start_stop_ui(true);
        
        //clear current list
        if(!preserve_current_p){ $("#current-list").html(""); }
        
        start_new_item();
    }
    
    function start_new_item(kid, item_arg)
    {
        //set item
        var item = {$domNode:null, recognition:null, end_it:null, kid:kid};
        
        //set up domNode
        var hide = item_arg ? "" : " hide";
        var item_str = utils.sprintf(new_item_template_k, hide, item_arg || "");
        var itemNode = $(item_str)[0];
        $("#current-list").append(itemNode);
        //TODO: add event listener to delete button
        add_item_event_handlers($(itemNode), item);
        item.$domNode = $(itemNode).find(".list-group-item-text");
        
        setup_item_recognition(item);
        
        
        item.end_it = function()
        {
            start_stop_ui(false);
            item.recognition.stop(); console.log("ending");
        }
        if(!item_arg)
        {
            record.privileged.last_item = item;
        
            item.recognition.start();
        }
        
    }
    
    record.setup_list = function(string_array, kid)
    {
        $("#current-list").html("");
        _.each(string_array, _.partial(start_new_item, kid));
    };
    
    /* called for side effect */
    function setup_item_recognition(item)
    {
        item.recognition = new webkitSpeechRecognition();
        item.recognition.continuous = true;
        item.recognition.interimResults = true; //switch to true when we can
        item.recognition.onresult = get_resulting_f(item);
        item.recognition.onerror  = get_error_f(item);
        item.recognition.onend = get_end_f(item);
    }
    
    function insert_linefeed()
    {
        if(record.privileged.last_item)
        {
            record.privileged.last_item.recognition.stop(); 
            
            start_new_item();
        }
    }
    
    
    function end_current()
    {
        //console.log("END CURRENT CALLED");
        if(record.privileged.last_item)
        {
            record.privileged.last_item.end_it();
            record.privileged.last_item = null;
        }else{ start_stop_ui(false); } //at least reset UI
        
        //TODO: after all finals are in we need to save this to Parse/Kinvey
        app.store_new_list();
    }
    
    
    
    function setup_start_stop_linefeed_buttons()
    { 
        $("#start").click(start_it);
        $("#stop").click(end_current);
        $("#linefeed").click(insert_linefeed);
        $("#amend").click(function(){ start_it(null, true); });
    }
    
    record.is_recording = function()
    {
        return record.privileged.last_item != null;
    };
    
})();