export interface DraggableItemsProps {
  initialItems: Array<{
    id: string | number
  }>
  delay?: number
  debounceMs?: number
  easeFunction?: string
}

declare module 'react-drag-elements' {
  export default function useDraggableItems(
    props: DraggableItemsProps
  ): {
    items: any
    getItemProps: any
  }
}
