
shape_designer.policy.PortToolPolicy = shape_designer.policy.SelectionToolPolicy.extend({
    
    TITLE: "Port",
    MESSAGE_STEP1 : "Select location to add port.<br>Click on port to move.",
    
    init:function(){
        this._super();
        
    },

    
    onInstall: function(canvas){
        this.setToolHeader(this.TITLE, "PORT_064.png");
        this.setToolText(this.MESSAGE_STEP1);
        canvas.setCursor("cursor_port.png");
    },
    
    onUninstall: function(canvas){
        canvas.setCursor(null);
    },
    
    
    select: function(canvas, figure){
      // check if the element an valid polygon. otherwise an boolean operation
        // isn't possible
        if(!(figure instanceof shape_designer.figure.ExtPort)){
            return;
        }

        this._super(canvas, figure);
    },
    
    onMouseDown:function(canvas, x, y, shiftKey, ctrlKey){
        var figure = canvas.getBestFigure(x, y);
        
        if(figure===null || figure instanceof shape_designer.figure.ExtPort){
            this._super(canvas,x,y,shiftKey, ctrlKey);
        }
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
        if(this.mouseDownElement===null || !this.mouseDownElement instanceof shape_designer.figure.ExtPort){
            var command = new draw2d.command.CommandAdd(canvas, new shape_designer.figure.ExtPort(), x, y);
            canvas.getCommandStack().execute(command);
        }
        else{
            this._super(canvas,x,y);
        }
    }   
});




