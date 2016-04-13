
shape_designer.filter.PortTypeFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.PortTypeFilter",
    
	init:function(){
	    this._super();
	    
	    this.type   =0;
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){

	   var _this = this;
	   var type =figure.getInputType();
	   $parent.append('<div id="'+this.cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_panel">'+
                	   '     Port Type'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_panel">'+
                	   '   <div class="form-group portTypeOption">'+

						   '<label>'+
						   '  <input '+(type=='Input'?' checked="checked"':'')+'type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-type="Input" />'+
						   '  <span  title="down" class="icon ion-log-in">input</span>'+
						   '</label>'+
						   '<br>'+
						   '<label>'+
						   '  <input '+(type=='Output'?' checked="checked"':'')+'type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-type="Output" />'+
						   '  <span  title="down" class="icon ion-log-out">output</span>'+
						   '</label>'+
	                       '<br>'+
						   '<label>'+
						   '  <input '+(type=='Hybrid'?' checked="checked"':'')+'type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-type="Hybrid" />'+
						   '  <span  title="down" class="icon ion-ios-circle-outline">unspecified</span>'+
						   '</label>'+

					   '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

	       $("#"+_this.cssScope+"_panel .portTypeOption input").on("change", function(){
	           var $this = $(this);
	           var typeName = $this.data("type");
	           figure.setInputType(typeName);
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




