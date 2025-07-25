import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-bold mb-4">🚀 GPT Command Center</h1>
        <p className="mb-6 text-gray-700">
          Your AI team is standing by. Issue a command and let them work.
        </p>
        <Link href="/command">
          <span className="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition">
            Launch Control Panel
          </span>
        </Link>
      </div>
    </div>
  );
}
