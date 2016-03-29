/* jshint evil:true */

shape_designer.Breadcrumb = Class.extend({
	

	init:function(app, elementId)
	{
		this.html = $("#"+elementId);
	},

	/**
	 * @method
	 * Called if the selection in the canvas has been changed. You must register this
	 * class on the canvas to receive this event.
	 * 
     * @param {draw2d.Canvas} canvas the emitter of the event. In this case it is the canvas.
     * @param {draw2d.Figure} figure
	 */
	update : function(storage)
	{
		var path="UnsavedDocument.shape";
		if(storage.currentFileHandle!==null) {
			path = storage.currentPath.replace(/\//g, "<span class='separator'>/</span>");
			path = path + "<span class='separator'>/</span><span class='filename'>" + storage.currentFileHandle.title + "</span>";
			path = "<span class='separator'>/</span>	<span class='ion-social-github'>&nbsp;</span>" + storage.currentRepository.name + "<span class='separator'>/</span>" + path;
		}
		path = path + "<span class='icon ion-ios-gear-outline'></span>";
		this.html.html(path);

		$("#breadcrumb .icon").on("click",function(){
			new shape_designer.dialog.ShapeSettings().show(app);
		});

	}
});


