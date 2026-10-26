export interface SeriesSelectorBarProps {
  label?: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  selectorStyle?: 'dropdown' | 'tabs';
}

export default function SeriesSelectorBar({
  label,
  options,
  value,
  onChange,
  selectorStyle = 'dropdown',
}: SeriesSelectorBarProps) {
  if (!options.length) return null;
  const selected = value ?? options[0];
  return (
    <div
      className="series-selector-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        gap: 8,
        padding: '4px 8px 0',
        fontSize: 12,
        color: '#5f6b7a',
      }}
    >
      {label ? <span>{label}</span> : null}
      {selectorStyle === 'tabs' ? (
        <div
          role="tablist"
          aria-label={label || 'Series selector'}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            padding: 2,
            background: '#f1f5f9',
            border: '1px solid #d9dee5',
            borderRadius: 6,
          }}
        >
          {options.map(opt => {
            const active = opt === selected;
            return (
              <button
                key={opt}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(opt)}
                style={{
                  height: 24,
                  padding: '0 10px',
                  border: 'none',
                  borderRadius: 4,
                  background: active ? '#fff' : 'transparent',
                  color: active ? '#1f2937' : '#5f6b7a',
                  boxShadow: active ? '0 1px 2px rgba(15,23,42,0.12)' : 'none',
                  fontSize: 12,
                  fontWeight: active ? 700 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <select
          aria-label={label || 'Series selector'}
          value={selected}
          onChange={e => onChange(e.target.value)}
          style={{
            height: 28,
            minWidth: 140,
            padding: '0 8px',
            border: '1px solid #d9dee5',
            borderRadius: 4,
            background: '#fff',
            color: '#1f2937',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {options.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
