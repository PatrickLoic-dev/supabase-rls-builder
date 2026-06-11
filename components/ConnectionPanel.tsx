"use client";

interface ConnectionPanelProps {
  supabaseUrl: string;
  supabaseKey: string;
  openaiKey: string;
  connected: boolean;
  onChange: (field: "supabaseUrl" | "supabaseKey" | "openaiKey", value: string) => void;
  onConnect: () => void;
}

export function ConnectionPanel({
  supabaseUrl,
  supabaseKey,
  openaiKey,
  connected,
  onChange,
  onConnect,
}: ConnectionPanelProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-gray-500"}`} />
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Connection
        </h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Supabase Project URL</label>
          <input
            type="url"
            placeholder="https://xxxx.supabase.co"
            value={supabaseUrl}
            onChange={(e) => onChange("supabaseUrl", e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Service Role Key</label>
          <input
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIs..."
            value={supabaseKey}
            onChange={(e) => onChange("supabaseKey", e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">OpenAI API Key</label>
          <input
            type="password"
            placeholder="sk-..."
            value={openaiKey}
            onChange={(e) => onChange("openaiKey", e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={onConnect}
          disabled={!supabaseUrl || !supabaseKey || !openaiKey}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 rounded-lg text-sm transition-colors"
        >
          {connected ? "Reconnect" : "Connect"}
        </button>
      </div>
    </div>
  );
}
