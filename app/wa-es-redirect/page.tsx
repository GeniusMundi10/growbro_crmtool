export const dynamic = "force-static";

export default function WaEsRedirect() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>WhatsApp Embedded Signup Redirect</h1>
        <p>Status: OK</p>
        <p>This endpoint is public and does not redirect. It is used only to bind the OAuth code.</p>
      </div>
    </main>
  );
}
