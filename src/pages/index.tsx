import Head from 'next/head'
import MainScene from '../scenes/MainScene'

export default function Index() {
  return (
    <>
      <Head>
        <title>Augmented Words</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <MainScene />
      </main>
    </>
  )
}
