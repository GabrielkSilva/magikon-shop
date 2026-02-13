import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Upload, Image as ImageIcon, PackageOpen } from 'lucide-react';
import { Product, Category } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { 
  subscribeToCollection, 
  addItem, 
  deleteItem, 
  uploadImage,
  PRODUCTS_COLLECTION, 
  CATEGORIES_COLLECTION 
} from '../services/firebase';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const unsubProd = subscribeToCollection(PRODUCTS_COLLECTION, (data) => setProducts(data as Product[]));
    const unsubCat = subscribeToCollection(CATEGORIES_COLLECTION, (data) => setCategories(data as Category[]));
    return () => {
      unsubProd();
      unsubCat();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !price) return;

    setLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      } else {
        // Placeholder if no image provided? Or block?
        // Let's use a placeholder service
        imageUrl = `https://picsum.photos/seed/${encodeURIComponent(name)}/400/400`;
      }

      await addItem(PRODUCTS_COLLECTION, {
        name,
        categoryId,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        imageUrl,
      });

      // Reset
      setIsModalOpen(false);
      setName('');
      setCategoryId('');
      setPrice('');
      setStock('');
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error(error);
      alert('Error creating product: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this product?')) {
      await deleteItem(PRODUCTS_COLLECTION, id);
    }
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your inventory and pricing.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          Add Product
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 w-full max-w-md">
        <Search className="ml-3 text-zinc-500" size={18} />
        <input 
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-sm text-white w-full placeholder-zinc-500 h-9"
        />
      </div>

      {products.length === 0 ? (
         <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
         <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mb-4">
           <PackageOpen size={24} />
         </div>
         <h3 className="text-white font-medium">No products yet</h3>
         <p className="text-zinc-500 text-sm mt-1">Add items to your inventory.</p>
       </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="group bg-card border border-zinc-800 rounded-xl overflow-hidden hover:border-brand-500/30 hover:shadow-xl hover:shadow-brand-900/10 transition-all duration-300 flex flex-col">
              <div className="relative aspect-square bg-zinc-900 overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600">
                    <ImageIcon size={32} />
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-red-500/90 text-white rounded-md shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                   </button>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white truncate pr-2" title={product.name}>{product.name}</h3>
                  <span className="text-brand-400 font-bold text-sm">${product.price.toFixed(2)}</span>
                </div>
                <div className="mb-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-400">
                    {getCategoryName(product.categoryId)}
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800/50 pt-3">
                  <span>Stock: {product.stock}</span>
                  <span>Added {new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Product">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Image Upload Area */}
          <div className="w-full">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Product Image</label>
            <div 
              className={`
                relative border-2 border-dashed border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center text-center
                hover:border-brand-500 hover:bg-zinc-800/50 transition-colors cursor-pointer group
                ${imagePreview ? 'border-brand-500/50 bg-zinc-900' : ''}
              `}
            >
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              
              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-lg">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mb-3 group-hover:text-brand-400 transition-colors">
                    <Upload size={20} />
                  </div>
                  <p className="text-sm text-zinc-300 font-medium">Click to upload image</p>
                  <p className="text-xs text-zinc-500 mt-1">SVG, PNG, JPG or GIF</p>
                </>
              )}
            </div>
          </div>

          <Input 
            label="Product Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Wireless Headphones"
          />

          <div>
             <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 appearance-none"
              required
            >
              <option value="" disabled>Select a category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Price ($)" 
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              placeholder="0.00"
            />
            <Input 
              label="Stock" 
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="ghost" className="mr-2" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={loading}>Create Product</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};