import React, { useState } from 'react';
import {
  FolderArchive,
  Plus,
  Search,
  FileText,
  Download,
  ExternalLink,
  Share2,
  Trash2,
  Filter,
  Tag,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTurkish } from '../utils/formatters';

export const DocumentsView: React.FC = () => {
  const { students, documents, deleteDocument, openModal } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const filteredDocs = documents.filter((doc) => {
    if (categoryFilter !== 'all' && doc.fileType !== categoryFilter) return false;
    if (gradeFilter !== 'all' && doc.gradeLevel !== gradeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.topic?.toLowerCase().includes(q) ||
        doc.fileType.toLowerCase().includes(q) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
              <FolderArchive className="w-6 h-6 text-blue-600" />
              <span>Doküman & Kaynak Merkezi</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Matematik föyleri, yeni nesil soru bankaları, deneme sınavı PDF'leri ve Drive arşivleri
            </p>
          </div>

          <button
            onClick={() => openModal('addDocument')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Doküman Ekle</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Föy veya konu ara..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="PDF">PDF</option>
              <option value="Word">Word</option>
              <option value="Görsel">Görsel</option>
              <option value="URL Link">URL Link</option>
              <option value="Diğer">Diğer</option>
            </select>

            {/* Grade Filter */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-xs font-semibold p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Tüm Sınıflar</option>
              <option value="8. Sınıf">8. Sınıf (LGS)</option>
              <option value="12. Sınıf">12. Sınıf</option>
              <option value="11. Sınıf">11. Sınıf</option>
              <option value="7. Sınıf">7. Sınıf</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Toplam <strong>{filteredDocs.length}</strong> doküman
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const linkedStudents = students.filter((s) => doc.studentIds.includes(s.id));

          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header Badge & File Type */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-wider">
                    {doc.isUrl ? (doc.urlPlatform || 'URL') : doc.fileType}
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {doc.fileType} {doc.fileSize ? `• ${doc.fileSize}` : ''}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <span>{doc.gradeLevel || 'Matematik'}</span>
                    {doc.topic && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate">
                          {doc.topic}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Student specific tag */}
                {linkedStudents.length > 0 && (
                  <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-xl">
                    👤 Özel Atanan: {linkedStudents.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                  </div>
                )}
                {doc.tags.length > 0 && <div className="text-[10px] text-slate-500">#{doc.tags.join(' #')}</div>}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400">
                  {formatDateTurkish(doc.createdAt, 'short')}
                </span>

                <div className="flex items-center gap-1.5">
                  <a
                    href={doc.isUrl ? (doc.url || '#') : (doc.fileUrl || '#')}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Aç / İndir"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
