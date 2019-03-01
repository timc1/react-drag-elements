"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var IS_MOBILE = checkIsMobile();
var eventListeners = IS_MOBILE
    ? {
        onDown: 'onTouchStart',
        onMove: 'onTouchMove',
        onEnd: 'onTouchEnd',
    }
    : {
        onDown: 'onMouseDown',
        onMove: '',
        onEnd: 'onMouseUp',
    };
var animationId = 0;
var isAnimating = false;
var isTransitioning = false;
var elements = [];
var currentOpenIndex = -1;
var currentTarget = null;
var currentOpenIndexPosition = null;
var cachedOriginalOpenIndexPosition = null;
var pointerOffset = {
    x: 0,
    y: 0,
};
function useDraggableItems(_a) {
    var initialItems = _a.initialItems, _b = _a.delay, delay = _b === void 0 ? 250 : _b, _c = _a.debounceMs, debounceMs = _c === void 0 ? 200 : _c, _d = _a.easeFunction, easeFunction = _d === void 0 ? "cubic-bezier(.39,.28,.13,1.14)" : _d;
    var _e = React.useReducer(reducer, initialItems), items = _e[0], dispatch = _e[1];
    React.useEffect(function () {
        elements = items.map(function (item) { return ({
            node: document.querySelector("[data-moveable-id=\"" + item.id + "\"]"),
            item: item,
            isInOriginalPosition: true,
        }); });
    }, [items]);
    var animate = debounce(function () {
        if (!isAnimating) {
            isAnimating = true;
            animationId = requestAnimationFrame(animate);
            var _loop_1 = function (i) {
                var currentLoopItem = elements[i];
                if (currentLoopItem.item.id !== currentTarget.item.id) {
                    var _a = currentTarget.node.getBoundingClientRect(), oTop = _a.top, oLeft = _a.left, oRight = _a.right, oBottom = _a.bottom;
                    var _b = currentLoopItem.node.getBoundingClientRect(), top_1 = _b.top, left = _b.left, right = _b.right, bottom = _b.bottom, width = _b.width;
                    var halfWidth = width / 2;
                    if (oTop <= bottom &&
                        oBottom >= top_1 &&
                        oLeft <= right - halfWidth &&
                        oRight >= left + halfWidth) {
                        if (!isTransitioning) {
                            isTransitioning = true;
                            var intersectedIndex_1 = Number(i);
                            var cachedOpenIndexPosition = elements[intersectedIndex_1].node.getBoundingClientRect();
                            var direction = intersectedIndex_1 > currentOpenIndex ? 'back' : 'forward';
                            var elementsToMove = direction === 'back'
                                ? elements.slice(currentOpenIndex + 1, intersectedIndex_1 + 1)
                                : elements.slice(intersectedIndex_1, currentOpenIndex);
                            calculateNewPositions(elementsToMove, direction);
                            currentOpenIndexPosition = cachedOpenIndexPosition;
                            setTimeout(function () {
                                var copy = clone(elements);
                                copy.splice(currentOpenIndex, 1);
                                copy.splice(intersectedIndex_1, 0, elements[currentOpenIndex]);
                                elements = copy;
                                currentTarget = elements[intersectedIndex_1];
                                currentOpenIndex = intersectedIndex_1;
                                isTransitioning = false;
                            }, delay);
                        }
                        return "break";
                    }
                }
            };
            for (var i in elements) {
                var state_1 = _loop_1(i);
                if (state_1 === "break")
                    break;
            }
            isAnimating = false;
        }
    }, debounceMs);
    var calculateNewPositions = function (elementsToMove, direction) {
        elementsToMove.forEach(function (element, index) {
            var translate = { x: 0, y: 0 };
            var currentElementPosition = element.node.getBoundingClientRect();
            var nextPosition;
            if (direction === 'back' && element.isInOriginalPosition) {
                nextPosition = elementsToMove[index - 1]
                    ? elementsToMove[index - 1].node.getBoundingClientRect()
                    : currentOpenIndexPosition;
                translate.x = nextPosition.x - currentElementPosition.x;
                translate.y = nextPosition.y - currentElementPosition.y;
                element.isInOriginalPosition = false;
            }
            if (direction === 'forward' && element.isInOriginalPosition) {
                nextPosition = elementsToMove[index + 1]
                    ? elementsToMove[index + 1].node.getBoundingClientRect()
                    : currentOpenIndexPosition;
                translate.x = nextPosition.x - currentElementPosition.x;
                translate.y = nextPosition.y - currentElementPosition.y;
                element.isInOriginalPosition = false;
            }
            element.node.style.transform = "translate3d(" + translate.x + "px, " + translate.y + "px, 0px)";
            element.node.style.transition = "transform " + delay + "ms " + easeFunction;
            if (translate.x === 0 && translate.y === 0) {
                element.isInOriginalPosition = true;
            }
        });
    };
    var onMove = function (e) {
        if (IS_MOBILE) {
            e.persist();
        }
        var _a = IS_MOBILE ? e.changedTouches[0] : e, clientX = _a.clientX, clientY = _a.clientY;
        var translate = {
            x: clientX - pointerOffset.x,
            y: clientY - pointerOffset.y,
        };
        currentTarget.node.style.transform = "translate3d(" + translate.x + "px, " + translate.y + "px, 0)";
        currentTarget.node.style.transition = "none";
        currentTarget.node.style.zIndex = "1";
        animate();
    };
    var getItemProps = function (id) {
        var _a;
        return _a = {},
            _a["data-moveable-id"] = id,
            _a[eventListeners.onDown] = function (e) {
                e.persist();
                var _a = IS_MOBILE ? e.changedTouches[0] : e, clientX = _a.clientX, clientY = _a.clientY;
                pointerOffset.x = clientX;
                pointerOffset.y = clientY;
                currentOpenIndex = elements.findIndex(function (element) { return element.item.id === id; });
                currentOpenIndexPosition = elements[currentOpenIndex].node.getBoundingClientRect();
                cachedOriginalOpenIndexPosition = currentOpenIndexPosition;
                currentTarget = elements[currentOpenIndex];
                currentTarget.node.style.touchAction = "none";
                if (!IS_MOBILE) {
                    window.addEventListener('mousemove', onMove);
                }
            },
            _a[eventListeners.onMove] = IS_MOBILE ? onMove : null,
            _a[eventListeners.onEnd] = function (e) {
                e.persist();
                if (!IS_MOBILE) {
                    window.removeEventListener('mousemove', onMove);
                }
                var newTranslatePosition = {
                    x: currentOpenIndexPosition.x - cachedOriginalOpenIndexPosition.x,
                    y: currentOpenIndexPosition.y - cachedOriginalOpenIndexPosition.y,
                };
                currentTarget.node.style.transform = "translate3d(" + newTranslatePosition.x + "px, " + newTranslatePosition.y + "px, 0)";
                currentTarget.node.style.transition = "transform " + delay + "ms " + easeFunction;
                cancelAnimationFrame(animationId);
                isAnimating = true;
                isTransitioning = true;
                setTimeout(function () {
                    elements.forEach(function (element, index) {
                        element.node.style.transform = '';
                        element.node.style.transition = '';
                    });
                    e.target.style.zIndex = "initial";
                    currentTarget.node.style.touchAction = "initial";
                    dispatch({
                        type: 'UPDATE_ORDER',
                        payload: elements.map(function (element) { return element.item; }),
                    });
                    isAnimating = false;
                    isTransitioning = false;
                }, delay);
            },
            _a;
    };
    return {
        items: items,
        getItemProps: getItemProps,
    };
}
exports.default = useDraggableItems;
var reducer = function (state, action) {
    switch (action.type) {
        case 'UPDATE_ORDER':
            return action.payload;
        default:
            return state;
    }
};
function checkIsMobile() {
    if (typeof document !== "undefined") {
        return 'ontouchstart' in document.documentElement === true;
    }
    return false;
}
function clone(arr) {
    var copy = arr.slice();
    var clonedCopy = copy.map(function (f) {
        var o = {};
        for (var i in f)
            o[i] = f[i];
        return o;
    });
    return clonedCopy;
}
function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate)
                func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
            func.apply(context, args);
    };
}
//# sourceMappingURL=useDraggableItems.js.map