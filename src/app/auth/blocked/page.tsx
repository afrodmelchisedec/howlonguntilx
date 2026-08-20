export const metadata = { title: 'Account blocked — HowLongUntil' };

export default function BlockedPage() {
  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 12 }}>This account has been blocked</h1>
      <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>
        An admin has blocked this account for a policy violation. If you believe
        this was a mistake, contact support to appeal.
      </p>
    </div>
  );
}
