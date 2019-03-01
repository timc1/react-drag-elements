import React from 'react'

import useDraggableItems from 'react-drag-elements'

const initialItems = [
  { id: 0, text: 'One', color: '#616AFF' },
  { id: 1, text: 'Two', color: '#2DBAE7' },
  { id: 2, text: 'Three', color: '#fd4e4e' },
  { id: 3, text: 'Four', color: '#FFBF00' },
  { id: 4, text: 'Five', color: '#e66139' },
  { id: 5, text: 'Six', color: '#3577ef' },
  { id: 6, text: 'Seven', color: '#ababab' },
  { id: 7, text: 'Eight', color: '#21C8B7' },
  { id: 8, text: 'Nine', color: '#FED67D' },
  { id: 9, text: 'Ten', color: '#013540' },
]

export default function App() {
  const { items, getItemProps } = useDraggableItems({
    initialItems,
  })

  // Fade in demo
  React.useEffect(() => {
    document.body.style.opacity = '1'
  }, [])

  return (
    <div className="demo">
      <h1>Moveable Cards 🕹</h1>
      <ul>
        {items.map((item: any) => (
          <li key={item.id}>
            <button
              {...getItemProps(item.id)}
              style={{ background: item.color }}
            >
              <span>{item.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
