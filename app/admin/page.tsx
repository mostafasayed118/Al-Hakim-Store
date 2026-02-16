'use client';

import React from 'react';

import { useAuth, useSession } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Users,
  TrendingUp,
  Clock,
  Loader2,
  XCircle,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Trash2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  AlertCircle,
  Box,
  RefreshCw,
  LayoutDashboard,
  ShoppingCart,
  Pencil,
  X,
  Check,
  MoreHorizontal
} from 'lucide-react';
import Navbar from '@/components/Navbar';

/**
 * Custom Tabs Component
 */
function Tabs({ children, defaultValue, className = '' }: { 
  children: React.ReactNode; 
  defaultValue: string; 
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  // Use context to pass state to children
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className} data-tabs-root>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Create context for tabs state
const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (v: string) => void;
}>({
  activeTab: 'dashboard',
  setActiveTab: () => {},
});

function TabsList({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  
  // Convert children to array and filter for TabsTrigger
  const triggers = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && (child.type === TabsTrigger || (child.type as any)?.name === 'TabsTrigger')
  );
  
  return (
    <div className={`flex gap-2 p-1 bg-green-100 rounded-xl mb-6 ${className}`}>
      {triggers.map((child, index) => {
        if (!React.isValidElement(child)) return null;
        const childProps = child.props as { value: string; children: React.ReactNode };
        const isActive = childProps.value === activeTab;
        return (
          <button
            key={index}
            onClick={() => setActiveTab(childProps.value)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-green-600 text-white shadow-md'
                : 'text-green-700 hover:bg-green-200'
            }`}
          >
            {childProps.children}
          </button>
        );
      })}
    </div>
  );
}

function TabsTrigger({ 
  children, 
  value 
}: { 
  children: React.ReactNode; 
  value: string 
}) {
  return <>{children}</>;
}

function TabsContent({ 
  children, 
  value 
}: { 
  children: React.ReactNode; 
  value: string 
}) {
  const { activeTab } = React.useContext(TabsContext);
  
  if (value !== activeTab) return null;
  
  return <>{children}</>;
}

/**
 * Custom Dropdown Menu Component
 */
function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if ((child.type as any)?.name === 'DropdownMenuTrigger') {
            return React.cloneElement(child as any, { onClick: () => setIsOpen(!isOpen), isOpen });
          }
          if ((child.type as any)?.name === 'DropdownMenuContent') {
            if (isOpen) {
              return React.cloneElement(child as any, { isOpen });
            }
            return null;
          }
          if ((child.type as any)?.name === 'DropdownMenuItem') {
            return child;
          }
        }
        return child;
      })}
    </div>
  );
}

function DropdownMenuTrigger({ 
  children, 
  isOpen, 
  onClick 
}: { 
  children: React.ReactNode; 
  isOpen?: boolean; 
  onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({ 
  children, 
  align = 'end',
  isOpen 
}: { 
  children: React.ReactNode; 
  align?: 'start' | 'center' | 'end';
  isOpen?: boolean;
}) {
  if (!isOpen) return null;
  
  const alignClass = align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2';
  
  return (
    <div className={`absolute ${alignClass} mt-2 w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1`}>
      {children}
    </div>
  );
}

function DropdownMenuItem({ 
  children, 
  onClick,
  className = '',
  destructive = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 text-sm text-right flex items-center gap-2 hover:bg-gray-100 cursor-pointer transition-colors ${
        destructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
      } ${className}`}
    >
      {children}
    </button>
  );
}
function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد الحذف',
  description = 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.',
  isLoading = false
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        
        <p className="text-gray-600 mb-6">{description}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحذف...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                حذف
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom Dialog Component for Edit Product
 */
function EditProductDialog({
  isOpen,
  onClose,
  product,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  nameError,
  isCheckingName,
  selectedImage,
  imagePreview,
  onImageSelect,
  onRemoveImage,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    size?: string;
    stock?: number;
    imageUrl?: string | null;
    stockUnit?: string;
  } | null;
  formData: {
    name: string;
    description: string;
    price: string;
    size: string;
    stock: string;
    stockUnit: string;
  };
  setFormData: (data: typeof formData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  nameError?: string | null;
  isCheckingName?: boolean;
  selectedImage?: File | null;
  imagePreview?: string | null;
  onImageSelect?: (file: File) => void;
  onRemoveImage?: () => void;
}) {
  if (!isOpen || !product) return null;

  const displayImage = imagePreview || product.imageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">تعديل المنتج</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Product Image Preview */}
        <div className="mb-4 flex justify-center">
          {displayImage ? (
            <div className="relative">
              <img
                src={displayImage}
                alt={product.name}
                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
              {onRemoveImage && (
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
              <Package className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Image Upload */}
        {onImageSelect && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-1">
              صورة المنتج (اختياري)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageSelect(file);
              }}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              اتركها فارغة للاحتفاظ بالصورة الحالية
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              اسم المنتج *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-green-500 ${nameError ? 'border-red-500' : ''}`}
            />
            {nameError && (
              <p className="text-red-500 text-sm mt-1">{nameError}</p>
            )}
            {isCheckingName && !nameError && (
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                جاري التحقق...
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              السعر (جنية) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 placeholder:text-gray-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              الحجم
            </label>
            <input
              type="text"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 placeholder:text-gray-500 focus:border-green-500"
              placeholder="500 مل"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              المخزون
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 placeholder:text-gray-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              الوصف
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 placeholder:text-gray-500 focus:border-green-500"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !!nameError}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                حفظ التغييرات
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Admin Content Component - Only rendered when user is authenticated as admin
 * This ensures queries are only called when the user has proper permissions
 */
function AdminContent() {
  // Queries - only called when user is authenticated as admin
  const products = useQuery(api.products.listAll);
  const leads = useQuery(api.leads.list, {});
  const stats = useQuery(api.leads.getStats);
  const stockStats = useQuery(api.products.getStockStats);

  // Calculate lead status counts from leads data
  const pendingCount = leads?.filter(l => l.status === "pending").length || 0;
  const contactedCount = leads?.filter(l => l.status === "contacted").length || 0;
  const convertedCount = leads?.filter(l => l.status === "converted").length || 0;
  const lostCount = leads?.filter(l => l.status === "lost").length || 0;

  // Mutations
  const createProduct = useMutation(api.products.create);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);
  const updateLeadStatus = useMutation(api.leads.updateStatus);
  const updateStock = useMutation(api.products.updateStock);
  const deleteProduct = useMutation(api.products.permanentDelete);
  const toggleProductActive = useMutation(api.products.toggleProductActive);
  const updateProduct = useMutation(api.products.update);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    size: '',
    stock: '',
    stockUnit: 'قطعة',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // File input ref for resetting
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pagination state for leads
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit product dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{
    _id: string;
    name: string;
    description?: string;
    price: number;
    size?: string;
    stock?: number;
    imageUrl?: string | null;
  } | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    size: '',
    stock: '',
    stockUnit: 'قطعة',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Edit dialog validation state
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [editSelectedImage, setEditSelectedImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // Debounce for name validation
  const [debouncedEditName, setDebouncedEditName] = useState('');

  // Add Product name validation state
  const [addNameError, setAddNameError] = useState<string | null>(null);
  const [isCheckingAddName, setIsCheckingAddName] = useState(false);
  const [debouncedAddName, setDebouncedAddName] = useState('');

  // Stock editing state
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState('');

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cleanup preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (editImagePreview) {
        URL.revokeObjectURL(editImagePreview);
      }
    };
  }, [previewUrl, editImagePreview]);

  // Debounce edit name for validation
  useEffect(() => {
    if (!editDialogOpen || !editFormData.name.trim()) {
      setEditNameError(null);
      setDebouncedEditName('');
      return;
    }

    // Skip validation if name hasn't changed from original
    if (editingProduct && editFormData.name.trim().toLowerCase() === editingProduct.name.trim().toLowerCase()) {
      setEditNameError(null);
      setDebouncedEditName('');
      return;
    }

    setIsCheckingName(true);
    const timer = setTimeout(() => {
      setDebouncedEditName(editFormData.name.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [editFormData.name, editDialogOpen, editingProduct]);

  // Check name availability
  const nameExists = useQuery(
    api.products.checkProductName,
    debouncedEditName ? { name: debouncedEditName, excludeId: editingProduct?._id as Id<"products"> | undefined } : "skip"
  );

  // Update error state when query returns
  useEffect(() => {
    if (debouncedEditName && nameExists === true) {
      setEditNameError('هذا الاسم مستخدم بالفعل');
    } else if (debouncedEditName && nameExists === false) {
      setEditNameError(null);
    }
    setIsCheckingName(false);
  }, [nameExists, debouncedEditName]);

  // Debounce add product name for validation
  useEffect(() => {
    if (!formData.name.trim()) {
      setAddNameError(null);
      setDebouncedAddName('');
      return;
    }

    setIsCheckingAddName(true);
    const timer = setTimeout(() => {
      setDebouncedAddName(formData.name.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.name]);

  // Check name availability for add product
  const addNameExists = useQuery(
    api.products.checkProductName,
    debouncedAddName ? { name: debouncedAddName } : "skip"
  );

  // Update error state when query returns
  useEffect(() => {
    if (debouncedAddName && addNameExists === true) {
      setAddNameError('هذا الاسم موجود بالفعل');
    } else if (debouncedAddName && addNameExists === false) {
      setAddNameError(null);
    }
    setIsCheckingAddName(false);
  }, [addNameExists, debouncedAddName]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force re-fetch by invalidating queries
    // The queries will automatically re-fetch
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('تم تحديث البيانات');
    }, 1000);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('ملف غير صالح', {
          description: 'من فضلك اختر ملف صورة صالح',
        });
        setSelectedImage(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف كبير', {
          description: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت',
        });
        setSelectedImage(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setSelectedImage(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  // Clear selected image
  const handleClearImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload image to Convex storage
  const uploadImage = async (file: File): Promise<Id<"_storage">> => {
    setUploadProgress('جاري رفع الصورة...');
    const postUrl = await generateUploadUrl();
    setUploadProgress('جاري معالجة الصورة...');

    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!result.ok) {
      const errorText = await result.text();
      console.error('Upload failed:', errorText);
      throw new Error(`فشل في رفع الصورة: ${result.status}`);
    }

    const { storageId } = await result.json();
    return storageId as Id<"_storage">;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress('');

    try {
      let storageId: Id<"_storage"> | undefined;

      if (selectedImage) {
        storageId = await uploadImage(selectedImage);
        setUploadProgress('جاري إضافة المنتج...');
      }

      await createProduct({
        name: formData.name,
        description: formData.description || undefined,
        price: Math.round(parseFloat(formData.price) * 100),
        size: formData.size || undefined,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        stockUnit: formData.stockUnit || 'قطعة',
        storageId,
      });

      // Reset form completely
      setFormData({ name: '', description: '', price: '', size: '', stock: '', stockUnit: 'قطعة' });
      setSelectedImage(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast.success('تم إضافة المنتج بنجاح!', {
        description: 'يمكنك رؤيته الآن في المتجر.',
      });
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('حدث خطأ أثناء الإضافة', {
        description: 'يرجى المحاولة مرة أخرى.',
      });
      setUploadProgress('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete product - permanently removes from database
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteProduct({ productId: productToDelete.id as Id<"products"> });
      toast.success('تم حذف المنتج نهائياً');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      // Show the actual error message from backend
      const errorMessage = error?.message || 'حدث خطأ أثناء الحذف';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open edit dialog with product data
  const openEditDialog = (product: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    size?: string;
    stock?: number;
    imageUrl?: string | null;
    stockUnit?: string;
  }) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description || '',
      price: (product.price / 100).toString(),
      size: product.size || '',
      stock: String(product.stock ?? 0),
      stockUnit: product.stockUnit || 'قطعة',
    });
    setEditSelectedImage(null);
    setEditImagePreview(null);
    setEditNameError(null);
    setDebouncedEditName('');
    setEditDialogOpen(true);
  };

  // Handle update product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Check for name validation error
    if (editNameError) {
      toast.error('يرجى اختيار اسم منتج مختلف');
      setIsEditing(false);
      return;
    }

    setIsEditing(true);
    try {
      let storageId: string | undefined;

      // If a new image is selected, upload it
      if (editSelectedImage) {
        // Generate upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload the file
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': editSelectedImage.type },
          body: editSelectedImage,
        });

        if (!result.ok) {
          throw new Error('Failed to upload image');
        }

        const { storageId: newStorageId } = await result.json();
        storageId = newStorageId;
        toast.success('تم رفع الصورة بنجاح');
      }

      await updateProduct({
        productId: editingProduct._id as Id<"products">,
        name: editFormData.name,
        description: editFormData.description || undefined,
        price: Math.round(parseFloat(editFormData.price) * 100),
        size: editFormData.size || undefined,
        stock: editFormData.stock ? parseInt(editFormData.stock) : 0,
        stockUnit: editFormData.stockUnit || 'قطعة',
        storageId: storageId as Id<"_storage"> | undefined,
      });
      toast.success('تم تحديث المنتج بنجاح');
      setEditDialogOpen(false);
      setEditingProduct(null);
      setEditFormData({ name: '', description: '', price: '', size: '', stock: '', stockUnit: 'قطعة' });
      setEditSelectedImage(null);
      setEditImagePreview(null);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('حدث خطأ أثناء التحديث');
    } finally {
      setIsEditing(false);
    }
  };

  // Handle stock update
  const handleStockUpdate = async (productId: string) => {
    const newStock = parseInt(stockValue);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('قيمة المخزون غير صحيحة');
      return;
    }

    try {
      await updateStock({ productId: productId as Id<"products">, stock: newStock });
      toast.success('تم تحديث المخزون');
      setEditingStock(null);
      setStockValue('');
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('حدث خطأ أثناء التحديث');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'contacted':
        return 'تم التواصل';
      case 'converted':
        return 'تم التحويل';
      case 'lost':
        return 'فقدان';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-green-900">لوحة التحكم</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>

        {/* Tabs Component */}
        <Tabs defaultValue="dashboard">
          {/* Tab Headers */}
          <TabsList>
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="h-4 w-4" />
              إدارة المنتجات
            </TabsTrigger>
            <TabsTrigger value="add-product">
              <Plus className="h-4 w-4" />
              إضافة منتج
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Dashboard - Stats & Leads */}
          <TabsContent value="dashboard">
            {/* Stats Cards - Lead Status Counts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Pending Card */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2.5 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-yellow-600 font-medium">قيد الانتظار</p>
                    <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
                  </div>
                </div>
              </div>

              {/* Contacted Card */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2.5 rounded-lg">
                    <PhoneIncoming className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">تم التواصل</p>
                    <p className="text-2xl font-bold text-blue-700">{contactedCount}</p>
                  </div>
                </div>
              </div>

              {/* Converted Card */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2.5 rounded-lg">
                    <PhoneOutgoing className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">تم التحويل</p>
                    <p className="text-2xl font-bold text-green-700">{convertedCount}</p>
                  </div>
                </div>
              </div>

              {/* Lost Card */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2.5 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-red-600 font-medium">فقدان</p>
                    <p className="text-2xl font-bold text-red-700">{lostCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards - Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2.5 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600">إجمالي الطلبات</p>
                    <p className="text-2xl font-bold text-green-900">{stats?.total || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2.5 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600">نسبة التحويل</p>
                    <p className="text-2xl font-bold text-green-900">
                      {stats?.total ? ((stats.converted / stats.total) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2.5 rounded-lg">
                    <Box className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600">إجمالي المخزون</p>
                    <p className="text-2xl font-bold text-green-900">{stockStats?.totalStock || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2.5 rounded-lg">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600">عدد المنتجات</p>
                    <p className="text-2xl font-bold text-green-900">{products?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Alerts */}
            {stockStats && (stockStats.outOfStock > 0 || stockStats.lowStock > 0) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-bold text-red-800">تنبيهات المخزون</h3>
                </div>
                <div className="flex gap-4">
                  {stockStats.outOfStock > 0 && (
                    <span className="text-red-700 text-sm">
                      {stockStats.outOfStock} منتج نفد منه المخزون
                    </span>
                  )}
                  {stockStats.lowStock > 0 && (
                    <span className="text-yellow-700 text-sm">
                      {stockStats.lowStock} منتج بمخزون منخفض (5 أو أقل)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Leads Table */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
              <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                الطلبات الأخيرة ({leads?.length || 0})
              </h2>

              {leads === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : leads.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد طلبات بعد</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-green-200">
                          <th className="text-right py-3 px-2 text-sm font-medium text-green-700">المنتج</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-green-700">السعر</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-green-700">العميل</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-green-700">التاريخ</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-green-700">الحالة</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-green-700">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.slice(page * pageSize, (page + 1) * pageSize).map((lead) => (
                          <tr key={lead._id} className="border-b border-green-100 hover:bg-green-50">
                            <td className="py-3 px-2">
                              <div>
                                <p className="font-medium text-green-900">{lead.productName}</p>
                                <p className="text-xs text-green-600">{lead.orderReference}</p>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-green-700">
                              {(lead.productPrice / 100).toFixed(2)} جنية
                            </td>
                            <td className="py-3 px-2">
                              {lead.userName ? (
                                <div>
                                  <p className="text-green-900">{lead.userName}</p>
                                  {lead.userEmail && (
                                    <p className="text-xs text-green-600">{lead.userEmail}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">غير محدد</span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-sm text-green-600">
                              {formatDate(lead.createdAt)}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead.status)}`}>
                                {getStatusText(lead.status)}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <select
                                  value={lead.status}
                                  onChange={async (e) => {
                                    const newStatus = e.target.value;
                                    try {
                                      await updateLeadStatus({
                                        leadId: lead._id,
                                        status: newStatus,
                                      });
                                      
                                      // Show specific message for conversion
                                      if (newStatus === "converted") {
                                        toast.success("تم تحويل الطلب وتم خصم المخزون");
                                      } else if (lead.status === "converted") {
                                        toast.success("تم إلغاء التحويل وتم إعادة المخزون");
                                      } else {
                                        toast.success('تم تحديث الحالة');
                                      }
                                    } catch (error: any) {
                                      // Show the actual error message from backend
                                      const errorMessage = error?.message || 'حدث خطأ أثناء التحديث';
                                      toast.error(errorMessage);
                                    }
                                  }}
                                  className="text-sm border border-green-200 rounded px-2 py-1 bg-white text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                  <option value="pending">قيد الانتظار</option>
                                  <option value="contacted">تم التواصل</option>
                                  <option value="converted">تم التحويل</option>
                                  <option value="lost">فقدان</option>
                                </select>
                                <a
                                  href={lead.whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                >
                                  <Phone className="h-4 w-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {leads.length > pageSize && (
                    <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-green-200">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                        السابق
                      </button>
                      <span className="text-sm text-gray-600 px-4">
                        صفحة <span className="font-medium text-gray-900">{page + 1}</span> من <span className="font-medium text-gray-900">{Math.ceil(leads.length / pageSize)}</span>
                      </span>
                      <button
                        onClick={() => setPage(Math.min(Math.ceil(leads.length / pageSize) - 1, page + 1))}
                        disabled={page >= Math.ceil(leads.length / pageSize) - 1}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                      >
                        التالي
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Product Management */}
          <TabsContent value="products">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
              <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                إدارة المنتجات ({products?.length || 0})
              </h2>

              {products === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : products.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد منتجات بعد</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-green-200">
                        <th className="text-right py-3 px-2 text-sm font-medium text-green-700">الصورة</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-green-700">اسم المنتج</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-green-700">السعر</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-green-700">المخزون</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-green-700">الحالة</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-green-700">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product._id} className="border-b border-green-100 hover:bg-green-50">
                          <td className="py-3 px-2">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                                <Package className="h-6 w-6 text-green-600" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium text-green-900">{product.name}</p>
                              {product.size && (
                                <p className="text-xs text-green-600">{product.size}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-green-700 font-medium">
                            {(product.price / 100).toFixed(2)} جنية
                          </td>
                          <td className="py-3 px-2">
                            {editingStock === product._id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={stockValue}
                                  onChange={(e) => setStockValue(e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center text-gray-900 font-bold bg-white"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleStockUpdate(product._id)}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-md p-1"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingStock(null);
                                    setStockValue('');
                                  }}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingStock(product._id);
                                  setStockValue(String(product.stock ?? 0));
                                }}
                                className={`px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                                  (product.stock ?? 0) > 5
                                    ? 'bg-green-100 text-green-700'
                                    : (product.stock ?? 0) > 0
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                }`}
                                title="انقر لتعديل المخزون"
                              >
                                {product.stock ?? 0}
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <button
                              onClick={async () => {
                                try {
                                  await toggleProductActive({ productId: product._id });
                                  toast.success(product.isActive ? 'تم إخفاء المنتج' : 'تم إظهار المنتج');
                                } catch (error: any) {
                                  toast.error(error?.message || 'حدث خطأ');
                                }
                              }}
                              className={`px-3 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                                product.isActive 
                                  ? 'bg-green-100 text-green-700 border border-green-300' 
                                  : 'bg-gray-100 text-gray-700 border border-gray-300'
                              }`}
                              title={product.isActive ? 'انقر لإخفاء المنتج' : 'انقر لإظهار المنتج'}
                            >
                              {product.isActive ? 'نشط' : 'غير نشط'}
                            </button>
                          </td>
                          <td className="py-3 px-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <MoreHorizontal className="h-4 w-4 text-green-700" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    openEditDialog(product);
                                  }}
                                  className="text-gray-700"
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  <span>تعديل</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setProductToDelete({ id: product._id, name: product.name });
                                    setDeleteDialogOpen(true);
                                  }}
                                  destructive
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>حذف</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Add New Product */}
          <TabsContent value="add-product">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
              <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                إضافة منتج جديد
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    اسم المنتج *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 ${
                      addNameError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="زيت زيتون بكر ممتاز"
                  />
                  {addNameError && (
                    <p className="text-red-500 text-sm mt-1">{addNameError}</p>
                  )}
                  {isCheckingAddName && formData.name && !addNameError && (
                    <p className="text-gray-500 text-sm mt-1">جاري التحقق...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    السعر (جنية) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500"
                    placeholder="299.99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    الحجم
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500"
                    placeholder="500 مل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    المخزون
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500"
                      placeholder="0"
                    />
                    <select
                      value={formData.stockUnit}
                      onChange={(e) => setFormData({ ...formData, stockUnit: e.target.value })}
                      className="px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="قطعة">قطعة</option>
                      <option value="زجاجة">زجاجة</option>
                      <option value="عبوة">عبوة</option>
                      <option value="كرتونة">كرتونة</option>
                      <option value="جركن">جركن</option>
                      <option value="لتر">لتر</option>
                      <option value="كيلو">كيلو</option>
                    </select>
                  </div>
                  <p className="text-xs text-green-500 mt-1">اتركه فارغاً إذا لم تكن تريد تتبع المخزون</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    الوصف
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500"
                    rows={3}
                    placeholder="زيت زيتون بكر ممتاز معصور على البارد..."
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    صورة المنتج
                  </label>

                  {/* File input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />

                  {/* Image preview */}
                  {selectedImage && previewUrl && (
                    <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start gap-4">
                        {/* Preview image */}
                        <img
                          src={previewUrl}
                          alt="معاينة الصورة"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-300 shadow-sm"
                        />

                        {/* File info */}
                        <div className="flex-1">
                          <p className="font-medium text-green-900 truncate">{selectedImage.name}</p>
                          <p className="text-sm text-green-600 mb-3">
                            {(selectedImage.size / 1024).toFixed(1)} KB
                          </p>

                          {/* Clear button */}
                          <button
                            type="button"
                            onClick={handleClearImage}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-white bg-red-50 hover:bg-red-600 rounded-lg transition-colors border border-red-200 hover:border-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            إزالة الصورة
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload progress */}
                {uploadProgress && (
                  <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadProgress}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !!addNameError || isCheckingAddName}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      إضافة المنتج
                    </>
                  )}
                </button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteProduct}
        title="حذف المنتج"
        description={`هل أنت متأكد من حذف "${productToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        isLoading={isDeleting}
      />

      {/* Edit Product Dialog */}
      <EditProductDialog
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleUpdateProduct}
        isSubmitting={isEditing}
        nameError={editNameError}
        isCheckingName={isCheckingName}
        selectedImage={editSelectedImage}
        imagePreview={editImagePreview}
        onImageSelect={(file) => {
          setEditSelectedImage(file);
          if (file) {
            const url = URL.createObjectURL(file);
            setEditImagePreview(url);
          }
        }}
        onRemoveImage={() => {
          setEditSelectedImage(null);
          setEditImagePreview(null);
        }}
      />
    </div>
  );
}

/**
 * Main Admin Page Component
 * Handles authentication and access control before rendering admin content
 */
export default function AdminPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { session } = useSession();

  // Check if user is admin
  const isAdmin = (session?.user?.publicMetadata as { role?: string })?.role === 'admin';

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  // Access control - only render AdminContent if user is signed in and is admin
  if (!isSignedIn || !isAdmin) {
    return (
      <div className="min-h-screen bg-green-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">وصول مرفوض</h1>
          <p className="text-gray-600">يجب أن تكون مديراً لعرض هذه الصفحة.</p>
        </div>
      </div>
    );
  }

  // User is authenticated as admin, render the admin content
  return <AdminContent />;
}
