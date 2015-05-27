
shape_designer.filter.RadiusFilter = shape_designer.filter.Filter.extend({
    NAME : "shape_designer.filter.RadiusFilter",
	
	init:function(){
	    this._super();
	},
	
	insertPane: function(figure, $parent){
	    
	       $parent.append('<div id="radius_container" class="panel panel-default">'+
                   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#radius_panel">'+
                   '    Corner Radius'+
                   '    <span id="button_remove_RadiusFilter" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                   '</div>'+
                   ' <div class="panel-body collapse in" id="radius_panel">'+
                   '   <div class="form-group">'+
                   '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                   '      <div class="input-group">'+
                   '         <input class="form-control" id="filter_radius" type="text" value="'+figure.getRadius()+'" />'+
                   '      </div>'+
                   '   </div>'+
                   ' </div>'+
                   '</div>');

           $("#filter_radius").TouchSpin({
               min: 0,
               max: 200,
               step: 1,
               maxboostedstep: 10,
               postfix: 'px'
           });
           $("#filter_radius").on("change", $.proxy(function(){
               this.setRadius(parseInt($("#filter_radius").val()));
           },figure));
           
           $("#button_remove_RadiusFilter").on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setRadius(0);
               $("#radius_container").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#radius_container').remove();});
           },this));
	   },
	   
	   removePane:function(){
	   }
	

});




