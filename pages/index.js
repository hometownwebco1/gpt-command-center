import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [gpts, setGpts] = useState([]);
  const [selectedGpt, setSelectedGpt] = useState('frankie');
  const [chatMessages, setChatMessages] = useState([
    { from: 'system', text: 'Welcome! Chat with Frankie here.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Approve demo site for Client A', status: 'To Do', assignedGPT: 'Reese' },
    { id: 2, title: 'Build lead list for Raleigh, NC', status: 'In Progress', assignedGPT: 'Travis' },
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function fetchGPTs() {
      try {
        const res = await fetch('/api/gpts');
        if (res.ok) {
          const data = await res.json();
          setGpts(data.gpts);
          if(data.gpts.length > 0) setSelectedGpt(data.gpts[0].id);
        } else {
          console.error('Failed to load GPT registry');
        }
      } catch (e) {
        console.error('Error fetching GPT registry', e);
      }
    }
    fetchGPTs();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const newMessage = { from: 'user', text: input };
    setChatMessages(prev => [...prev, newMessage]);
    setInput('');

    try {
      const res = await fetch(`/api/gpt/${selectedGpt}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const replyText = data.reply || 'No response from GPT.';
      const reply = { from: selectedGpt, text: replyText };
      setChatMessages(prev => [...prev, reply]);

      // TODO: Parse GPT task handoff from replyText and update tasks if applicable

    } catch (error) {
      setChatMessages(prev => [...prev, { from: 'system', text: 'Error contacting GPT.' }]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 p-6 gap-6">
      {/* Left: GPT Registry and Selector */}
      <section className="hidden lg:block w-1/4 bg-white rounded shadow p-4 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4">GPT Registry</h2>
        {gpts.length === 0 ? (
          <p>Loading GPT registry...</p>
        ) : (
          <>
            <select
              value={selectedGpt}
              onChange={e => setSelectedGpt(e.target.value)}
              className="w-full border rounded p-2 mb-4"
            >
              {gpts.map(gpt => (
                <option key={gpt.id} value={gpt.id}>
                  {gpt.name}
                </option>
              ))}
            </select>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {gpts.map(gpt => (
                <div key={gpt.id} className="border rounded p-2 shadow-sm">
                  <h3 className="font-semibold">{gpt.name}</h3>
                  <p className="text-sm text-gray-600">{gpt.title}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Middle: Chat Panel */}
      <section className="flex flex-col w-full md:w-1/2 bg-white rounded shadow p-4">
        <h2 className="text-2xl font-bold mb-4">Chat with {selectedGpt.charAt(0).toUpperCase() + selectedGpt.slice(1)}</h2>
        <div className="flex-grow overflow-y-auto border rounded p-3 mb-4 space-y-2">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded max-w-[80%] ${
                msg.from === 'user'
                  ? 'bg-blue-100 self-end'
                  : msg.from === selectedGpt
                  ? 'bg-green-100 self-start'
                  : 'bg-gray-200 self-center'
              }`}
              style={{ alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <strong className="block mb-1">
                {msg.from === 'user' ? 'You' : msg.from === selectedGpt ? selectedGpt.charAt(0).toUpperCase() + selectedGpt.slice(1) : 'System'}
              </strong>
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-grow border rounded p-2"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </section>

      {/* Right: Task Whiteboard */}
      <section className="w-full md:w-1/4 bg-white rounded shadow p-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Task Whiteboard</h2>
        <div className="flex gap-3 overflow-x-auto">
          {statuses.map(status => (
            <div
              key={status}
              className="flex flex-col bg-gray-50 rounded p-3 w-full max-w-[200px] max-h-[75vh] overflow-y-auto"
            >
              <h3 className="font-semibold mb-3">{status}</h3>
              {tasks.filter(t => t.status === status).map(task => (
                <div key={task.id} className="bg-white rounded shadow p-3 mb-2 border">
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-gray-600">Assigned: {task.assignedGPT}</p>
                </div>
              ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <p className="text-gray-400 italic">No tasks</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
