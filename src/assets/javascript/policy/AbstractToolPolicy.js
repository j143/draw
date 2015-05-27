shape_designer.policy.AbstractToolPolicy = draw2d.policy.canvas.SelectionPolicy.extend({
	
	init:function(){
	    this._super();
	},
	
   
    setToolHeader: function(heading, icon ){
        $('#currentTool_image').fadeOut(200, function() {
            $("#currentTool_image").attr({"src": "./icons/tools/"+icon});
            $('#currentTool_image').fadeIn(200);
        });
        $('#currentTool_heading').fadeOut(200, function() {
            $("#currentTool_heading").html(heading);
            $('#currentTool_heading').fadeIn(200);
        });
    },

    setToolText: function( message ){
        $('#currentTool_message').fadeOut(200, function() {
            $("#currentTool_message").html(message);
            $('#currentTool_message').fadeIn(200);
        });
    }
});




