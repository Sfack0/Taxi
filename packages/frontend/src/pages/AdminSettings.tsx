import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CarouselImage } from '@cts/shared';
import * as carouselService from '../services/carousel.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import ThemeToggle from '../components/common/ThemeToggle';
import Logo from '../components/common/Logo';

const SortableImageCard = ({ image, index, onToggle, onDelete }: {
  image: CarouselImage;
  index: number;
  onToggle: (image: CarouselImage) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
        isDragging ? 'shadow-2xl scale-105 opacity-90' : ''
      } ${
        image.isActive
          ? 'border-green-500/50 dark:border-green-500/30'
          : 'border-gray-300 dark:border-gray-600 opacity-50'
      }`}
    >
      {/* Drag handle - the image itself */}
      <div className="aspect-square cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <img
          src={image.url}
          alt={image.alt || ''}
          className="w-full h-full object-cover pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23374151" width="200" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="14">No image</text></svg>';
          }}
        />
      </div>

      {/* Order badge */}
      <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        {index + 1}
      </span>

      {/* Controls - bottom bar, always visible */}
      <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 py-1.5 px-2">
        {/* Toggle active */}
        <button
          onClick={() => onToggle(image)}
          className={`p-1.5 rounded-md transition-all ${
            image.isActive
              ? 'bg-green-500/80 text-white hover:bg-green-600'
              : 'bg-gray-500/80 text-white hover:bg-gray-600'
          }`}
          title={image.isActive ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {image.isActive ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            )}
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(image._id)}
          className="p-1.5 bg-red-500/80 text-white rounded-md hover:bg-red-600 transition-all"
          title="Διαγραφή"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'van'>('hero');
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newAlt, setNewAlt] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await carouselService.getAllImages(activeTab);
      setImages(data);
    } catch {
      // error toast handled by api interceptor
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleAdd = async () => {
    if (!newUrl.trim()) return;
    setAdding(true);
    try {
      await carouselService.addImage(newUrl.trim(), activeTab, newAlt.trim() || undefined);
      showToast('Η εικόνα προστέθηκε', 'success');
      setNewUrl('');
      setNewAlt('');
      setAddModalOpen(false);
      await fetchImages();
    } catch {
      // error toast handled by api interceptor
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await carouselService.deleteImage(deleteId);
      showToast('Η εικόνα διαγράφηκε', 'success');
      setDeleteId(null);
      await fetchImages();
    } catch {
      // error toast handled by api interceptor
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (image: CarouselImage) => {
    try {
      await carouselService.updateImage(image._id, { isActive: !image.isActive });
      setImages((prev) =>
        prev.map((img) => (img._id === image._id ? { ...img, isActive: !img.isActive } : img))
      );
    } catch {
      // error toast handled by api interceptor
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img._id === active.id);
    const newIndex = images.findIndex((img) => img._id === over.id);
    const newImages = arrayMove(images, oldIndex, newIndex);
    setImages(newImages);

    try {
      await carouselService.reorderImages(newImages.map((img) => img._id));
    } catch {
      await fetchImages();
    }
  };

  return (
    <>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <Logo className="h-10 sm:h-12 md:h-16" />
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Ρυθμίσεις</h1>
              </div>
              {/* Desktop nav */}
              <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/admin')}>
                  Dashboard
                </Button>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/admin/calendar')}>
                  Ημερολόγιο
                </Button>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={logout}>
                  Έξοδος
                </Button>
              </div>
              {/* Mobile hamburger */}
              <div className="flex sm:hidden items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 text-gray-600 dark:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {menuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile sidebar overlay */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setMenuOpen(false)} />
            <div className="fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-2xl z-50 sm:hidden flex flex-col animate-[slideIn_0.2s_ease-out]">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-white">Μενού</span>
                <button onClick={() => setMenuOpen(false)} className="p-1 text-gray-500 dark:text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                <button onClick={() => { navigate('/admin'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  Dashboard
                </button>
                <button onClick={() => { navigate('/admin/calendar'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Ημερολόγιο
                </button>
                <button onClick={() => { navigate('/admin/settings'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Ρυθμίσεις
                </button>
              </nav>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Έξοδος
                </button>
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Carousel Images Section */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Εικόνες</h2>
              <Button size="sm" onClick={() => setAddModalOpen(true)}>
                + Προσθήκη
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 sm:mb-6">
              <button
                onClick={() => setActiveTab('hero')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'hero'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Αρχική Σελίδα
              </button>
              <button
                onClick={() => setActiveTab('van')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'van'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Όχημα
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : images.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Δεν υπάρχουν εικόνες. Προσθέστε μία για να ξεκινήσετε.
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={images.map((img) => img._id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                    {images.map((image, index) => (
                      <SortableImageCard
                        key={image._id}
                        image={image}
                        index={index}
                        onToggle={handleToggleActive}
                        onDelete={setDeleteId}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Card>
        </div>
      </div>

      {/* Add Image Modal */}
      <Modal isOpen={addModalOpen} onClose={() => { setAddModalOpen(false); setNewUrl(''); setNewAlt(''); }} title="Προσθήκη Εικόνας">
        <div className="space-y-4">
          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Επιλογή φωτογραφίας
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-700/50">
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">Πατήστε για επιλογή εικόνας</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const img = new Image();
                  img.onload = () => {
                    const maxW = 1920;
                    const scale = img.width > maxW ? maxW / img.width : 1;
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    setNewUrl(dataUrl);
                  };
                  img.src = URL.createObjectURL(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {/* Preview */}
          {newUrl.trim() && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Προεπισκόπηση:</p>
              <img
                src={newUrl.trim()}
                alt={newAlt || 'Preview'}
                className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={(e) => {
                  (e.target as HTMLImageElement).style.display = 'block';
                }}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setAddModalOpen(false); setNewUrl(''); setNewAlt(''); }}>
              Ακύρωση
            </Button>
            <Button size="sm" onClick={handleAdd} isLoading={adding} disabled={!newUrl.trim()}>
              Προσθήκη
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Επιβεβαίωση Διαγραφής" size="sm">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την εικόνα;
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
              Ακύρωση
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleting}>
              Διαγραφή
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdminSettings;
