import { useState } from 'react'

export default function InputForm(props: { givenText?: string }) {
  const [text, setText] = useState(props.givenText || '')

  return (
    <form>
      <input
        style={{
          padding: '0.5em',
          lineHeight: '1.5em'
        }}
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
        }}
      />
    </form>
  )
}
