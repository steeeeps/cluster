
/*
 * author:steeeeps
 * email:steeeeps@gmail.com
 */
if (!dojo._hasResource['steeeeps.cluster']) {
    dojo._hasResource['steeeeps.cluster'] = true;
    dojo.provide("steeeeps.cluster");
    dojo.declare("steeeeps.ClusterGraphic", esri.Graphic, {
        /*
         * 实例化一个clusterGraphic,默认infotemplate,attribute全来自第一个graphic
         */
        constructor: function(map, graphicslayer, params){
            this._map = map;
            this._graphicsLayer = graphicslayer;
            this._graphics = []; //该聚合里包括的graphic
            this._clusterCenter = null; //该聚合的几何中心
            this._clusterExtent = null; //该聚合的几何范围
            this._gridExtent = null; //该聚合的网格范围(凡是在该范围的graphic都应该被聚合)
            this.isCluster = false; //是否含有聚合
            this._gridPixel = 200; //该聚合格网范围的像素值
            this._classifySymols = params.classifySymols || this._defaultClassifySymols();
            this._pushGraphic(params.graphic);
            this._updateGridExtent();
            dojo.mixin(this, params.graphic);
        },
        /*
         * 向该clusterGraphic添加一个graphic
         */
        addGraphic: function(graphic){
            this._pushGraphic(graphic);
            this._updateGridExtent();
            this.isCluster = true;
            this.setInfoTemplate(null);
            this.updateSymbol();
        },
        /*
         * 获得该聚合的中心点位
         */
        getClusterCenter: function(){
            return this._clusterCenter;
        },
        /*
         * 获得该聚合的几何范围
         */
        getClusterExtent: function(){
            return this._clusterExtent;
        },
        /*
         * 是否是第一级聚合:第一级可以设置鼠标单击，移入移出动画
         */
        isFirstClusterLevel: function(){
            return (this._graphics.length > 1 && this._graphics.length <= 10);
        },
        /*
         * 获取聚合内的所有graphics
         */
        getGraphics: function(){
            return this._graphics;
        },
        /*
         * 把添加的graphic加入内部的graphic数组和，几何点数组
         */
        _pushGraphic: function(graphic){
            if (!this._multiGeo) //该聚合里所含的graphic的geometry,用来得到该聚合的中心点位
                this._multiGeo = new esri.geometry.Multipoint(graphic.geometry.spatialReference);
            this._graphics.push(graphic);
            this._multiGeo.addPoint(graphic.geometry);
            this._updateClusterCenter();
        },
        /*
         * 更新聚合的几何中心
         */
        _updateClusterCenter: function(){
            this._clusterExtent = this._multiGeo.getExtent();
            this._clusterCenter = this._clusterExtent.getCenter();
            this.setGeometry(this._clusterCenter);
        },
        /*
         * 更新该聚合的聚合范围
         */
        _updateGridExtent: function(){
            var scpoint = new esri.geometry.toScreenGeometry(this._map.extent, this._map.width, this._map.height, this._clusterCenter);
            var xmax = scpoint.x + this._gridPixel / 2;
            var xmin = scpoint.x - this._gridPixel / 2;
            var ymax = scpoint.y + this._gridPixel / 2;
            var ymin = scpoint.y - this._gridPixel / 2;
            this._gridExtent = new esri.geometry.Extent(xmin, ymin, xmax, ymax);
        },
        /*
         * 判断该graphic是否在该聚合的聚合范围内
         */
        isGraphicInGridExtent: function(graphic){
            var scpoint = new esri.geometry.toScreenGeometry(this._map.extent, this._map.width, this._map.height, graphic.geometry);
            return this._gridExtent.contains(scpoint);
        },
        /*
         * 更新聚合符号
         */
        updateSymbol: function(){
            var count = this._graphics.length;
            this._updateClassifySymol(count);
            this._updateTextSymbol(count);
        },
        /*
         * 更新聚合的点状符号
         */
        _updateClassifySymol: function(count){
            if (count > 1 && count <= 10 && this.symbol != this._classifySymols.less10) 
                this.setSymbol(this._classifySymols.less10);
            if (count > 10 && count <= 25 && this.symbol != this._classifySymols.less25) 
                this.setSymbol(this._classifySymols.less25);
            if (count > 25 && count <= 50 && this.symbol != this._classifySymols.less50) 
                this.setSymbol(this._classifySymols.less50);
            if (count > 50 && this.symbol != this._classifySymols.over50) 
                this.setSymbol(this._classifySymols.over50);
        },
        /*
         * 更新聚合的个数文本符号
         */
        _updateTextSymbol: function(count){
            if (!this._textSbl) {
                this._textSbl = new esri.symbol.TextSymbol(2).setOffset(0, -5);
                this._textGra = new esri.Graphic(this._clusterCenter, this._textSbl);
                this._graphicsLayer.add(this._textGra);
            }
            else {
                this._textSbl.setText(count);
                this._textGra.setGeometry(this._clusterCenter);
            }
        },
        /*
         * 默认的分级符号
         */
        _defaultClassifySymols: function(){
            return {
                less10: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 25, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 250, 250, 0.8]), 2), new dojo.Color([249, 238, 118, 0.8])),
                less25: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 35, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 250, 250, 0.8]), 2), new dojo.Color([0, 191, 255, 0.8])),
                less50: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 35, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 250, 250, 0.8]), 2), new dojo.Color([30, 144, 255, 0.8])),
                over50: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 50, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 250, 250, 0.8]), 2), new dojo.Color([255, 0, 0, 0.8]))
            }
        }
    });
    
    dojo.declare("steeeeps.ClusterLayer", esri.layers.GraphicsLayer, {
        constructor: function(params){
            dojo.mixin(this, params);
            if (!dojo.isArray(this.esriGraphics)) 
                this.esriGraphics = [];
            
            dojo.connect(this.map, 'onZoomStart', dojo.hitch(this, this._handleMapZoomStart));
            dojo.connect(this.map, 'onExtentChange', dojo.hitch(this, this._handleMapExtentChange));
            dojo.connect(this, "onLoad", this._handleLayerLoaded);
            dojo.connect(this, "onMouseOver", this._handleMouseOver);
            dojo.connect(this, "onMouseOut", this._handleMouseOut);
            dojo.connect(this, "onClick", this._handleMouseClick);
            
            this._initLayer();
        },
        
        /*
         * 绘制聚合
         */
        _makeClusters: function(){
            this.clear();
            for (var i = 0; i < this.esriGraphics.length; i++) {
                var g = this.esriGraphics[i];
                var mapwkid = this.map.spatialReference.wkid;
                var gwkid = g.geometry.spatialReference.wkid;
                if (mapwkid == gwkid) {
                    this._isGraphicInCurrentMapExtent(g) && this._addGraphicToCluster(g);
                }
                else {
                    if (mapwkid == 102100) 
                        g.geometry = esri.geometry.geographicToWebMercator(g.geometry);
                    else 
                        if (mapwkid == 4326) 
                            g.geometry = esri.geometry.webMercatorToGeographic(g.geometry);
                        else 
                            throw "请使用102100, 4326 空间参考";
                    this._isGraphicInCurrentMapExtent(g) && this._addGraphicToCluster(g);
                }
            }
        },
        /*
         * 添加graphic到聚合
         */
        _addGraphicToCluster: function(graphic){
            var closestCluster = null;
            for (var i = 0; i < this.graphics.length; i++) {
                var c = this.graphics[i];
                if (typeof c.isCluster === "undefined") 
                    continue;
                if (c.isGraphicInGridExtent(graphic)) {
                    closestCluster = c;
                    break;
                }
            }
            if (closestCluster) {
                closestCluster.addGraphic(graphic);
            }
            else {
                var clusterGraphic = new steeeeps.ClusterGraphic(this.map, this, {
                    graphic: graphic
                });
                !clusterGraphic.symbol && clusterGraphic.setSymbol(this._defaultMarkerSymbol());
                this.add(clusterGraphic);
            }
        },
        /*
         * 判断graphic是否在当前地图范围内
         */
        _isGraphicInCurrentMapExtent: function(graphic){
            return this.map.extent.contains(graphic.geometry);
        },
        /*
         * 第一级聚合鼠标移入响应
         */
        _clusterMouseOverHandle: function(event){
            this.onClusterMouseOver(event);
        },
        /*
         * 第一级聚合鼠标移出响应
         */
        _clusterMouseOutHandle: function(event){
            this.onClusterMouseOut(event);
        },
        /*
         * 第一级聚合鼠标单击响应
         */
        _clusterClickHandle: function(event){
            this.onClusterClick(event)
        },
        /*
         * 普通graphic鼠标单击响应
         */
        _graphicClickHandle: function(event){
            this.onGraphicClick(event);
        },
        /*
         * 添加graphic
         */
        addGraphic: function(graphic){
            this.esriGraphics.push(graphic);
            this._addGraphicToCluster(graphic);
        },
        /*
         * 图层加载完毕响应
         */
        _handleLayerLoaded: function(layer){
            this._makeClusters();
        },
        /*
         * 地图开始缩放响应
         */
        _handleMapZoomStart: function(){
            this.clear();
        },
        /*
         * 地图范围改变响应
         */
        _handleMapExtentChange: function(){
            this._makeClusters();
        },
        /*
         * graphic鼠标移动响应
         */
        _handleMouseOver: function(event){
            var g = event.graphic;
            var type = this._getGraphicType(g);
            type == steeeeps.ClusterLayer.GRAPHIC_TYPE_FIRSTLEVELCLUSTER && this._clusterMouseOverHandle(event);
        },
        /*
         * graphic鼠标移出响应
         */
        _handleMouseOut: function(event){
            var g = event.graphic;
            var type = this._getGraphicType(g);
            type == steeeeps.ClusterLayer.GRAPHIC_TYPE_FIRSTLEVELCLUSTER && this._clusterMouseOutHandle(event);
        },
        /*
         * graphic鼠标单击响应
         */
        _handleMouseClick: function(event){
            var g = event.graphic;
            var type = this._getGraphicType(g);
            type == steeeeps.ClusterLayer.GRAPHIC_TYPE_FIRSTLEVELCLUSTER && this._clusterClickHandle(event);
            type == steeeeps.ClusterLayer.GRAPHIC_TYPE_ESRIGRAPHIC && this._graphicClickHandle(event);
        },
        /*
         * graphic默认符号
         */
        _defaultMarkerSymbol: function(){
            return new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 15, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 250, 250, 1]), 1), new dojo.Color([249, 238, 118, 1]));
        },
        /*
         * 获取graphic类型
         */
        _getGraphicType: function(graphic){
            if (graphic.symbol.type == 'textsymbol' || graphic.symbol.type == 'simplelinesymbol') 
                return steeeeps.ClusterLayer.GRAPHIC_TYPE_OTHERGRAPHIC;
            if (graphic.isCluster && graphic.isFirstClusterLevel()) 
                return steeeeps.ClusterLayer.GRAPHIC_TYPE_FIRSTLEVELCLUSTER;
            if (graphic.isCluster) 
                return steeeeps.ClusterLayer.GRAPHIC_TYPE_CLUSTER;
            else 
                return steeeeps.ClusterLayer.GRAPHIC_TYPE_ESRIGRAPHIC;
        },
        onClusterMouseOver: function(){
        
        },
        onClusterMouseOut: function(){
        
        },
        onClusterClick: function(){
        
        },
        onGraphicClick: function(){
        
        }
    });
    dojo.mixin(steeeeps.ClusterLayer, {
        GRAPHIC_TYPE_CLUSTER: "clusterGraphic",
        GRAPHIC_TYPE_FIRSTLEVELCLUSTER: "firstLevelCluster",
        GRAPHIC_TYPE_ESRIGRAPHIC: "esriGraphic",
        GRAPHIC_TYPE_OTHERGRAPHIC: "other"
    });
}
