
shape_designer.filter.PortTypeFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.PortTypeFilter",
    
	init:function(){
	    this._super();
	    
	    this.type   =0;
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){

	   var _this = this;
	   $parent.append('<div id="'+this.cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_panel">'+
                	   '     Port Type'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '      <div class="btn-group dropdown">'+
                       '         <button id="'+this.cssScope+'_button" class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">'+
                       '              <span id="'+this.cssScope+'_label">'+figure.getInputType()+'</span>        '+
                       '              <span class="caret"></span></button>     '+
                       '              <ul class="dropdown-menu" id="select_'+this.cssScope+'_menu">'+
                       '                 <li><a href="#" data-type="Input"  >Input </a></li>'+
                       '                 <li><a href="#" data-type="Output" >Output</a></li>'+
                       '                 <li><a href="#" data-type="Hybrid" >Hybrid</a></li>'+
                       '              </ul>'+
                       '         </button>'+
                       '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

	       $('#select_'+this.cssScope+'_menu a').on("click", function(){
	           var $this = $(this);
	           var typeName = $this.data("type");
	           figure.setInputType(typeName);
	           $('#'+_this.cssScope+'_label').text(typeName);
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




