import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin | Pizza na Objednávku',
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
