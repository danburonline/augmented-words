import Head from 'next/head'
import { ButtonPressTestScene } from '../scenes/ButtonPressTestScene'

export default function Button() {
  return (
    <>
      <Head>
        <title>Button Press</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <ButtonPressTestScene />
      </main>
    </>
  )
}
