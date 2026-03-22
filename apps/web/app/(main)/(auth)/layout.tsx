export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
