import { useState } from 'react';

export default function CommandPage() {
  const [command, setCommand] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function submitCommand() {
    setLoading(true);
    const res = await fetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🎯 GPT Command Center</h1>

      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Ex: Find 10 mobile detailing leads in Charlotte"
        className="w-full border p-2 rounded mb-4"
      />

      <button
        onClick={submitCommand}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Running...' : '🚀 Launch Command'}
      </button>

      {result && (
        <pre className="mt-6 p-4 bg-gray-900 text-green-300 rounded text-sm overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
