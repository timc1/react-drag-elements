import * as React from 'react'
import { DraggableItemsProps } from '../index'

const IS_MOBILE = checkIsMobile()
const eventListeners = IS_MOBILE
  ? {
      onDown: 'onTouchStart',
      onMove: 'onTouchMove',
      onEnd: 'onTouchEnd',
    }
  : {
      onDown: 'onMouseDown',
      // We will be triggering an 'onMouseMove' event listener
      // when 'onMouseDown' triggers, and cleaning it up when
      // 'onMouseUp' is called.
      onMove: '',
      onEnd: 'onMouseUp',
    }

// The animation id used to cancel requestAnimationFrame loop.
let animationId: number = 0
// Flag to check if calculations inside requestAnimationFrame function
// is still running. This will make sure our calculation functions finish
// running before being called again.
let isAnimating: boolean = false
// Flag to check if our elements are transitioning to their new positions.
// This will make sure we're not transforming elements again until after
// they've finish their current transition.
let isTransitioning: boolean = false
// Array of objects representating each item's respective DOM element and their order.
let elements: any = []
// Index of the current open position.
let currentOpenIndex: number = -1
// Current element selected.
let currentTarget: any = null
// Cache position of the current open position.
let currentOpenIndexPosition: any = null
// Cache position of the original open position — the element we currently are dragging.
let cachedOriginalOpenIndexPosition: any = null
// The location of our pointer (mouse or touch) on the initial click/touch.
let pointerOffset: {
  x: number
  y: number
} = {
  x: 0,
  y: 0,
}

export default function useDraggableItems({
  initialItems,
  delay = 250,
  debounceMs = 200,
  easeFunction = `cubic-bezier(.39,.28,.13,1.14)`,
}: DraggableItemsProps) {
  const [items, dispatch] = React.useReducer(reducer, initialItems)

  // Setup
  // =====
  // Return an array of the items along with their DOM node,
  // the original item, and a flag, isInOriginalPosition that
  // we use to determine how to transform the element later.
  //
  // This runs every time we dispatch a new update to the list.
  React.useEffect(() => {
    elements = items.map((item: any) => ({
      node: document.querySelector(`[data-moveable-id="${item.id}"]`),
      item,
      isInOriginalPosition: true,
    }))
  }, [items])

  const animate = debounce(() => {
    if (!isAnimating) {
      isAnimating = true
      animationId = requestAnimationFrame(animate)

      // Loop through elements, not including the current targeted element
      // and check if is intersecting.
      // Calculate new positions for affected elements; break out of loop.

      for (let i in elements) {
        const currentLoopItem = elements[i]
        if (currentLoopItem.item.id !== currentTarget.item.id) {
          const {
            top: oTop,
            left: oLeft,
            right: oRight,
            bottom: oBottom,
          } = currentTarget.node.getBoundingClientRect()

          const {
            top,
            left,
            right,
            bottom,
            width,
          } = currentLoopItem.node.getBoundingClientRect()

          const halfWidth = width / 2

          // Checks if currentTarget and currentLoopItem are intersecting at least 50%.
          if (
            oTop <= bottom &&
            oBottom >= top &&
            oLeft <= right - halfWidth &&
            oRight >= left + halfWidth
          ) {
            if (!isTransitioning) {
              isTransitioning = true

              // Now that we're intersecting, we need to:
              // 1. Determine the direction that each element will move.
              // 2. Determine the elements that need to move.
              const intersectedIndex = Number(i)

              // Cache the position of the element where the new open slot will be,
              // before we move it.
              const cachedOpenIndexPosition = elements[
                intersectedIndex
              ].node.getBoundingClientRect()

              const direction =
                intersectedIndex > currentOpenIndex ? 'back' : 'forward'

              const elementsToMove =
                direction === 'back'
                  ? elements.slice(currentOpenIndex + 1, intersectedIndex + 1)
                  : elements.slice(intersectedIndex, currentOpenIndex)

              calculateNewPositions(elementsToMove, direction)

              // Now that the elements are shifted, we'll set our currentOpenIndexPosition
              // to the new open index position.
              currentOpenIndexPosition = cachedOpenIndexPosition

              // eslint - setTimeout won't run because of our isTransitioning flag.
              // eslint-disable-next-line
              setTimeout(() => {
                // Update elements array to reflect UI change
                const copy = clone(elements)
                copy.splice(currentOpenIndex, 1)
                copy.splice(intersectedIndex, 0, elements[currentOpenIndex])

                elements = copy

                currentTarget = elements[intersectedIndex]
                currentOpenIndex = intersectedIndex

                isTransitioning = false
              }, delay)
            }
            break
          }
        }
      }

      isAnimating = false
    }
  }, debounceMs)

  const calculateNewPositions = (
    elementsToMove: any[],
    direction: 'back' | 'forward'
  ) => {
    // We'll translate each element to the location of the next element,
    // which is either the previous or next element in elementsToMove dependent
    // on the direction.
    //
    // If we're on the first index and index-1 or the last index and index+1
    // is undefined, we'll need to use the currentOpenIndexPosition.
    elementsToMove.forEach((element, index) => {
      const translate = { x: 0, y: 0 }
      const currentElementPosition = element.node.getBoundingClientRect()

      let nextPosition: any
      if (direction === 'back' && element.isInOriginalPosition) {
        nextPosition = elementsToMove[index - 1]
          ? elementsToMove[index - 1].node.getBoundingClientRect()
          : currentOpenIndexPosition

        translate.x = nextPosition.x - currentElementPosition.x
        translate.y = nextPosition.y - currentElementPosition.y

        element.isInOriginalPosition = false
      }
      if (direction === 'forward' && element.isInOriginalPosition) {
        nextPosition = elementsToMove[index + 1]
          ? elementsToMove[index + 1].node.getBoundingClientRect()
          : currentOpenIndexPosition

        translate.x = nextPosition.x - currentElementPosition.x
        translate.y = nextPosition.y - currentElementPosition.y

        element.isInOriginalPosition = false
      }

      element.node.style.transform = `translate3d(${translate.x}px, ${
        translate.y
      }px, 0px)`
      element.node.style.transition = `transform ${delay}ms ${easeFunction}`

      if (translate.x === 0 && translate.y === 0) {
        element.isInOriginalPosition = true
      }
    })
  }

  // We pull onMove into its own function because the way we call the function
  // is different depending on whether it is touch or mouse events.
  const onMove = (e: any) => {
    if (IS_MOBILE) {
      e.persist()
    }
    const { clientX, clientY } = IS_MOBILE ? e.changedTouches[0] : e

    const translate = {
      x: clientX - pointerOffset.x,
      y: clientY - pointerOffset.y,
    }

    currentTarget.node.style.transform = `translate3d(${translate.x}px, ${
      translate.y
    }px, 0)`
    currentTarget.node.style.transition = `none`
    currentTarget.node.style.zIndex = `1`

    animate()
  }

  const getItemProps = (id: string) => {
    return {
      [`data-moveable-id`]: id,
      [eventListeners.onDown]: (e: any) => {
        e.persist()
        const { clientX, clientY } = IS_MOBILE ? e.changedTouches[0] : e
        pointerOffset.x = clientX
        pointerOffset.y = clientY

        currentOpenIndex = elements.findIndex(
          (element: any) => element.item.id === id
        )
        currentOpenIndexPosition = elements[
          currentOpenIndex
        ].node.getBoundingClientRect()
        cachedOriginalOpenIndexPosition = currentOpenIndexPosition
        currentTarget = elements[currentOpenIndex]

        currentTarget.node.style.touchAction = `none`

        if (!IS_MOBILE) {
          window.addEventListener('mousemove', onMove)
        }
      },
      [eventListeners.onMove]: IS_MOBILE ? onMove : null,
      [eventListeners.onEnd]: (e: any) => {
        e.persist()
        if (!IS_MOBILE) {
          window.removeEventListener('mousemove', onMove)
        }

        // Transform the item we're currently dragging to the new open slot.
        const newTranslatePosition = {
          x: currentOpenIndexPosition.x - cachedOriginalOpenIndexPosition.x,
          y: currentOpenIndexPosition.y - cachedOriginalOpenIndexPosition.y,
        }
        currentTarget.node.style.transform = `translate3d(${
          newTranslatePosition.x
        }px, ${newTranslatePosition.y}px, 0)`
        currentTarget.node.style.transition = `transform ${delay}ms ${easeFunction}`

        cancelAnimationFrame(animationId)
        isAnimating = true
        isTransitioning = true

        setTimeout(() => {
          // Dispatch an update to let React update the DOM and reset the transform/transition
          // properties on each element now that they're in the new positions.
          elements.forEach((element: any, index: number) => {
            element.node.style.transform = ''
            element.node.style.transition = ''
          })
          e.target.style.zIndex = `initial`
          currentTarget.node.style.touchAction = `initial`

          dispatch({
            type: 'UPDATE_ORDER',
            payload: elements.map((element: any) => element.item),
          })

          isAnimating = false
          isTransitioning = false
        }, delay)
      },
    }
  }

  return {
    items,
    getItemProps,
  }
}

type ReducerState = any[]

type ReducerAction = {
  type: string
  payload: any
}

const reducer = (state: ReducerState, action: ReducerAction) => {
  switch (action.type) {
    case 'UPDATE_ORDER':
      return action.payload
    default:
      return state
  }
}

// Helpers
// =======

function checkIsMobile() {
  if (typeof document !== `undefined`) {
    return 'ontouchstart' in document.documentElement === true
  }
  return false
}

function clone(arr: any[]) {
  const copy = arr.slice()
  const clonedCopy = copy.map((f: any) => {
    let o: any = {}
    for (let i in f) o[i] = f[i]
    return o
  })
  return clonedCopy
}

function debounce(func: () => void, wait: number, immediate?: boolean) {
  let timeout: any
  return function(this: any) {
    const context = this,
      args: any = arguments
    const later = function() {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}
