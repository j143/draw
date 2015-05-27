
shape_designer.filter.FontSizeFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.FontSizeFilter",
    
	init:function(){
	    this._super();
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="fontsize_filter_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#fontsize_width_panel">'+
                	   '     Font Size'+
                       '    <span id="button_remove_FontSizeFilter" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="fontsize_width_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                 	   '       <input id="filter_fontsize" type="text" value="'+figure.getFontSize()+'" name="filter_fontsize" class="form-control" />'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

           $("#filter_fontsize").TouchSpin({
               min: 4,
               max: 300,
               step: 1,
               boostat: figure.getFontSize(),
               maxboostedstep: 10,
               postfix: 'px'
           });

           $("input[name='filter_fontsize']").on("change", $.proxy(function(){
               this.setFontSize(parseInt($("input[name='filter_fontsize']").val()));
           },figure));

           
           $("#button_remove_FontSizeFilter").on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setFontSize(12);
               $("#fontsize_filter_container").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#fontsize_filter_container').remove();});
           },this));

	   },
	   
	   removePane:function(){
	   },
	   
	    onInstall:function(figure){
	     //   figure.setFontSize(1);
	    }

});




