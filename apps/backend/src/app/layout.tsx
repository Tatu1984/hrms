export const metadata = {
  title: 'HRMS Backend API',
  description: 'Backend service for the HRMS application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
