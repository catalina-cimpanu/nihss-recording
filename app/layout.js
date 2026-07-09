import "./globals.css"
import Header from "@/components/Header"

export const metadata = {
  title: "Simple Stroke Assessment",
  description: "Minimal stroke assessment prototype",
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <Header />
        {children}
        </body>
    </html>
  )
}