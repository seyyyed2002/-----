
import React, { useState, useMemo } from 'react';
import { X, Search, Plus, ChevronDown, ChevronRight, Check, Edit3, Binary, Sliders } from 'lucide-react';
import { DEED_LIBRARY, LIBRARY_CATEGORY_ORDER, CATEGORY_META, toPersianDigits } from '../constants';
import { ActiveDeed, DeedCategory, DeedLibraryItem } from '../types';

interface DeedLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDeeds: ActiveDeed[];
  onAdd: (deed: ActiveDeed) => void;
  onRemove: (deedId: string) => void;
}

const categoryOrder = LIBRARY_CATEGORY_ORDER;

export const DeedLibraryModal: React.FC<DeedLibraryModalProps> = ({
  isOpen,
  onClose,
  activeDeeds,
  onAdd,
  onRemove,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['prayers_optional', 'duas'])
  );
  const [customFormCategory, setCustomFormCategory] = useState<DeedCategory | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState<'binary' | 'scalar'>('binary');
  const [customPoints, setCustomPoints] = useState(10);
  const [addingPoints, setAddingPoints] = useState<Record<string, number>>({});

  const activeDeedLibraryIds = useMemo(
    () => new Set(activeDeeds.map(d => d.libraryId)),
    [activeDeeds]
  );

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return DEED_LIBRARY;
    const q = searchQuery.toLowerCase();
    return DEED_LIBRARY.filter(
      item => item.title.includes(q) || (item.subtitle || '').includes(q)
    );
  }, [searchQuery]);

  const groupedByCategory = useMemo(() => {
    const map: Record<string, DeedLibraryItem[]> = {};
    filteredBySearch.forEach(item => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });
    return map;
  }, [filteredBySearch]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleAdd = (item: DeedLibraryItem) => {
    const pts = addingPoints[item.id] ?? item.defaultPoints;
    const newDeed: ActiveDeed = {
      id: `${item.id}_${Date.now()}`,
      libraryId: item.id,
      title: item.title,
      category: item.category,
      type: item.defaultType,
      points: pts,
      isLocked: false,
      sortOrder: activeDeeds.length,
    };
    onAdd(newDeed);
  };

  const handleRemoveFromBoard = (libraryId: string) => {
    const deed = activeDeeds.find(d => d.libraryId === libraryId);
    if (deed && !deed.isLocked) onRemove(deed.id);
  };

  const handleAddCustom = () => {
    if (!customTitle.trim() || !customFormCategory) return;
    const id = `custom_${Date.now()}`;
    const newDeed: ActiveDeed = {
      id,
      libraryId: id,
      title: customTitle.trim(),
      category: customFormCategory,
      type: customType,
      points: customPoints,
      isLocked: false,
      sortOrder: activeDeeds.length,
    };
    onAdd(newDeed);
    setCustomTitle('');
    setCustomPoints(10);
    setCustomFormCategory(null);
  };

  if (!isOpen) return null;

  const displayedCategories = searchQuery.trim()
    ? Object.keys(groupedByCategory)
    : categoryOrder.filter(cat => groupedByCategory[cat]?.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-l from-violet-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">📚 کتابخانه اعمال</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">اعمال مورد نظر را به دفتر مراقبه‌ات اضافه کن</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700 transition text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجو در اعمال..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayedCategories.map(cat => {
            const meta = CATEGORY_META[cat];
            const items = groupedByCategory[cat] || [];
            const isExpanded = expandedCategories.has(cat);

            return (
              <div key={cat} className={`rounded-2xl border overflow-hidden ${meta.borderColor} ${meta.bgColor}`}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${meta.bgColor} hover:opacity-90 transition`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.emoji}</span>
                    <span className={`font-bold text-sm ${meta.color}`}>{meta.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/30 ${meta.color}`}>
                      {toPersianDigits(items.length)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {items.filter(i => activeDeedLibraryIds.has(i.id)).length > 0 &&
                        `${toPersianDigits(items.filter(i => activeDeedLibraryIds.has(i.id)).length)} در دفترت`}
                    </span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  </div>
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="divide-y divide-white/50 dark:divide-gray-700/50">
                    {items.map(item => {
                      const isActive = activeDeedLibraryIds.has(item.id);
                      const pts = addingPoints[item.id] ?? item.defaultPoints;

                      return (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-white/70 dark:bg-gray-800/70">
                          {/* Type indicator */}
                          <div className={`flex-shrink-0 p-1.5 rounded-lg ${isActive ? meta.bgColor : 'bg-gray-100 dark:bg-gray-700'}`}>
                            {item.defaultType === 'binary'
                              ? <Check className={`w-3.5 h-3.5 ${isActive ? meta.color : 'text-gray-400'}`} />
                              : <Sliders className={`w-3.5 h-3.5 ${isActive ? meta.color : 'text-gray-400'}`} />
                            }
                          </div>

                          {/* Title + subtitle */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.title}</p>
                            {item.subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.subtitle}</p>}
                          </div>

                          {/* Points selector */}
                          {!isActive && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => setAddingPoints(p => ({ ...p, [item.id]: Math.max(5, (p[item.id] ?? item.defaultPoints) - 5) }))}
                                className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 flex items-center justify-center">−</button>
                              <span className="text-xs font-bold w-8 text-center text-gray-700 dark:text-gray-200">{toPersianDigits(pts)}</span>
                              <button onClick={() => setAddingPoints(p => ({ ...p, [item.id]: (p[item.id] ?? item.defaultPoints) + 5 }))}
                                className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 flex items-center justify-center">+</button>
                            </div>
                          )}

                          {/* Add/Remove button */}
                          {isActive ? (
                            <button
                              onClick={() => handleRemoveFromBoard(item.id)}
                              className="flex-shrink-0 flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 px-3 py-1.5 rounded-xl hover:bg-red-100 transition font-medium"
                            >
                              <X className="w-3 h-3" /> حذف از دفتر
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAdd(item)}
                              className={`flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl hover:opacity-90 transition font-medium text-white`}
                              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                            >
                              <Plus className="w-3 h-3" /> افزودن
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Custom in this category */}
                    <div className="px-4 py-3 bg-white/40 dark:bg-gray-800/40">
                      {customFormCategory === cat ? (
                        <div className="space-y-2">
                          <input
                            autoFocus
                            type="text"
                            value={customTitle}
                            onChange={e => setCustomTitle(e.target.value)}
                            placeholder="عنوان عمل سفارشی..."
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={customType}
                              onChange={e => setCustomType(e.target.value as 'binary' | 'scalar')}
                              className="flex-1 px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                              <option value="binary">✅ باینری (انجام / نانجام)</option>
                              <option value="scalar">📊 کیفی (نمره ۰ تا ۱۰۰)</option>
                            </select>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setCustomPoints(p => Math.max(5, p - 5))}
                                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-bold">−</button>
                              <span className="text-xs font-bold w-8 text-center">{toPersianDigits(customPoints)}</span>
                              <button onClick={() => setCustomPoints(p => p + 5)}
                                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-bold">+</button>
                            </div>
                            <button
                              onClick={handleAddCustom}
                              disabled={!customTitle.trim()}
                              className="px-3 py-1.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
                              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                            >
                              ذخیره
                            </button>
                            <button onClick={() => setCustomFormCategory(null)}
                              className="px-3 py-1.5 rounded-xl text-sm text-gray-500 bg-gray-100 dark:bg-gray-700">انصراف</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setCustomFormCategory(cat as DeedCategory); setCustomTitle(''); }}
                          className={`flex items-center gap-1.5 text-xs ${meta.color} hover:opacity-80 transition font-medium`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          افزودن عمل سفارشی در این دسته
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {displayedCategories.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>نتیجه‌ای یافت نشد</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <span className="text-xs text-gray-400">
            {toPersianDigits(activeDeeds.filter(d => !d.isLocked).length)} عمل در دفترت
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
