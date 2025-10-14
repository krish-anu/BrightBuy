import React, { useState, useRef, useEffect } from 'react';

interface Option {
  id: number;
  name: string;
}

interface MultiSelectProps {
  options: Option[];
  value: number[];
  onChange: (selectedIds: number[]) => void;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onChange, placeholder = 'Select...' }) => {
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

  const toggleOption = (id: number) => {
    if (value.includes(id)) onChange(value.filter(v => v !== id));
    else onChange([...value, id]);
  };

  const clearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange([]);
    setQuery('');
  };

  const filtered = options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2 p-2 border rounded-md bg-white cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex flex-wrap gap-1 max-w-[300px]">
          {value && value.length > 0 ? (
            value.map(id => {
              const opt = options.find(o => o.id === id);
              return (
                <span key={id} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {opt ? opt.name : `Category ${id}`}
                </span>
              );
            })
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {value && value.length > 0 && (
            <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700">Clear</button>
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
              filtered.map(opt => (
                <div key={opt.id} className="p-2 hover:bg-gray-50 flex items-center">
                  <input type="checkbox" checked={value.includes(opt.id)} onChange={() => toggleOption(opt.id)} className="mr-2" />
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

export default MultiSelect;
