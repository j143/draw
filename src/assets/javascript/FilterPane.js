/* jshint evil:true */

shape_designer.FilterPane = Class.extend({
	
    DEFAULT_LABEL : "Properties",
    
	init:function(app, elementId, view){
		this.html = $("#"+elementId);
		this.view = view;
		this.currentFigure = null;

		// Register a Selection listener for the state handling
		// of the Delete Button
		//
        view.on("select", $.proxy(this.onSelectionChanged,this));
	},

	/**
	 * @method
	 * Called if the selection in the canvas has been changed. You must register this
	 * class on the canvas to receive this event.
	 * 
     * @param {draw2d.Canvas} canvas the emitter of the event. In this case it is the canvas.
     * @param {draw2d.Figure} figure
	 */
	onSelectionChanged : function(canvas, event){
	    var figure = event.figure;

	    this.html.html('');
	    $('#add_filter_button').addClass('disabled');
	    
	    if(this.currentFigure!==null && typeof this.currentFigure.isExtFigure !=="undefined"){
	        this.currentFigure.filters.each($.proxy(function(i,filter){
	            filter.removePane();
	        },this));
	    }
	    $("#add_filter_action_menu").html("");
	    
	    if(figure!==null &&  typeof figure.isExtFigure  !=="undefined"){
            figure.filters.each($.proxy(function(i,filter){
                filter.insertPane(figure,this.html);
            },this));
            $('#add_filter_button').removeClass('disabled');

            $.each(figure.getPotentialFilters(), function(i,e){
                $("#add_filter_action_menu").append("<li><a href='#' data-filter='"+e.impl+"' >"+e.label+"</a></li>");
            });
                    
            var _this = this;
            $("#add_filter_action_menu a").on("click", function(){
                var $this = $(this);
                var filterName = $this.data("filter");
                var filter = eval("new "+filterName+"()");
                _this.currentFigure.addFilter(filter);
                _this.onSelectionChanged(_this.view,{figure:_this.currentFigure});
            });
	    }

	    this.currentFigure = figure;	    
	}
});