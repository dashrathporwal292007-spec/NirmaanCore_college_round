import type {Metadata} from 'next'
import localFont from 'next/font/local'
import './globals.css'
const display=localFont({src:[{path:'../node_modules/@fontsource/big-shoulders-display/files/big-shoulders-display-latin-700-normal.woff2',weight:'700'},{path:'../node_modules/@fontsource/big-shoulders-display/files/big-shoulders-display-latin-800-normal.woff2',weight:'800'}],variable:'--font-big-shoulders',display:'swap'})
const body=localFont({src:[{path:'../node_modules/@fontsource/public-sans/files/public-sans-latin-400-normal.woff2',weight:'400'},{path:'../node_modules/@fontsource/public-sans/files/public-sans-latin-700-normal.woff2',weight:'700'}],variable:'--font-public',display:'swap'})
const mono=localFont({src:'../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2',variable:'--font-jetbrains',display:'swap'})
const serif=localFont({src:'../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2',variable:'--font-serif',display:'swap'})
export const metadata:Metadata={title:'Nexus — every change leaves a receipt',description:'The agent proposes. You decide.'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} ${serif.variable}`}><body>{children}</body></html>}
