import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { LibraryBook } from '../../types/erp';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookMarked,
  Layers,
} from 'lucide-react';

export const LibraryView: React.FC = () => {
  const { libraryBooks, students, issueBook, returnBook, addBook, showToast } = useERPData();
  const { hasModulePermission } = useAuth();

  const canAddBook = hasModulePermission('library', 'create');
  const canIssueReturn = hasModulePermission('library', 'create') || hasModulePermission('library', 'edit');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);

  const [issueStudentId, setIssueStudentId] = useState(students[0]?.id || '');
  const [issueDays, setIssueDays] = useState(14);

  const [newBookData, setNewBookData] = useState<Partial<LibraryBook>>({
    isbn: '978-0134685991',
    title: '',
    author: '',
    category: 'Science',
    totalCopies: 5,
    availableCopies: 5,
    rackNumber: 'Rack A-04',
  });

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    const std = students.find((s) => s.id === issueStudentId);
    if (!std) return;

    const due = new Date();
    due.setDate(due.getDate() + issueDays);

    issueBook(selectedBook.id, std.id, `${std.firstName} ${std.lastName}`, due.toISOString().split('T')[0]);
    showToast('Book Issued', `"${selectedBook.title}" issued to ${std.firstName} ${std.lastName}.`);
    setIsIssueModalOpen(false);
  };

  const handleAddNewBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookData.title || !newBookData.author) {
      showToast('Validation Error', 'Title and author are required.', 'error');
      return;
    }

    addBook({
      isbn: newBookData.isbn || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      title: newBookData.title || '',
      author: newBookData.author || '',
      category: newBookData.category || 'General',
      totalCopies: Number(newBookData.totalCopies) || 5,
      availableCopies: Number(newBookData.totalCopies) || 5,
      rackNumber: newBookData.rackNumber || 'Rack A-01',
      status: 'Available',
    });
    showToast('Book Cataloged', `"${newBookData.title}" added to school library.`);
    setIsAddModalOpen(false);
  };

  const baseColumns: Column<LibraryBook>[] = [
    {
      key: 'title',
      header: 'Book Title & Author',
      accessor: (b) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 border border-blue-200 dark:border-blue-800">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{b.title}</p>
            <p className="text-xs text-slate-400">by {b.author}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">ISBN: {b.isbn}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Rack',
      accessor: (b) => (
        <div>
          <Badge variant="primary" size="sm">
            {b.category}
          </Badge>
          <p className="text-xs text-slate-400 mt-1">{b.rackNumber}</p>
        </div>
      ),
    },
    {
      key: 'availableCopies',
      header: 'Inventory Status',
      accessor: (b) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white">
            {b.availableCopies} of {b.totalCopies} Available
          </span>
          <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${(b.availableCopies / b.totalCopies) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'borrower',
      header: 'Current Borrower',
      accessor: (b) => (
        <div className="text-xs">
          {b.borrowerName ? (
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{b.borrowerName}</p>
              <p className="text-[11px] text-rose-500">Due: {b.dueDate}</p>
            </div>
          ) : (
            <span className="text-slate-400">In Stacks</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (b) => (
        <Badge
          variant={b.availableCopies > 0 ? 'success' : 'danger'}
          size="sm"
          dot
        >
          {b.availableCopies > 0 ? 'Available' : 'All Borrowed'}
        </Badge>
      ),
    },
  ];

  const columns: Column<LibraryBook>[] = canIssueReturn
    ? [
        ...baseColumns,
        {
          key: 'actions',
          header: 'Circulation',
          sortable: false,
          accessor: (b) => (
            <div className="flex items-center gap-2">
              {b.borrowerName ? (
                <button
                  onClick={() => {
                    returnBook(b.id);
                    showToast('Book Returned', `"${b.title}" returned to shelves.`);
                  }}
                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Return</span>
                </button>
              ) : (
                <button
                  disabled={b.availableCopies === 0}
                  onClick={() => {
                    setSelectedBook(b);
                    setIsIssueModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Issue Book
                </button>
              )}
            </div>
          ),
        },
      ]
    : baseColumns;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library Information & Circulation System"
        subtitle="Catalog book inventory, track issues/returns, and manage shelf locations"
        badge={<Badge variant="primary">{libraryBooks.length} Books in Catalog</Badge>}
        actions={
          canAddBook ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Book to Catalog</span>
            </button>
          ) : undefined
        }
      />

      {/* Main DataTable */}
      <DataTable
        title="Central Library Catalog"
        subtitle="Search books by title, author, barcode, or subject category"
        data={libraryBooks}
        columns={columns}
        keyExtractor={(b) => b.id}
        searchPlaceholder="Search title, author, ISBN barcode, shelf..."
      />

      {/* Issue Book Modal */}
      {selectedBook && (
        <Modal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          title={`Issue Book: ${selectedBook.title}`}
          subtitle={`Available copies: ${selectedBook.availableCopies}`}
          maxWidth="md"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueSubmit}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                Confirm Issue
              </button>
            </>
          }
        >
          <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Student Member
              </label>
              <select
                value={issueStudentId}
                onChange={(e) => setIssueStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.class}-{s.section})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Loan Duration (Days)
              </label>
              <select
                value={issueDays}
                onChange={(e) => setIssueDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={30}>30 Days (1 Month)</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Add New Book Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Book to Library Catalog"
        subtitle="Enter publication details, shelf location, and initial quantity"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddNewBook}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              Catalog Book
            </button>
          </>
        }
      >
        <form onSubmit={handleAddNewBook} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Book Title *
            </label>
            <input
              type="text"
              required
              value={newBookData.title || ''}
              onChange={(e) => setNewBookData({ ...newBookData, title: e.target.value })}
              placeholder="e.g. Fundamentals of Physics"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Author *
              </label>
              <input
                type="text"
                required
                value={newBookData.author || ''}
                onChange={(e) => setNewBookData({ ...newBookData, author: e.target.value })}
                placeholder="e.g. Halliday & Resnick"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ISBN Barcode
              </label>
              <input
                type="text"
                value={newBookData.isbn || ''}
                onChange={(e) => setNewBookData({ ...newBookData, isbn: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={newBookData.category || 'Science'}
                onChange={(e) => setNewBookData({ ...newBookData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Literature">Literature</option>
                <option value="History">History</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Copies
              </label>
              <input
                type="number"
                value={newBookData.totalCopies || 5}
                onChange={(e) => setNewBookData({ ...newBookData, totalCopies: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Shelf Rack
              </label>
              <input
                type="text"
                value={newBookData.rackNumber || 'Rack A-01'}
                onChange={(e) => setNewBookData({ ...newBookData, rackNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
