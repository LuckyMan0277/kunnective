export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      {children}
    </div>
  )
}
