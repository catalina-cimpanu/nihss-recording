import "./globals.css"

export const metadata = {
  title: "Simple Stroke Assessment",
  description: "Minimal stroke assessment prototype",
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}