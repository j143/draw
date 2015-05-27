
shape_designer.policy.SelectionToolPolicy = draw2d.policy.canvas.BoundingboxSelectionPolicy.extend({
	
	init:function(){
	    this._super();
	},
	
    onInstall: function(canvas){
        this.setToolHeader("Selection", "SELECT_TOOL_064.png");
    	this.setToolText("Click on shape to select<br>Double click to edit");
    },


    setToolHeader: function(heading, icon ){
        $("#currentTool_image").attr({"src": "./assets/images/tools/"+icon});
        $("#currentTool_heading").text(heading);
    },

    setToolText: function( message ){
        $("#currentTool_message").html(message);
	}
});
