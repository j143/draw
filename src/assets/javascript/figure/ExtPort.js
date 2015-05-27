shape_designer.figure.ExtPort = draw2d.shape.basic.Circle.extend({
    
    NAME: "shape_designer.figure.ExtPort",
    
    isExtFigure: true,

    init:function()
    {
      this._super({diameter:10});

      this.decoration = null;
      
      this.setUserData({
    	  name:"Port",
    	  type:"Hybrid",
    	  direction:null
    		  });
      
      this.filters   = new draw2d.util.ArrayList();
      this.filters.add( new shape_designer.filter.PositionFilter());
      this.filters.add( new shape_designer.filter.PortDirectionFilter());
      this.filters.add( new shape_designer.filter.PortTypeFilter());

      this.installEditPolicy(new draw2d.policy.figure.AntSelectionFeedbackPolicy());
    },
    

    setInputType: function(type){
    	this.getUserData().type = type;
    },
    
    getInputType: function(){
    	return this.getUserData().type;
    },

    setConnectionDirection: function(direction){
        this.getUserData().direction = direction;
        this.updateDecoration();
    },
    
    getConnectionDirection: function(){
        return this.getUserData().direction;
    },

    
    updateDecoration:function(){
        if(this.decoration!==null){
            this.remove(this.decoration);
            this.decoration = null;
        }
        var figure =null;
        var locator = null;
        switch(this.getConnectionDirection()){
            case 0:
                figure = new draw2d.shape.icon.ArrowUp({width:8, height:8, opacity:0.5});
                locator= new draw2d.layout.locator.TopLocator();
                break;
            case 1:
                figure = new draw2d.shape.icon.ArrowRight({width:8, height:8, opacity:0.5});
                locator= new draw2d.layout.locator.RightLocator();
                break;
            case 2:
                figure = new draw2d.shape.icon.ArrowDown({width:8, height:8, opacity:0.5});
                locator= new draw2d.layout.locator.BottomLocator();
                break;
            case 3:
                figure = new draw2d.shape.icon.ArrowLeft({width:8, height:8, opacity:0.5});
                locator= new draw2d.layout.locator.LeftLocator();
                break;
        }
        if(figure!==null){
            this.add(figure, locator);
            this.decoration = figure;
        }
    },
    
    getPotentialFilters: function(){
        return [
                {label:"Port Type",      impl:"shape_designer.filter.PortTypeFilter"},
                {label:"Port Direction", impl:"shape_designer.filter.PortDirectionFilter"},
                {label:"Color",          impl:"shape_designer.filter.FillColorFilter"},
                
                ];
    },

    removeFilter:function(filter){
      this.filters.remove(filter);  
    },

    addFilter:function(filter){
        var alreadyIn = false;
        
        this.filters.each($.proxy(function(i,e){
            alreadyIn = alreadyIn || (e.NAME===filter.NAME);
        },this));
        if(alreadyIn===true){
            return; // silently
        }
        
        this.filters.add(filter);  
        filter.onInstall(this);
        this.repaint();
    },
      
    
    /**
     * @method
     * Trigger the repaint of the element.
     * 
     */
    repaint:function(attributes)
    {
        if(this.shape===null){
            return;
        }

        if(typeof attributes === "undefined"){
            attributes = {};
        }
        
         
        
        this.filters.each($.proxy(function(i,filter){
            filter.apply(this, attributes);
        },this));
        
        this._super(attributes);
    },

    getPersistentAttributes : function()
    {   
        var memento = this._super();
        
        memento.filters = [];
        this.filters.each($.proxy(function(i,e){
            var filterMemento = e.getPersistentAttributes(this);
            memento.filters.push(filterMemento);
        },this));
 
        return memento;
    },
    
    setPersistentAttributes : function( memento)
    {
        this._super(memento);
        

        if(typeof memento.filters !=="undefined"){
            this.filters = new draw2d.util.ArrayList();
            $.each(memento.filters, $.proxy(function(i,e){
                var filter = new window[e.name]();//eval("new "+e.name+"()");
                filter.setPersistentAttributes(this, e);
                this.filters.add(filter);
            },this));
        }
        this.updateDecoration();
    }
});
