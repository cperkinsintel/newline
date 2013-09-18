(function(){

    'use strict';
    
    window.app = { privileged:{current_kid:null} };
    
    var k_collection_name = "the-lists";
        
    app.init = function()
    {
        if(! window["webkitSpeechRecognition"])
        {
            error.bad_things("webkitSpeechRecognition interface is not available");
        }
        else
        {
            init_load_lists();
            
            record.init();
        }
            
    };
    
    /**
    *      load up the lists from kinvey/parse
    *       display them
    *       last one is loaded into lists ui.
    *       and edit button is shown.
    */
    function init_load_lists()
    {
        var continue_f = load_lists;
        var user = Kinvey.getActiveUser();
        if(!user)
        {
            Kinvey.User.Login("theapp", "theapp", {success:load_lists, 
                                                     error:error.get_error_f("unable to login") });
        }
        else
        {
            load_lists(user); 
        }
    }
    
    function load_lists(user)
    {
        Kinvey.DataStore.get(k_collection_name, null, {success:populate_lists,
                                                   error:error.get_error_f("no lists for you") });
    }
    
    function populate_lists(data)
    {
        console.log("received data from Kinvey", data);
        _.map(data, prepend_new_list);
        activate_list_by_data(_.last(data), true);
    }
    
    app.store_new_list = function()
    {
        console.log("store_new_list called");
        var text_list = _.map($("#current-list p.list-group-item-text"), function(e){ return e.innerText; });
        
        Kinvey.DataStore.save(k_collection_name, {"list":text_list}, {success:prepend_new_list, error:error.get_error_f("data did not store")});
        
    };
    
    var list_record_template = '<a class="list-group-item allow-badge" data-kid="%s">'
                                + '<span class="delete-item badge glyphicon glyphicon-trash"></span>'
                                + '<h4 class="list-group-item-heading">%s</h4>'
                                + '<p class="list-group-item-text">%s</p>'
                                + '</a>';
    
    function prepend_new_list(d)
    {
        //console.log("appending new list", d);
        var list_name = _.first(d.list);
        var list_abbreviated = _.reduce(d.list, function(s1,s2){ return s1 + " " + s2; });
        var list_record_string = utils.sprintf(list_record_template, d._id, list_name, list_abbreviated);
        var recordNode = $(list_record_string)[0];
        $("#list-record").prepend(recordNode); 
        //event handler
        add_record_event_handlers($(recordNode));
        //
        app.privileged.current_kid = d._id;
    }

    function activate_list_by_data(data, check_current_p)
    {
        if(!check_current_p || !record.is_recording())
        {
            record.setup_list(data.list, data._id);
            app.privileged.current_kid = data._id;
        }
    }
    
    function activate_list_by_node($recordNode)
    {
        var kid = $recordNode.attr("data-kid");
        var happiness = function(data){ /*record.setup_list(data.list, kid);*/ activate_list_by_data(data, true); };
        var sadness   = error.get_error_f("so sorry, unable to retrieve list");
        Kinvey.DataStore.get(k_collection_name, kid, {success:happiness, error:sadness});
    }
    
    function add_record_event_handlers($recordNode)
    {
        $recordNode.find(".delete-item").click(get_delete_record_f($recordNode));
        $recordNode.click(function(){ activate_list_by_node($recordNode); });
    }
    
    function get_delete_record_f($recordNode)
    {
        return function(evt)
        {
            evt.preventDefault(); evt.stopPropagation();
            console.log("deleting, ", $recordNode,  $recordNode.attr("data-kid"));
            var kid = $recordNode.attr("data-kid");
            $recordNode.remove();
            //TODO:  update remote list.
            remove_record(kid);
        };
    }
    
    function remove_record(kid)
    {
        var happy = function(d){ console.log("happiness deleting", d); };
        Kinvey.DataStore.destroy(k_collection_name, kid, {success:happy, error:error.get_error_f("trouble deleting")});
    }
    
    app.update_current_list = function(kid)
    {
        if(kid)
        {  
            console.log("Let's update current list", kid);
            var text_list = _.map($("#current-list p.list-group-item-text"), function(e){ return e.innerText; });
            var happiness = function(d){ console.log("successfully stored", d); }
            
            Kinvey.DataStore.save(k_collection_name, {"list":text_list, "_id":kid }, {success:happiness, error:error.get_error_f("data did not store with update")});
            
            //TODO - update abbreviation of current record
        }
    };

    
})(); 