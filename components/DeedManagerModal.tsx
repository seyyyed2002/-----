import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RotateCcw,
  Settings2,
  X
} from 'lucide-react';
import { DEEDS, toPersianDigits } from '../constants';
import { DeedDefinition } from '../types';

interface DeedManagerModalProps {
  deeds: DeedDefinition[];
  onClose: () => void;
  onSave: (deeds: DeedDefinition[]) => void;
}

type SectionKey = 'binary' | 'moral' | 'golden';

const SECTIONS: { key: SectionKey; title: string; description: string }[] = [
  { key: 'binary', title: 'اعمال قراردادی', description: 'انجام شده یا انجام نشده' },
  { key: 'moral', title: 'مراقبه‌های اخلاقی', description: 'امتیاز کیفی و نمازها' },
  { key: 'golden', title: 'اعمال طلایی', description: 'امتیازهای تشویقی' }
];

const getSectionKey = (deed: DeedDefinition): SectionKey => {
  if (deed.type === 'binary') return 'binary';
  if (deed.type === 'golden') return 'golden';
  return 'moral';
};

const getTypeLabel = (deed: DeedDefinition): string => {
  if (deed.type === 'binary') return 'بله / خیر';
  if (deed.type === 'golden') return 'پاداش';
  if (deed.type === 'prayer') return 'نماز';
  return 'کیفی';
};

export const DeedManagerModal: React.FC<DeedManagerModalProps> = ({ deeds, onClose, onSave }) => {
  const [draftDeeds, setDraftDeeds] = useState(() => deeds.map(deed => ({ ...deed })));
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const defaultDeedById = useMemo(() => new Map(DEEDS.map(deed => [deed.id, deed] as const)), []);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusableElements = Array.from(dialogRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )) as HTMLElement[];
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && (document.activeElement === firstElement || document.activeElement === titleRef.current)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const activeCount = draftDeeds.filter(deed => deed.isActive !== false).length;
  const hasBlankTitle = draftDeeds.some(deed => !deed.title.trim());
  const hasActiveBaseDeed = draftDeeds.some(
    deed => deed.isActive !== false && deed.type !== 'golden'
  );

  const updateDeed = (id: string, updates: Partial<DeedDefinition>) => {
    setDraftDeeds(current => current.map(deed => deed.id === id ? { ...deed, ...updates } : deed));
  };

  const moveDeed = (id: string, direction: -1 | 1) => {
    setDraftDeeds(current => {
      const deed = current.find(item => item.id === id);
      if (!deed) return current;

      const sectionItems = current.filter(item => getSectionKey(item) === getSectionKey(deed));
      const sectionIndex = sectionItems.findIndex(item => item.id === id);
      const target = sectionItems[sectionIndex + direction];
      if (!target) return current;

      const next = [...current];
      const currentIndex = next.findIndex(item => item.id === id);
      const targetIndex = next.findIndex(item => item.id === target.id);
      [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
      return next;
    });
  };

  const restoreDefaults = () => {
    setDraftDeeds(current => {
      const currentOrder = new Map(current.map((deed, index) => [deed.id, index] as const));
      const defaultOrder = new Map(DEEDS.map((deed, index) => [deed.id, index] as const));

      return current
        .map(deed => {
          const defaultDeed = defaultDeedById.get(deed.id);
          return defaultDeed
            ? { ...deed, title: defaultDeed.title, isActive: true }
            : deed;
        })
        .sort((a, b) => {
          const aDefaultOrder = defaultOrder.get(a.id);
          const bDefaultOrder = defaultOrder.get(b.id);
          if (aDefaultOrder !== undefined && bDefaultOrder !== undefined) {
            return aDefaultOrder - bDefaultOrder;
          }
          if (aDefaultOrder !== undefined) return -1;
          if (bDefaultOrder !== undefined) return 1;
          return Number(currentOrder.get(a.id) ?? 0) - Number(currentOrder.get(b.id) ?? 0);
        });
    });
  };

  const handleSave = () => {
    if (hasBlankTitle || !hasActiveBaseDeed) return;
    onSave(draftDeeds.map(deed => ({ ...deed, title: deed.title.trim() })));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deed-manager-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-gray-50 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="flex items-start justify-between border-b border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="deed-manager-title"
                ref={titleRef}
                tabIndex={-1}
                className="font-bold text-gray-800 outline-none dark:text-gray-100"
              >
                شخصی‌سازی معیارهای روزانه
              </h2>
              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                عنوان، ترتیب و حضور هر مورد در محاسبه امتیاز را تعیین کنید.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          <div className="flex items-center justify-between rounded-2xl border border-primary-100 bg-primary-50/70 px-4 py-3 dark:border-primary-900/40 dark:bg-primary-900/10">
            <div>
              <p className="text-xs font-bold text-primary-700 dark:text-primary-300">
                {toPersianDigits(activeCount)} مورد فعال از {toPersianDigits(draftDeeds.length)} مورد
              </p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                موارد غیرفعال در سوابق قبلی باقی می‌مانند.
              </p>
            </div>
            <button
              type="button"
              onClick={restoreDefaults}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-600 shadow-sm transition hover:text-primary-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              بازنشانی اصلی‌ها
            </button>
          </div>

          {SECTIONS.map(section => {
            const sectionDeeds = draftDeeds.filter(deed => getSectionKey(deed) === section.key);

            return (
              <section key={section.key} className="space-y-2">
                <div className="px-1">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{section.title}</h3>
                  <p className="text-[11px] text-gray-400">{section.description}</p>
                </div>

                {sectionDeeds.map((deed, index) => {
                  const isActive = deed.isActive !== false;
                  const defaultDeed = defaultDeedById.get(deed.id);
                  const titleChanged = defaultDeed && deed.title !== defaultDeed.title;

                  return (
                    <div
                      key={deed.id}
                      className={`rounded-2xl border bg-white p-3 shadow-sm transition dark:bg-gray-800 ${
                        isActive
                          ? 'border-gray-100 dark:border-gray-700'
                          : 'border-dashed border-gray-200 opacity-70 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isActive}
                          onClick={() => updateDeed(deed.id, { isActive: !isActive })}
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition ${
                            isActive
                              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                          }`}
                          title={isActive ? 'حذف از امتیاز روزانه' : 'افزودن به امتیاز روزانه'}
                        >
                          {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              value={deed.title}
                              onChange={event => updateDeed(deed.id, { title: event.target.value })}
                              className={`min-w-0 flex-1 rounded-lg border bg-gray-50 px-2.5 py-2 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:bg-gray-900 dark:text-gray-200 ${
                                deed.title.trim() ? 'border-gray-200 dark:border-gray-600' : 'border-red-400'
                              }`}
                              aria-label={`عنوان ${deed.title}`}
                            />
                            {titleChanged && (
                              <button
                                type="button"
                                onClick={() => updateDeed(deed.id, { title: defaultDeed.title })}
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                                title="بازگرداندن عنوان اصلی"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 px-1 text-[10px] text-gray-400">
                            <span>{getTypeLabel(deed)}</span>
                            <span>•</span>
                            <span>{deed.isCustom ? 'افزوده‌شده توسط شما' : 'پیشنهاد اولیه'}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveDeed(deed.id, -1)}
                            disabled={index === 0}
                            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-20 dark:hover:bg-gray-700"
                            aria-label="انتقال به بالا"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDeed(deed.id, 1)}
                            disabled={index === sectionDeeds.length - 1}
                            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-20 dark:hover:bg-gray-700"
                            aria-label="انتقال به پایین"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>

        <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          {!hasActiveBaseDeed && (
            <p className="mb-3 text-center text-xs font-medium text-red-500">
              برای محاسبه امتیاز، حداقل یک عمل غیرطلایی را فعال نگه دارید.
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={hasBlankTitle || !hasActiveBaseDeed}
              className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ذخیره تنظیمات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
