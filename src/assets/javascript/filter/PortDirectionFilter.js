
shape_designer.filter.PortDirectionFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.PortDirectionFilter",
    
	init:function(){
	    this._super();
	    
	    this.type   =0;
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){
	   var _this = this;
	   var dir = figure.getConnectionDirection();
	   $parent.append('<div id="'+this.cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_panel">'+
                	   '     Connection Direction'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_panel">'+
                	   '   <div class="form-group portDirectionOption">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings

		               '<label>'+
					   '  <input '+(dir===0?' checked="checked"':'')+' type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-dir="0" />'+
		               '  <span  title="up" class="glyphicon glyphicon-arrow-up"></span>'+
					   '</label>'+

                       '<br>'+

                       '<label>'+
                       '  <input '+(dir===3?' checked="checked"':'')+'type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-dir="3" />'+
                       '  <span  title="left" class="glyphicon glyphicon-arrow-left"></span>'+
                       '</label>'+

                       '<label>'+
                       '  <input '+(dir===null?' checked="checked"':'')+'type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-dir="null" />'+
                       '  <span title="automatic" class="glyphicon glyphicon-screenshot"></span>'+
                       '</label>'+

					   '<label>'+
					   '  <input '+(dir===1?' checked="checked"':'')+'type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-dir="1" />'+
					   '  <span title="right"  class="glyphicon glyphicon-arrow-right"></span>'+
					   '</label>'+

                       '<br>'+

					   '<label>'+
					   '  <input '+(dir==2?' checked="checked"':'')+'type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-dir="2" />'+
					   '  <span  title="down" class="glyphicon glyphicon-arrow-down"></span>'+
					   '</label>'+


		               '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

		   $("#"+_this.cssScope+"_panel .portDirectionOption input").on("change", function(){
			   var $this = $(this);
			   var dir = $this.data("dir");
			   figure.setConnectionDirection(dir);
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




