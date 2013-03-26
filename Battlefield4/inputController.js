var inputController = (function(document, window){

    var undef;

    var inputController = {

        hasTouch: 'ontouchstart' in window,

        onDown: new signals.Signal(),
        onMove: new signals.Signal(),
        onUp: new signals.Signal(),

        onSwipeH: new signals.Signal(),
        onSwipeV: new signals.Signal(),

        isDown: false,
        isScrollH: false,
        isScrollV: false,

        isFirstTouch: undef, // if it is undefined, which means it is not ready yet. If it is true, which means the first event is touch. If it is false, which means the first event is mouse.

        deltaX: 0,
        deltaY: 0,
        deltaTime: 0,

        downBubbleHistory: [],
        currentBubbleHistory: [],

        isOnSwipePane: false,
        elems: []

    };

    var _hasTouch = inputController.hasTouch;
    var _hasEventListener = 'addEventListener' in window;
    var _documentElement = document.documentElement;

    var _isDown = false;
    var _downTime = 0;
    var _downX = 0;
    var _downY = 0;
    var _currentTime = 0;
    var _currentX = 0;
    var _currentY = 0;

    var elems = inputController.elems;

    var TYPE_CONVERSION = _hasTouch ? {
        'over': 'touchstart mouseenter',
        'out': 'touchend mouseleave'
    } : {
        'over': 'mouseenter',
        'out': 'mouseleave'
    };

    var TYPE_LIST = ['over', 'out', 'tap', 'click', 'down'];

    function add(elem, type, func) {
        if(!elem) return;
        elem['__' + type] = func;
        if(type == 'over' || type == 'out') {
            $(elem).bind(TYPE_CONVERSION[type], func);
        }
        elem.__hasInput = true;
        elems.push(elem);
    }

    function remove(elem, type) {
        if(!elem) return;
        var i, len;
        if(type) {
            if(type == 'over' || type == 'out'){
                if(elem['__' + type]) $(elem).unbind(TYPE_CONVERSION[type], elem['__' + type]);
            }
            elem['__' + type] = undef;
        } else{
            if(elem.__over) $(elem).unbind(TYPE_CONVERSION['over'], elem.__over);
            if(elem.__out) $(elem).unbind(TYPE_CONVERSION['out'], elem.__out);
            for(i = 0, len = TYPE_LIST.length; i < len; i++) {
                elem['__' + TYPE_LIST[i]] = undef;
            }
            elem.__hasInput = false;
        }
        for(i = 0, len = TYPE_LIST.length; i < len; i++) {
            if(elem['__' + TYPE_LIST[i]]) return;
        }
        for(i = 0, len = elems.length; i < len; i++) {
            if(elems[i] == elem) {
                elems.splice(i, 1);
                break;
            }
        }
    }


    function init(){
        document.ondragstart = function () { return false; };
        if(inputController.hasTouch){
            document.addEventListener('touchstart', _bindEventDown, false);
            document.addEventListener('touchmove', _bindEventMove, false);
            document.addEventListener('touchend', _bindEventUp, false);
            document.addEventListener('mousedown', _bindEventDown, false);
            document.addEventListener('mousemove', _bindEventMove, false);
            document.addEventListener('mouseup', _bindEventUp, false);
        } else if(_hasEventListener) {
            document.addEventListener('mousedown', _bindEventDown, false);
            document.addEventListener('mousemove', _bindEventMove, false);
            document.addEventListener('mouseup', _bindEventUp, false);
        }else {
            document.attachEvent('onmousedown', _bindEventDown);
            document.attachEvent('onmousemove', _bindEventMove);
            document.attachEvent('onmouseup', _bindEventUp);
        }

        inputController.onDown.add(_onDown);
        inputController.onMove.add(_onMove);
        inputController.onUp.add(_onUp);

        inputController.hasInitialized = true;
    }

    function _bindEventDown(e){
        return _mixInputEvent.call(this, e, function(e) {inputController.onDown.dispatch(e);});
    }
    function _bindEventMove(e){
        return _mixInputEvent.call(this, e, function(e) {inputController.onMove.dispatch(e);});
    }
    function _bindEventUp(e){
        return _mixInputEvent.call(this, e, function(e) {inputController.onUp.dispatch(e);});
    }

    function _preventDefault(e){
        if(e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
    }

    function _mixInputEvent(e, func){
        e = e || window.event;
        var fakedEvent = {originalEvent: e};
        var i, elem, x, y, touchEvent, bubbleHistory, target;
        var type = e.type;
        var time = (new Date()).getTime();
        var isDown = type.indexOf('start') > -1 || type.indexOf('down') > -1;
        var isTouch = fakedEvent.isTouch = type.indexOf('touch') >-1;

        fakedEvent.preventDefault = function(){_preventDefault(e);};

        if(inputController.isFirstTouch === undef) inputController.isFirstTouch = isTouch;
        if(isTouch){
            touchEvent = e.touches.length ? e.touches[0] : e.changedTouches[0];
            fakedEvent.x = x = touchEvent.pageX;
            fakedEvent.y = y = touchEvent.pageY;
            target =touchEvent.target;

            //var isSkipPreventDefault = false;
            bubbleHistory = inputController.currentBubbleHistory = fakedEvent.bubbleHistory = [];
            while(target) {
                bubbleHistory.unshift(target);
                //if(!isSkipPreventDefault && target.__skipPreventDefault || (target.getAttribute && !target.getAttribute('controls'))) {
                //    isSkipPreventDefault = true;
                //}
                target = target.parentNode;
            }
            //if(!isSkipPreventDefault) e.preventDefault();
        } else{
            fakedEvent.x = x = _hasEventListener? e.pageX: e.clientX + _documentElement.scrollLeft;
            fakedEvent.y = y = _hasEventListener? e.pageY: e.clientY + _documentElement.scrollTop;
            target = target = e.target ? e.target: e.srcElement;
            bubbleHistory = inputController.currentBubbleHistory = fakedEvent.bubbleHistory = [];
            while(target) {
                bubbleHistory.unshift(target);
                target = target.parentNode;
            }
        }


        /*
        if(isTouch){
            i = bubbleHistory.length;
            while(i--) {
                elem = bubbleHistory[i];
                if(elem.__hasInput) {
                    e.preventDefault();
                    break;
                }
            }
        } */

        if(isDown) {
            _isDown = true;
            _downTime = _currentTime = time;
            _downX = _currentX = x;
            _downY = _currentY = y;
            inputController.downBubbleHistory = bubbleHistory;
            
            i = bubbleHistory.length;
            while(i--) {
                elem = bubbleHistory[i];
                if(isTouch && elem.__over) {
                    fakedEvent.currentTarget = elem;
                    elem.__over.call(elem, fakedEvent);
                }
                if(elem.__down) {
                    fakedEvent.currentTarget = elem;
                    elem.__down.call(elem, fakedEvent);
                }
            }
        }

        if(_isDown) {
            fakedEvent.distanceTime = time - _downTime;
            fakedEvent.distanceX = x - _downX;
            fakedEvent.distanceY = y - _downY;
            fakedEvent.distance = Math.sqrt((x - _downX) * (x - _downX) + (y - _downY) * (y - _downY));
        }

        fakedEvent.deltaTime = time - _currentTime;
        fakedEvent.deltaX = x - _currentX;
        fakedEvent.deltaY = y - _currentY;
        fakedEvent.target = target;

        _currentTime = time;
        _currentX = x;
        _currentY = y;

        if(type.indexOf('end') > -1 || type.indexOf('up') > -1){
            _isDown = false;
        }

        func(fakedEvent);
    }



    function _onDown(e){
        inputController.isDown = true;
        var i = e.bubbleHistory.length;
        var target;
        while(i--) {
            target = e.bubbleHistory[i];
            if(target.__tap) {
                e.currentTarget = target;
                target.__tap.call(target, e);
            }
        }
    }

    function _onMove(e){
        inputController.currentBubbleHistory = e.bubbleHistory;
        inputController.deltaX = e.deltaX;
        inputController.deltaY = e.deltaY;
        inputController.deltaTime = e.deltaTime;
        inputController.distanceX = e.distanceX;
        inputController.distanceY = e.distanceY;
        inputController.distanceTime = e.distanceTime;
        if(!inputController.isScrollH && !inputController.isScrollV) {
            if(e.distance > 20) {
                if(Math.abs(e.distanceX) > Math.abs(e.distanceY)){
                    inputController.isScrollH = true;
                    inputController.onSwipeH.dispatch(e);
                } else{
                    inputController.isScrollV = true;
                    inputController.onSwipeV.dispatch(e);
                }
            }
        }
    }
    function _onUp(e){
        inputController.isDown = false;
        inputController.isScrollH = false;
        inputController.isScrollV = false;
        
        inputController.distanceTime = e.distanceTime;

        var i = e.bubbleHistory.length;
        var target;
        var isClick = e.distanceTime !== null && e.distanceTime < 500 && e.distance < 40;
        while(i--) {
            target = e.bubbleHistory[i];
            if(target.__out) {
                e.currentTarget = target;
                target.__out.call(target, e);
            }
            if(isClick && target.__click) {
                e.currentTarget = target;
                target.__click.call(target, e);
            }
        }
    }

    inputController.init = init;
    inputController.add = add;
    inputController.remove = remove;

    return inputController;

}(document, window));

