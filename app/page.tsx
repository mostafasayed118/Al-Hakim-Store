'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Leaf, MessageCircle, Loader2, Package } from 'lucide-react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function Home() {
  const products = useQuery(api.products.list);
  const createLead = useMutation(api.leads.create);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const handleOrder = async (product: {
    _id: string;
    name: string;
    price: number;
    description?: string;
  }) => {
    setLoadingProductId(product._id);
    
    try {
      // Create lead in Convex
      const result = await createLead({
        productId: product._id as any,
        productName: product.name,
        productPrice: product.price,
      });

      // Build WhatsApp message
      const message = `Hello, I want to order ${product.name} - Price: ${(product.price / 100).toFixed(2)} EGP`;
      const phoneNumber = '201154580512'; // From env
      
      // Redirect to WhatsApp
      window.location.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setLoadingProductId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-green-800 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Leaf className="h-16 w-16 text-green-200" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Premium Olive Oil
          </h1>
          <p className="text-green-100 text-lg md:text-xl max-w-2xl mx-auto">
            Experience the finest quality olive oil, carefully sourced and crafted for your health and taste.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-green-900 mb-8 text-center">
            Our Products
          </h2>

          {products === undefined ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-green-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-green-300 mx-auto mb-4" />
              <p className="text-green-600 text-lg">No products available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100 hover:shadow-xl transition-shadow"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Leaf className="h-20 w-20 text-green-300" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-green-900">
                        {product.name}
                      </h3>
                      {product.size && (
                        <span className="bg-green-100 text-green-700 text-sm px-2 py-1 rounded-full">
                          {product.size}
                        </span>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-green-600 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-800">
                        {(product.price / 100).toFixed(2)} EGP
                      </span>

                      <button
                        onClick={() => handleOrder(product)}
                        disabled={loadingProductId === product._id}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        {loadingProductId === product._id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <MessageCircle className="h-5 w-5" />
                        )}
                        Order
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
            <span className="text-xl font-bold text-white">Al-Hakim Store</span>
          </div>
          <p className="text-green-300 text-sm">
            © {new Date().getFullYear()} Al-Hakim Store. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
