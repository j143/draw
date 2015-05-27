
shape_designer.filter.PositionFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.PositionFilter",
    
	init:function(){
	    this._super();
	    this.block = false;
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="position_filter_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#position_width_panel">'+
                	   '     Position'+
                	   '</div>'+
                	   ' <div class="panel-body" id="position_width_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '       <input id="filter_position_x" type="text" value="'+figure.getPosition().x+'" name="filter_position_x" class="form-control" />'+
                       '       <input id="filter_position_y" type="text" value="'+figure.getPosition().y+'" name="filter_position_y" class="form-control" />'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

           $("#filter_position_x").TouchSpin({
               min: 0,
               max: 3000,
               step: 1,
               maxboostedstep: 10,
               postfix: 'X'
           });

           $("#filter_position_y").TouchSpin({
               min: 0,
               max: 3000,
               step: 1,
               maxboostedstep: 10,
               postfix: 'Y'
           });

           $("input[name='filter_position_x']").on("change", $.proxy(function(){
               try{
                   this.block = true;
                   var pos = figure.getPosition();
                   figure.setPosition(parseInt($("input[name='filter_position_x']").val()), pos.y);
               }
               finally{
                   this.block = false;
               }
               
           },this));

           $("input[name='filter_position_y']").on("change", $.proxy(function(){
               try{
                   this.block = true;
                   var pos = figure.getPosition();
                   figure.setPosition(pos.x,parseInt($("input[name='filter_position_y']").val()));
               }
               finally{
                   this.block = false;
               }
           },this));
	   },

	   apply:function(figure, attributes){
	       if(this.block===true){
	           return;
	       }
           var pos = figure.getPosition();
           $("input[name='filter_position_y']").val(pos.y);
           $("input[name='filter_position_x']").val(pos.x);
	   },

	   removePane:function(){
	   },
	   
	   onInstall:function(figure){
	     //   figure.setFontSize(1);
	   }

});




