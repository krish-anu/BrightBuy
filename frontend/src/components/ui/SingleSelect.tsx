import React, { useState, useRef, useEffect } from 'react';

interface Option {
  id: number;
  name: string;
}

interface SingleSelectProps {
  options: Option[];
  value: number | null;
  onChange: (selectedId: number | null) => void;
  placeholder?: string;
}

const SingleSelect: React.FC<SingleSelectProps> = ({ options, value, onChange, placeholder = 'Select...' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const filtered = options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (id: number) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2 p-2 border rounded-md bg-white cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex-1">
          {value ? (options.find(o => o.id === value)?.name ?? `Category ${value}`) : (<span className="text-gray-400">{placeholder}</span>)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {value && (
            <button onClick={(e) => { e.stopPropagation(); onChange(null); }} className="text-xs text-gray-500 hover:text-gray-700">Clear</button>
          )}
          <svg className={`w-4 h-4 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {open && (
        <div className="absolute z-40 mt-2 w-full bg-white border rounded-md shadow-lg">
          <div className="p-2">
            <input
              className="w-full px-3 py-2 border rounded focus:outline-none"
              placeholder="Search categories..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No categories</div>
            ) : (
              filtered.map((opt, idx) => (
                <div key={`opt-${Number.isFinite(opt.id as any) ? opt.id : 'noid'}-${idx}`} className="p-2 hover:bg-gray-50 flex items-center cursor-pointer" onClick={() => handleSelect(opt.id)}>
                  <span className="text-sm">{opt.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleSelect;
