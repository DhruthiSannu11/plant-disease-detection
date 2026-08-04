import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plant Disease Detection Platform',
  description: 'AI-Powered Botanical Diagnostic & Explainable AI (Grad-CAM) System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  )
}
