import { Noto_Sans_Devanagari } from 'next/font/google'
import './globals.css'

const noto = Noto_Sans_Devanagari({ subsets: ['devanagari'], weight: ['400', '600', '700', '800'] })

export const metadata = {
  title: 'Ahuja Family',
  description: 'Family routine planner',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#d46a10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      </head>
      <body className={noto.className}>
        {children}
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js')
              .then(() => console.log('SW registered'))
              .catch(err => console.log('SW error:', err)));
          }
        `}} />
      </body>
    </html>
  )
}
