
shape_designer.Layer = Class.extend({
	
	NAME: "shape_designer.Layer",

	init:function(app, elementId, view){
		this.html = $("#"+elementId);
		this.view = view;
		
		// register this class as event listener for the canvas
		// CommandStack. This is required to update the state of 
		// the Undo/Redo Buttons.
		//
		view.getCommandStack().addEventListener(this);

		// Register a Selection listener for the state hnadling
		// of the Delete Button
		//
        view.on("select", $.proxy(this.onSelectionChanged,this));
	},

	/**
	 * @method
	 * Called if the selection in the cnavas has been changed. You must register this
	 * class on the canvas to receive this event.
	 * 
	 * @param {draw2d.Figure} figure
	 */
	onSelectionChanged : function(emitter, event){
        this._updateSelection();
	},
	
	/**
	 * @method
	 * Sent when an event occurs on the command stack. draw2d.command.CommandStackEvent.getDetail() 
	 * can be used to identify the type of event which has occurred.
	 * 
	 * @template
	 * 
	 * @param {draw2d.command.CommandStackEvent} event
	 **/
	stackChanged:function(event)
	{
	    this.html.html('');
	    var figures = this.view.getExtFigures();
	    figures.each($.proxy(function(i, figure){
	        this.html.append(
	                '<div class="layerElement" data-figure="'+figure.id+'" id="layerElement_'+figure.id+'" >'+
	                   figure.getUserData().name +
	                   '<img data-figure="'+figure.id+'" class="layer_visibility pull-right" src="./assets/images/layer_visibility_'+figure.isVisible()+'.png">'+
                       '<img data-figure="'+figure.id+'" class="layer_edit pull-right" src="./assets/images/layer_edit.png">'+
	        		'</div>');
	    },this),true);
	    
	    this.html.sortable({
	        axis:"y",
	        update: $.proxy(function( event, ui ) {
	            $(".layerElement").reverse().each($.proxy(function(i,e){
	                this.view.getExtFigure($(e).data("figure")).toFront();
	            },this));

	        },this)
	    });
 
	    $(".layerElement img.layer_edit").on("click", $.proxy(function(event){
            var figure =this.view.getExtFigure($(event.target).data("figure"));
            bootbox.prompt({
                title: "Shape Name",
                value: figure.getUserData().name,
                callback: $.proxy(function(result) {
                    if (result !== null) {
                        figure.getUserData().name = result;
                        this.stackChanged(null);
                    }
                },this)
            });
 	    },this));

	    
	    $(".layerElement img.layer_visibility").on("click", $.proxy(function(event){
            var figure =this.view.getExtFigure($(event.target).data("figure"));
            figure.setVisible(!figure.isVisible());
            this.view.setCurrentSelection(null);
            $(event.target).attr({"src": "./assets/images/layer_visibility_"+figure.isVisible()+".png"});
        },this));

        $(".layerElement").on("click", $.proxy(function(event){
           var figure =this.view.getExtFigure($(event.target).data("figure"));
           if(figure.isVisible()){
               this.view.setCurrentSelection(figure);
           }
        },this));

        this._updateSelection();
	},
	
	_updateSelection: function(){
        $(".layerElement").removeClass("layerSelectedElement");
	    var selection = this.view.getSelection();
	    selection.each(function(i,e){
	        $("#layerElement_"+e.id).addClass("layerSelectedElement");
	    });
	}
});