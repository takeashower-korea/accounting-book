import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '테이크어샤워 회계장부',
  description: '테이크어샤워 내부 회계 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
