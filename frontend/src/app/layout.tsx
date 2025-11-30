import './globals.css'
export const metadata = {
  title: 'Mi Mercado - Abuelas',
  description: 'Listado de productores y pedidos'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es'>
      <body>
        {children}
      </body>
    </html>
  )
}

