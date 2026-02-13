import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, FolderOpen } from 'lucide-react';
import { Category } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { subscribeToCollection, addItem, deleteItem, CATEGORIES_COLLECTION } from '../services/firebase';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });

  useEffect(() => {
    const unsubscribe = subscribeToCollection(CATEGORIES_COLLECTION, (data) => {
      setCategories(data as Category[]);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setLoading(true);
    try {
      await addItem(CATEGORIES_COLLECTION, formData);
      setIsModalOpen(false);
      setFormData({ name: '', slug: '', description: '' });
    } catch (error) {
      console.error(error);
      alert('Error creating category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This action cannot be undone.')) {
      await deleteItem(CATEGORIES_COLLECTION, id);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage product categories for your store.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          Add Category
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 w-full max-w-md">
        <Search className="ml-3 text-zinc-500" size={18} />
        <input 
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-sm text-white w-full placeholder-zinc-500 h-9"
        />
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mb-4">
            <FolderOpen size={24} />
          </div>
          <h3 className="text-white font-medium">No categories yet</h3>
          <p className="text-zinc-500 text-sm mt-1">Get started by creating your first category.</p>
        </div>
      ) : (
        <div className="bg-card border border-zinc-800 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/50 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium text-zinc-400">Name</th>
                  <th className="px-6 py-4 font-medium text-zinc-400">Slug</th>
                  <th className="px-6 py-4 font-medium text-zinc-400">Description</th>
                  <th className="px-6 py-4 text-right font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">{category.name}</td>
                    <td className="px-6 py-4 text-zinc-400 font-mono text-xs bg-zinc-900/50 rounded px-2 py-1 inline-block mt-3">{category.slug}</td>
                    <td className="px-6 py-4 text-zinc-500 max-w-xs truncate">{category.description || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Category">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Name" 
            placeholder="e.g. Electronics"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            autoFocus
          />
          <Input 
            label="Slug" 
            placeholder="e.g. electronics"
            value={formData.slug}
            onChange={(e) => setFormData({...formData, slug: e.target.value})}
            required
          />
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 min-h-[100px]"
              placeholder="Describe this category..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="button" variant="ghost" className="mr-2" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={loading}>Create Category</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};