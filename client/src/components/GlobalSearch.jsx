import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, CheckSquare, User, Loader2, X } from 'lucide-react';
import { search as apiSearch } from '../services/searchService';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await apiSearch(query);
        setResults(data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (url) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    navigate(url);
  };

  const hasResults =
    results &&
    (results.projects?.length > 0 ||
      results.tasks?.length > 0 ||
      results.members?.length > 0);

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search projects, tasks, members..."
          className="w-full pl-9 pr-8 py-1.5 text-sm bg-slate-100 hover:bg-slate-200/70 focus:bg-white border border-transparent focus:border-blue-500 rounded-lg outline-hidden text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults(null);
            }}
            className="absolute right-2.5 p-0.5 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              Searching...
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No results found for "{query}"
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto p-2 space-y-4">
              {/* Projects */}
              {results.projects?.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Projects ({results.projects.length})
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.projects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelect(`/projects/${p.id}`)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-blue-50/70 text-slate-700 cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                          {p.description && (
                            <p className="text-[11px] text-slate-500 truncate">{p.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {results.tasks?.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Tasks ({results.tasks.length})
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.tasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelect(`/projects/${t.projectId}?taskId=${t.id}`)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-blue-50/70 text-slate-700 cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900 truncate">{t.title}</p>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {t.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            in {t.projectName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              {results.members?.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Team Members ({results.members.length})
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold shrink-0">
                          {m.name?.[0] || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{m.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{m.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
