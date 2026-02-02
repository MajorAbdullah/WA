/**
 * Auth Layout
 * Centered layout for authentication pages (no sidebar)
 */

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {children}
    </div>
  );
}
