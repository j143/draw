
shape_designer.filter.FontColorFilter = shape_designer.filter.Filter.extend({
	NAME : "shape_designer.filter.FontColorFilter",
	
	init:function(){
	    this._super();
	    this.colorPicker = null;
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="fill_color_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#color_fill_panel">'+
                	   '    Font Color'+
                       '    <span id="button_remove_FillColorFilter" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   ' </div>'+
                	   
                	   ' <div class="panel-body collapse in" id="color_fill_panel">'+
                       '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '      <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="filter_color_fill" type="text" value="" name="filter_color_fill" class="form-control color"/>'+
                       '       </div>'+
                       '    </div>'+
                       ' </div>'+
                	   '</div>');
           
           var picker = this.colorPicker  = new jscolor.color(document.getElementById('filter_color_fill'), {});
           this.colorPicker.fromString(figure.getFontColor().hash());
           this.colorPicker.onImmediateChange= $.proxy(function(){
              this.setFontColor("#"+picker.toString());
           },figure);
           
           $("#button_remove_FillColorFilter").on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setFontColor(null);
               $("#fill_color_container").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#fill_color_container').remove();});
           },this));
	},
	  
	onInstall:function(figure){
        figure.setFontColor("#000000");
	},
	
	removePane:function(){
	    if(this.colorPicker !==null){
	        this.colorPicker.hidePicker();
	    }
	}
	

});




