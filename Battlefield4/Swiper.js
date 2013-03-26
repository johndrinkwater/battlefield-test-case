var Swiper = (function(window, document){

    var $window = $(window);
    var _gr = Math.pow(1/(.5+Math.sqrt(5) * .5), 8);

    function Swiper(cfg){
        if(!inputController.hasInitialized) {
            inputController.init();
        }

        this.onReadyCallback = null;
        this.strokeCanvasRatio = .5;
        this.fadingRatio = .01;
        this.strokeWidth = 100;
        this.offsetTop = 0;
        this.offsetLeft = 0;

        this.isStarted = false;
        // simple mixin
        for(var key in cfg) {
            this[key] = cfg[key];
        }
        this._skipCount = 0;
        if(this.fadingRatio < _gr){
            // this._skipCountMax = Math.ceil(this.fadingRatio / _gr);
            // this.fadingRatio = _gr;

            this._skipCountMax = Math.ceil(_gr / this.fadingRatio);
            this.fadingRatio = _gr;
        } else if (this.fadingRatio) {
            this._skipCountMax = -1;
        } else {
            this._skipCountMax = 1;
        }

        this.onBoundResize = bind(onResize, this);
        this.onBoundRender = bind(_renderLoop, this);
    }

    var _p = Swiper.prototype;

    var isActive = _p.isActive = Swiper.isActive = (function(){
        // from Modernizr - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/canvas.js
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }());

    //https://github.com/mout/mout/blob/v0.1.0/src/function/bind.js
    function slice(arr, offset){
        return Array.prototype.slice.call(arr, offset || 0);
    }
    function bind(fn, context, args){
        var argsArr = slice(arguments, 2); //curried args
        return function(){
            return fn.apply(context, argsArr.concat(slice(arguments)));
        };
    }

    function init(){
        this.$elWidth = this.$el.width();
        this.$elHeight = this.$el.height();
        this.overlay = this.$el.find('.widget-swiper-overlay');
        this.originalWidth = this.$el.data('width');
        this.originalHeight = this.$el.data('height');
        $window.bind('resize orientationchange', this.onBoundResize);

        // return false if the browser doesn't support canvas element
        if(isActive){
            //preload images 
            this.baseImage = new Image();
            this.baseImage.src = this.$el.data('base');
            this.overlayImage = new Image();
            this.overlayImage.src = this.$el.data('overlay');
            this._checkImage(this.baseImage);
            this._checkImage(this.overlayImage);
            return true;
        } else {
            this._checkImage(this.overlayImage = this.overlay[0]);
            return false;
        }
    }

    function _checkImage(img){
        if(img.width) {
            img._loaded = true
            if(!this.isReady) {
                if(isActive) {
                    if(this.baseImage._loaded && this.overlayImage._loaded) {
                        this._onReady();
                    }
                } else {
                    this.onResize(true);
                }
            }
        } else if(!img.onload){
            img.onload = bind(_checkImage, this, img);
        }
    }

    function _onReady(){
        this._initVariables();
        this._initEvents();

        this.isReady = true;
        this.onResize(true);
        if(this.isStarted) this.start();
        if(this.onReadyCallback) this.onReadyCallback();
    }

    function _initVariables(){
        this.overlay.attr('src', this.overlayImage.src);
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.strokeCanvas = document.createElement('canvas');
        this.strokeCanvasCtx = this.strokeCanvas.getContext('2d');
        this.strokeCanvas.width = this.originalWidth * this.strokeCanvasRatio;
        this.strokeCanvas.height = this.originalHeight * this.strokeCanvasRatio;
        this.strokeCanvasBuffer = document.createElement('canvas');
        this.strokeCanvasBufferCtx = this.strokeCanvasBuffer.getContext('2d');
        this.strokeCanvasBuffer.width = this.originalWidth * this.strokeCanvasRatio;
        this.strokeCanvasBuffer.height = this.originalHeight * this.strokeCanvasRatio;
        this.$el.append(this.canvas);

    }

    function _initEvents(){
        this.boundOnDown = bind(onDown, this);
        this.boundOnMove = bind(onMove, this);
        this.boundOnUp = bind(onUp, this);
        if(inputController.hasTouch) {
            inputController.add(this.$el[0], 'down', this.boundOnDown);
            inputController.onUp.add(this.boundOnUp);
        } else {
            this.isDown = true;
        }
        inputController.onMove.add(this.boundOnMove);
    }

    function onDown(e){
        if(e.preventDefault) e.preventDefault();
        this.isDown = true;
        this.strokeCanvasCtx.lineWidth = this.strokeWidth * this.strokeCanvasRatio;
        this.strokeCanvasCtx.lineCap = 'round';
        this.strokeCanvasCtx.beginPath();
        this.strokeCanvasCtx.moveTo((e.x - this.offsetLeft - this.imageOffsetX) / this.imageRatio * this.strokeCanvasRatio, (e.y - this.offsetTop - this.imageOffsetY) / this.imageRatio * this.strokeCanvasRatio);
    }

    function onMove(e){
        if(this.isDown) {
            if(e.preventDefault) e.preventDefault();
            this.strokeCanvasCtx.lineTo((e.x - this.offsetLeft - this.imageOffsetX) / this.imageRatio * this.strokeCanvasRatio, (e.y - this.offsetTop - this.imageOffsetY) / this.imageRatio * this.strokeCanvasRatio);
            this.strokeCanvasCtx.stroke();
        }
        if(this.isDown || !inputController.hasTouch) {
            this.strokeCanvasCtx.lineWidth = this.strokeWidth * this.strokeCanvasRatio;
            this.strokeCanvasCtx.lineCap = 'round';
            this.strokeCanvasCtx.beginPath();
            this.strokeCanvasCtx.moveTo((e.x - this.offsetLeft - this.imageOffsetX) / this.imageRatio * this.strokeCanvasRatio, (e.y - this.offsetTop - this.imageOffsetY) / this.imageRatio * this.strokeCanvasRatio);
            this.isDrawing = true;
            this.isDown = true;
        }
    }


    function onUp(e){
        if(!this.isDown) return;
        if(e.preventDefault) e.preventDefault();
        this.isDown = false;
        this.strokeCanvasCtx.lineTo((e.x - this.offsetLeft - this.imageOffsetX) / this.imageRatio * this.strokeCanvasRatio, (e.y - this.offsetTop - this.imageOffsetY)  / this.imageRatio* this.strokeCanvasRatio);
        this.strokeCanvasCtx.stroke();
        this.isDrawing = true;
    }

    function onResize(forceUpdate){
        var newWidth = this.$el.width();
        var newHeight = this.$el.height();
        if(!forceUpdate && newWidth == this.$elWidth && newHeight == this.$elWidth) return; // didn't change
        this.$elWidth = newWidth;
        this.$elHeight = newHeight;
        this.offsetLeft = this.$el.offset().left;
        this.offsetTop = this.$el.offset().top;
        this.imageRatio = newWidth / this.originalWidth > newHeight / this.originalHeight ? newWidth / this.originalWidth : newHeight / this.originalHeight
        this.imageWidth = this.originalWidth * this.imageRatio | 0;
        this.imageHeight = this.originalHeight * this.imageRatio | 0;
        this.imageOffsetX = newWidth - this.imageWidth >> 1;
        this.imageOffsetY = newHeight - this.imageHeight >> 1;
        this.overlay.css({
            width: this.imageWidth,
            height: this.imageHeight,
            left: this.imageOffsetX,
            top: this.imageOffsetY
        });
        if(!isActive) {
            //TODO fallback?
        } else if(this.isReady){
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            this.render();
        }
    }

    function _renderLoop(){
        this.renderInstance = window.requestAnimationFrame(this.onBoundRender);
        if(!this.isRendering) return;
        this.render();
    }

    function render(){
        if(!isActive || !this.isReady) return;
        this._skipCount ++;
        if(this._skipCount >= this._skipCountMax) {
            this._skipCount = 0;
            this.strokeCanvasCtx.globalCompositeOperation = 'destination-out';
            this.strokeCanvasCtx.fillStyle = 'rgba(0,0,0,' + this.fadingRatio +')';
            this.strokeCanvasCtx.fillRect(0,0,this.originalWidth * this.strokeCanvasRatio,this.originalHeight * this.strokeCanvasRatio);
        }
        this.strokeCanvasCtx.globalCompositeOperation = 'source-over';

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.drawImage(this.baseImage, this.imageOffsetX, this.imageOffsetY, this.imageWidth, this.imageHeight);
        this.ctx.globalCompositeOperation = 'destination-in';
        this.ctx.drawImage(this.strokeCanvas, this.imageOffsetX, this.imageOffsetY, this.imageWidth, this.imageHeight);

        this.isDrawing = false;
    }

    function start(){
        if(!isActive || this.isRendering) return;
        this.isStarted = true;
        if(!this.isReady) return;
        this.isRendering = true;
        this._renderLoop();
    }

    function stop(){
        this.isStarted = false;
        this.isRendering = false;
        if(this.isRendering) window.cancelAnimationFrame(this.renderInstance);
    }

    function remove(){
        this.stop();
        $window.unbind('resize orientationchange', this.onBoundResize);
        inputController.remove(this.$el[0]);
        inputController.onMove.remove(this.boundOnMove);
        inputController.onUp.remove(this.boundOnUp);
        this.onBoundResize = bind(onResize, this);
        this.onBoundRender = bind(_renderLoop, this);
        this.$el.remove();
    }

    // public functions
    _p.init = init;
    _p._onReady = _onReady;
    _p._checkImage = _checkImage;
    _p._initVariables = _initVariables;
    _p._initEvents = _initEvents;
    _p.onResize = onResize;
    _p._renderLoop = _renderLoop;
    _p.render = render;
    _p.start = start;
    _p.stop = stop;
    _p.remove = remove;

    return Swiper;

}(window, document));