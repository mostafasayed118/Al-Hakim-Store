'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Leaf, MessageCircle, Loader2, Package, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';

export default function Home() {
  const { user } = useUser();
  // Use getWithStock for real-time stock updates
  const products = useQuery(api.products.getWithStock);
  const createOrder = useMutation(api.orders.create);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOrder = async (product: {
    _id: Id<"products">;
    name: string;
    price: number;
    stock?: number;
    description?: string;
  }) => {
    // Clear previous error
    setError(null);

    // Check stock before ordering
    if ((product.stock ?? 0) <= 0) {
      setError('نفد المخزون');
      return;
    }

    setLoadingProductId(product._id);

    try {
      // Create order and decrement stock (real-time)
      const result = await createOrder({
        productId: product._id,
        quantity: 1,
        userName: user?.fullName || undefined,
        userEmail: user?.primaryEmailAddress?.emailAddress || undefined,
      });

      // Build WhatsApp message in Egyptian Arabic
      const message = `سلام عليكم، أنا عايز أطلب المنتج ده: ${product.name} - بسعر: ${(product.price / 100).toFixed(2)} جنية - رقم الطلب: ${result.orderReference}`;
      const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201154580512';

      // Redirect to WhatsApp
      window.location.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ، من فضلك حاول مرة أخرى.');
    } finally {
      setLoadingProductId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar />

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
          <button onClick={() => setError(null)} className="mr-2 hover:bg-red-600 rounded p-1">
            ×
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-green-800 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Leaf className="h-16 w-16 text-green-200" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            زيت زيتون فاخر
          </h1>
          <p className="text-green-100 text-lg md:text-xl max-w-2xl mx-auto">
            استمتع بأفضل أنواع زيت الزيتون، مصدر بعناية وجودة عالية لصحتك ومذاقك
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-green-900 mb-8 text-center">
            منتجاتنا
          </h2>

          {products === undefined ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-green-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-green-300 mx-auto mb-4" />
              <p className="text-green-600 text-lg">لا توجد منتجات حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100 hover:shadow-xl transition-shadow"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Leaf className="h-20 w-20 text-green-300" />
                    )}

                    {/* Out of stock overlay */}
                    {(product.stock ?? 0) <= 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
                          نفد المخزون
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-green-900">
                        {product.name}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        {/* Stock badge */}
                        <span className={`text-sm px-2 py-1 rounded-full ${(product.stock ?? 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          المخزون: {product.stock ?? 0}
                        </span>
                        {product.size && (
                          <span className="bg-green-100 text-green-700 text-sm px-2 py-1 rounded-full">
                            {product.size}
                          </span>
                        )}
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-green-600 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-800">
                        {(product.price / 100).toFixed(2)} جنية
                      </span>

                      <button
                        onClick={() => handleOrder(product)}
                        disabled={loadingProductId === product._id || (product.stock ?? 0) <= 0}
                        className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg font-semibold transition-colors ${(product.stock ?? 0) <= 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                          }`}
                      >
                        {loadingProductId === product._id ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            جاري الطلب...
                          </>
                        ) : (product.stock ?? 0) <= 0 ? (
                          <>
                            <AlertCircle className="h-5 w-5" />
                            نفد المخزون
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-5 w-5" />
                            أطلب دلوقتي
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-green-100 py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Leaf className="h-6 w-6 text-green-300" />
            <span className="text-xl font-bold text-white">متجر الحكيم</span>
          </div>
          <p className="text-green-300 text-sm">
            © {new Date().getFullYear()} متجر الحكيم. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
