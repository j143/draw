
shape_designer.policy.RectangleToolPolicy = shape_designer.policy.AbstractToolPolicy.extend({
	
	init:function(){
	    this._super();
	    
	    this.topLeftPoint = null;
        this.boundingBoxFigure1 = null;
        this.boundingBoxFigure2 = null;
	},

    
    onInstall: function(canvas){
        this.setToolHeader("Diagonal Polygon", "POLYGON_DIAGONALS_064.png");
        this.setToolText("Select first corner of rectangle");
        canvas.setCursor("cursor_rectangle.png");
    },
    
    onUninstall: function(canvas){
        if(this.boundingBoxFigure1 !==null){
            this.boundingBoxFigure1.setCanvas(null);
            this.boundingBoxFigure1 = null;
            this.boundingBoxFigure2.setCanvas(null);
            this.boundingBoxFigure2 = null;
        }
        canvas.setCursor(null);
    },
   
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @param {Boolean} shiftKey true if the shift key has been pressed during this event
     * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
     */
    onMouseDown:function(canvas, x, y, shiftKey, ctrlKey){

    },
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse event
     * @param {Number} y the y-coordinate of the mouse event
     * @template
     */
    onMouseMove:function(canvas, x, y){
       
        if (this.boundingBoxFigure1!==null) {
            var dx = this.topLeftPoint.x -x;
            var dy = this.topLeftPoint.y -y;
            this.boundingBoxFigure1.setDimension(Math.abs(dx),Math.abs(dy));
            this.boundingBoxFigure1.setPosition(x + Math.min(0,dx), y + Math.min(0,dy));
            this.boundingBoxFigure2.setDimension(Math.abs(dx),Math.abs(dy));
            this.boundingBoxFigure2.setPosition(x + Math.min(0,dx), y + Math.min(0,dy));
        }
    },
    
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} dx The x diff between start of dragging and this event
     * @param {Number} dy The y diff between start of dragging and this event
     * @param {Number} dx2 The x diff since the last call of this dragging operation
     * @param {Number} dy2 The y diff since the last call of this dragging operation
     * @template
     */
    onMouseDrag:function(canvas, dx, dy, dx2, dy2){
    },
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @template
     */
    onMouseUp: function(canvas, x, y){
        if(this.topLeftPoint===null){
            this.topLeftPoint = new draw2d.geo.Point(x,y);
            this.setToolText("Select second corner of rectangle");

            this.boundingBoxFigure1 = new draw2d.shape.basic.Rectangle({width:1,height:1});
            this.boundingBoxFigure1.setPosition(x,y);
            this.boundingBoxFigure1.setCanvas(canvas);
            this.boundingBoxFigure1.setBackgroundColor("#333333");
            this.boundingBoxFigure1.setAlpha(0.1);
            
            this.boundingBoxFigure2 = new draw2d.shape.basic.Rectangle({width:1,height:1});
            this.boundingBoxFigure2.setPosition(x,y);
            this.boundingBoxFigure2.setCanvas(canvas);
//            this.boundingBoxFigure2.setDashArray("- ");
            this.boundingBoxFigure2.setStroke(1);
            this.boundingBoxFigure2.setColor(new draw2d.util.Color("#333333"));
            this.boundingBoxFigure2.setBackgroundColor(null);
        }
        else{
            var bottomRight = new draw2d.geo.Point(x,y);
            var rect =new shape_designer.figure.PolyRect(this.topLeftPoint, bottomRight);
            var command = new draw2d.command.CommandAdd(canvas, rect, rect.getX(), rect.getY());
            canvas.getCommandStack().execute(command);
            this.topLeftPoint = null;
            this.setToolText("Select first corner of rectangle");

            this.boundingBoxFigure1.setCanvas(null);
            this.boundingBoxFigure1 = null;
            this.boundingBoxFigure2.setCanvas(null);
            this.boundingBoxFigure2 = null;
}
    }
});




