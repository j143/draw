
shape_designer.filter.PortDirectionFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.PortDirectionFilter",
    
	init:function(){
	    this._super();
	    
	    this.type   =0;
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){
	   var _this = this; 
       var dir2label ={"0":"Up","1":"Right","2":"Down","3":"Left", "null":"Calculated"};
	   $parent.append('<div id="'+this.cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_panel">'+
                	   '     Port Direction'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '      <div class="btn-group dropdown">'+
                       '         <button id="'+this.cssScope+'_button" class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">'+
                       '              <span id="'+this.cssScope+'_label">'+dir2label[""+figure.getConnectionDirection()]+'</span>        '+
                       '              <span class="caret"></span></button>     '+
                       '              <ul class="dropdown-menu" id="select_'+this.cssScope+'_menu">'+
                       '                 <li><a href="#" data-dir="0">Up</a></li>'+
                       '                 <li><a href="#" data-dir="1">Right</a></li>'+
                       '                 <li><a href="#" data-dir="2">Down</a></li>'+
                       '                 <li><a href="#" data-dir="3">Left</a></li>'+
                       '                 <li><a href="#" data-dir="null">Calculated</a></li>'+
                       '              </ul>'+
                       '         </button>'+
                       '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

	       $("#select_"+_this.cssScope+"_menu a").on("click", function(){
	           var $this = $(this);
               var dir = $this.data("dir");
               var label = dir2label[""+dir];
	           figure.setConnectionDirection(dir);
	           $("#"+_this.cssScope+"_label").text(label);
	       });
	   },
	   
	    

		removePane : function() {
		},

		onInstall : function(figure) {
		},

		getPersistentAttributes : function(relatedFigure) {
			var memento = this._super(relatedFigure);

			return memento;
		},

		setPersistentAttributes : function(relatedFigure, memento) {
			this._super(relatedFigure, memento);

			return memento;
		}
});




