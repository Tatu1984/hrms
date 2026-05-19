export default function HomePage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: 720 }}>
      <h1>HRMS Backend API</h1>
      <p>This is the backend service. There is no UI here — see <code>/api/*</code> routes.</p>
      <ul>
        <li><code>POST /api/auth/login</code></li>
        <li><code>GET /api/auth/me</code></li>
        <li><code>GET /api/employees</code></li>
        <li>... (full list in repo README)</li>
      </ul>
    </main>
  );
}
