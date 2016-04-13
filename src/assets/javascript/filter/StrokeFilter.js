
shape_designer.filter.StrokeFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.StrokeFilter",
    
	init:function(){
	    this._super();
	    this.colorPicker = null;
	},
	
	insertPane: function(figure, $parent){
       var cssScope = this.NAME.replace(/[.]/g, "_");
	    
	   $parent.append('<div id="'+cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+cssScope+'_width_panel">'+
                	   '     Stroke'+
                       '    <span id="button_remove_'+cssScope+'" class="btn btn-mini icon ion-ios-close-outline pull-right" ></span>'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+cssScope+'_width_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                 	   '       <input id="filter_'+cssScope+'_width" type="text" value="'+figure.getStroke()+'" name="filter_'+cssScope+'_width" class="form-control" />'+
                       '       <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="filter_'+cssScope+'_color" type="text" value="" name="stroke_'+cssScope+'_color" class="form-control color"/>'+
                       '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

	       $("input[name='filter_"+cssScope+"_width']").TouchSpin({
	           min: 0,
	           max: 50,
	           step: 1,
	           maxboostedstep: 1,
	           postfix: 'px'
	       });
           $("input[name='filter_"+cssScope+"_width']").on("change", $.proxy(function(){
               this.setStroke(parseInt($("input[name='filter_"+cssScope+"_width']").val()));
           },figure));

           
           var picker = this.colorPicker  = new jscolor.color(document.getElementById('filter_'+cssScope+'_color'), {});
           this.colorPicker.fromString(figure.getColor().hash());
           this.colorPicker.onImmediateChange= $.proxy(function(){
              this.setColor("#"+picker.toString());
           },figure);
           
           $("#button_remove_"+cssScope).on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setStroke(0);
               $("#"+cssScope+"_container").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#'+cssScope+'_container').remove();});
           },this));

	   },
	   
	   removePane:function(){
	       if(this.colorPicker !==null){
	           this.colorPicker.hidePicker();
	       }
	   },
	   
	    onInstall:function(figure){
	        figure.setStroke(1);
	    }

});




