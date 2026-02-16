'use client';

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
  Trash2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Box
} from 'lucide-react';
import Navbar from '@/components/Navbar';

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

  // Mutations
  const createProduct = useMutation(api.products.create);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);
  const updateLeadStatus = useMutation(api.leads.updateStatus);
  const updateStock = useMutation(api.products.updateStock);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    size: '',
    stock: '',
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

  // Cleanup preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('ملف غير صالح', {
          description: 'من فضلك اختر ملف صورة صالح',
        });
        // Clear file input on validation error
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
        // Clear file input on validation error
        setSelectedImage(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Clear previous preview URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // Store the file
      setSelectedImage(file);

      // Create preview URL
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

    // Get upload URL from Convex
    const postUrl = await generateUploadUrl();

    setUploadProgress('جاري معالجة الصورة...');

    // Upload file to Convex storage
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

    // Get storage ID from response
    const { storageId } = await result.json();

    return storageId as Id<"_storage">;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress('');

    try {
      let storageId: Id<"_storage"> | undefined;

      // Upload image if selected
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
        storageId,
      });

      // Reset form completely
      setFormData({ name: '', description: '', price: '', size: '', stock: '' });
      setSelectedImage(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Show success toast
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
        <h1 className="text-3xl font-bold text-green-900 mb-8">لوحة التحكم</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-green-900">{stats?.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">قيد الانتظار</p>
                <p className="text-2xl font-bold text-green-900">{stats?.pending || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">تم التحويل</p>
                <p className="text-2xl font-bold text-green-900">{stats?.converted || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Box className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">إجمالي المخزون</p>
                <p className="text-2xl font-bold text-green-900">{stockStats?.totalStock || 0}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Product Form */}
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
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500"
                  placeholder="زيت زيتون بكر ممتاز"
                />
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
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500"
                  placeholder="0"
                />
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
                disabled={isSubmitting}
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

          {/* Products List */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
            <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              المنتجات ({products?.length || 0})
            </h2>

            {products === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد منتجات بعد</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                  >
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
                    <div className="flex-1">
                      <p className="font-medium text-green-900">{product.name}</p>
                      <p className="text-sm text-green-600">
                        {(product.price / 100).toFixed(2)} جنية
                        {product.size && ` • ${product.size}`}
                      </p>
                    </div>
                    <div className="text-left">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        (product.stock ?? 0) > 5
                          ? 'bg-green-100 text-green-700'
                          : (product.stock ?? 0) > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        المخزون: {product.stock ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leads Table */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-green-100">
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
                                try {
                                  await updateLeadStatus({
                                    leadId: lead._id,
                                    status: e.target.value,
                                  });
                                  toast.success('تم تحديث الحالة');
                                } catch (error) {
                                  toast.error('حدث خطأ أثناء التحديث');
                                }
                              }}
                              className="text-sm border border-green-200 rounded px-2 py-1 bg-white"
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
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-green-200">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </button>
                  <span className="text-sm text-green-600">
                    صفحة {page + 1} من {Math.ceil(leads.length / pageSize)}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(Math.ceil(leads.length / pageSize) - 1, page + 1))}
                    disabled={page >= Math.ceil(leads.length / pageSize) - 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
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
