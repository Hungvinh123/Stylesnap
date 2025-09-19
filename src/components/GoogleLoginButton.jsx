export default function GoogleLoginButton() {
  const next = new URLSearchParams(window.location.search).get('next') || '';

  const to = '/api/auth/google/start' + (next ? `?next=${encodeURIComponent(next)}` : '');

  return (
    <button
      type="button"
      className="w-full mt-3 rounded-xl bg-red-600 text-white py-2 hover:opacity-90"
      onClick={() => { window.location.href = to; }}
      title="Sign in with Google"
    >
      Continue with Google
    </button>
  );
}
