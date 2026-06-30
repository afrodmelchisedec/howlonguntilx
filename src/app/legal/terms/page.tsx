export const metadata = { title: 'Terms of Service — HowLongUntil' };
export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 prose dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>By using HowLongUntil you agree to these terms. This is a free service provided as-is.</p>
      <h2>Use of Service</h2>
      <p>You may use this service for personal, non-commercial countdown tracking. You may not scrape or abuse the API.</p>
      <h2>Accounts</h2>
      <p>You are responsible for maintaining the security of your account. We use secure magic links and OAuth — we never store passwords.</p>
      <h2>Data</h2>
      <p>We store only the data you provide (email, saved timers). We do not sell your data.</p>
      <h2>Contact</h2>
      <p>Questions? Email hello@howlonguntilx.com</p>
    </div>
  );
}
