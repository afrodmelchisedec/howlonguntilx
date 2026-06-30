export const metadata = { title: 'Privacy Policy — HowLongUntil' };
export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <h2>What we collect</h2>
      <p>Email address (for login), saved countdown names and dates, and anonymous usage analytics.</p>
      <h2>What we do not collect</h2>
      <p>We do not collect passwords, payment info, or sell data to third parties.</p>
      <h2>Cookies</h2>
      <p>We use a session cookie for authentication only. No tracking cookies.</p>
      <h2>Your rights</h2>
      <p>You can delete your account and all data at any time from your dashboard settings.</p>
    </div>
  );
}
