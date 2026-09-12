import React, { useState, useEffect } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  FileText,
  Calendar,
  X,
  ArrowRight,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, detailId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { students, teachers, classes, feeInvoices, exams, libraryBooks, notices } = useERPData();
  const { currentUser, hasModulePermission } = useAuth();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Results filtering by RBAC permission
  const matchingStudents = q && hasModulePermission('students', 'view')
    ? students
        .filter((s) => {
          if (currentUser.role === 'Student') {
            return s.id === 'std-1';
          }
          if (currentUser.role === 'Parent') {
            return s.id === 'std-1' || s.id === 'std-2';
          }
          return (
            s.firstName.toLowerCase().includes(q) ||
            s.lastName.toLowerCase().includes(q) ||
            s.admissionNo.toLowerCase().includes(q) ||
            s.rollNumber.includes(q)
          );
        })
        .filter((s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q) ||
          s.rollNumber.includes(q)
        )
        .slice(0, 4)
    : [];

  const matchingTeachers = q && hasModulePermission('teachers', 'view')
    ? teachers
        .filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.employeeId.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  const matchingClasses = q && hasModulePermission('classes', 'view')
    ? classes
        .filter((c) => c.name.toLowerCase().includes(q) || c.section.toLowerCase().includes(q))
        .slice(0, 3)
    : [];

  const matchingInvoices = q && hasModulePermission('fees', 'view')
    ? feeInvoices
        .filter((inv) => {
          if (currentUser.role === 'Student') {
            return inv.studentName.toLowerCase().includes('alex');
          }
          if (currentUser.role === 'Parent') {
            return inv.studentName.toLowerCase().includes('alex') || inv.studentName.toLowerCase().includes('maya');
          }
          return true;
        })
        .filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.studentName.toLowerCase().includes(q)
        )
        .slice(0, 3)
    : [];

  const matchingExams = q && hasModulePermission('exams', 'view')
    ? exams.filter((ex) => ex.name.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const matchingBooks = q && hasModulePermission('library', 'view')
    ? libraryBooks
        .filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q)
        )
        .slice(0, 3)
    : [];

  const matchingNotices = q && hasModulePermission('notices', 'view')
    ? notices.filter((n) => n.title.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const hasResults =
    matchingStudents.length > 0 ||
    matchingTeachers.length > 0 ||
    matchingClasses.length > 0 ||
    matchingInvoices.length > 0 ||
    matchingExams.length > 0 ||
    matchingBooks.length > 0 ||
    matchingNotices.length > 0;

  const handleSelect = (view: string, id?: string) => {
    onNavigate(view, id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/70 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-full items-start justify-center pt-16 sm:pt-24 px-4">
        <div
          className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="relative flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students, teachers, classes, invoices, exams, books..."
              autoFocus
              className="w-full py-4 pl-3 pr-8 text-sm sm:text-base bg-transparent text-slate-900 dark:text-white focus:outline-hidden"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm ml-2">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
            {!q ? (
              <div className="py-8 text-center text-slate-400">
                <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-medium text-slate-600 dark:text-slate-400">
                  Global ERP Quick Search
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Type an admission number, student name, teacher, course, or book title...
                </p>
              </div>
            ) : !hasResults ? (
              <div className="py-8 text-center text-slate-400">
                <p className="font-medium">No results found for "{query}"</p>
                <p className="text-xs mt-1">Try searching by ID, name, or category.</p>
              </div>
            ) : (
              <>
                {/* Students */}
                {matchingStudents.length > 0 && (
                  <div className="py-2">
                    <p className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-400">
                      Students ({matchingStudents.length})
                    </p>
                    {matchingStudents.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelect('student-profile', s.id)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {s.firstName} {s.lastName}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              {s.admissionNo} • {s.class} {s.section}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Teachers */}
                {matchingTeachers.length > 0 && (
                  <div className="py-2">
                    <p className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-400">
                      Teachers ({matchingTeachers.length})
                    </p>
                    {matchingTeachers.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelect('teachers', t.id)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {t.name}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              {t.subject} • {t.employeeId}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Invoices */}
                {matchingInvoices.length > 0 && (
                  <div className="py-2">
                    <p className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-400">
                      Fee Invoices ({matchingInvoices.length})
                    </p>
                    {matchingInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => handleSelect('fees', inv.id)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              {inv.studentName} (${inv.totalPayable}) • {inv.status}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Library Books */}
                {matchingBooks.length > 0 && (
                  <div className="py-2">
                    <p className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-400">
                      Library Books ({matchingBooks.length})
                    </p>
                    {matchingBooks.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handleSelect('library', b.id)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {b.title}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              by {b.author} • Shelf: {b.shelf}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Notices */}
                {matchingNotices.length > 0 && (
                  <div className="py-2">
                    <p className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-400">
                      Announcements ({matchingNotices.length})
                    </p>
                    {matchingNotices.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleSelect('notices', n.id)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {n.title}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              For: {n.targetAudience}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
