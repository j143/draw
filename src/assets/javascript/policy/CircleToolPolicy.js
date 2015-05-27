
shape_designer.policy.CircleToolPolicy = shape_designer.policy.AbstractToolPolicy.extend({
	
    TITLE: "Circle",
    MESSAGE_STEP1 : "Select center of the circle",
    MESSAGE_STEP2 : "Select outer bound",
    
	init:function(){
	    this._super();
	    
	    this.center = null;
        this.boundingBoxFigure1 = null;
        this.boundingBoxFigure2 = null;
	},

    
    onInstall: function(canvas){
        this.setToolHeader(this.TITLE, "CIRCLE_1_064.png");
        this.setToolText(this.MESSAGE_STEP1);
        canvas.setCursor("cursor_circle.png");
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
     * @param {Number} x the x-coordinate of the mouse event
     * @param {Number} y the y-coordinate of the mouse event
     * @template
     */
    onMouseMove:function(canvas, x, y){
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
            var dx = Math.abs(this.center.x -x);
            this.boundingBoxFigure1.setRadius(dx);
            this.boundingBoxFigure2.setRadius(dx);
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
        if(this.center===null){
            this.center = new draw2d.geo.Point(x,y);
            this.setToolText(this.MESSAGE_STEP2);

            this.boundingBoxFigure1 = new draw2d.shape.basic.Circle({radius:1});
            this.boundingBoxFigure1.setCenter(x,y);
            this.boundingBoxFigure1.setCanvas(canvas);
            this.boundingBoxFigure1.setBackgroundColor("#333333");
            this.boundingBoxFigure1.setAlpha(0.1);
            
            this.boundingBoxFigure2 = new draw2d.shape.basic.Circle({radius:1});
            this.boundingBoxFigure2.setCenter(x,y);
            this.boundingBoxFigure2.setCanvas(canvas);
            this.boundingBoxFigure2.setStroke(1);
            this.boundingBoxFigure2.setColor(new draw2d.util.Color("#333333"));
            this.boundingBoxFigure2.setBackgroundColor(null);
        }
        else{
            var dx = Math.abs(this.center.x -x);
            var rect =new shape_designer.figure.PolyCircle(this.center,dx);
            var command = new draw2d.command.CommandAdd(canvas, rect, rect.getX(), rect.getY());
            canvas.getCommandStack().execute(command);
            this.center = null;
            this.setToolText(this.MESSAGE_STEP1);

            this.boundingBoxFigure1.setCanvas(null);
            this.boundingBoxFigure1 = null;
            this.boundingBoxFigure2.setCanvas(null);
            this.boundingBoxFigure2 = null;
        }
    }
});




