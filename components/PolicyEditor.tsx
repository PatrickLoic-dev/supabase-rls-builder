"use client";

interface PolicyEditorProps {
  description: string;
  tableName: string;
  tables: string[];
  loading: boolean;
  onChange: (field: "description" | "tableName", value: string) => void;
  onGenerate: () => void;
}

const EXAMPLES = [
  "Users can only see their own records",
  "Admins can read and write everything, users can only read",
  "Users can insert but not update or delete",
  "Only authenticated users can access this table",
  "Users can see public records and their own private records",
];

export function PolicyEditor({
  description,
  tableName,
  tables,
  loading,
  onChange,
  onGenerate,
}: PolicyEditorProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        Describe your security rule
      </h2>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Table</label>
        {tables.length > 0 ? (
          <select
            value={tableName}
            onChange={(e) => onChange("tableName", e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">Select a table...</option>
            {tables.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            placeholder="e.g. profiles, posts, orders..."
            value={tableName}
            onChange={(e) => onChange("tableName", e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        )}
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Security rule (natural language)</label>
        <textarea
          rows={4}
          placeholder="Describe your security rule in plain English..."
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">Examples:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onChange("description", ex)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 rounded-full px-3 py-1 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={!description || !tableName || loading}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Policies"
        )}
      </button>
    </div>
  );
}
