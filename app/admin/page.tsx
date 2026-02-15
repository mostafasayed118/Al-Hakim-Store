'use client';

import { useAuth, useSession } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { 
  Package, 
  Plus, 
  Users, 
  TrendingUp, 
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Phone
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { session } = useSession();
  
  // Check if user is admin
  const isAdmin = (session?.user?.publicMetadata as { role?: string })?.role === 'admin';

  // Queries
  const products = useQuery(api.products.listAll);
  const leads = useQuery(api.leads.list, {});
  const stats = useQuery(api.leads.getStats);

  // Mutations
  const createProduct = useMutation(api.products.create);
  const updateLeadStatus = useMutation(api.leads.updateStatus);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    size: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  // Access control
  if (!isSignedIn || !isAdmin) {
    return (
      <div className="min-h-screen bg-green-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      await createProduct({
        name: formData.name,
        description: formData.description || undefined,
        price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
        size: formData.size || undefined,
      });

      setFormData({ name: '', description: '', price: '', imageUrl: '', size: '' });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-EG', {
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

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-green-900 mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Total Leads</p>
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
                <p className="text-sm text-green-600">Pending</p>
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
                <p className="text-sm text-green-600">Converted</p>
                <p className="text-2xl font-bold text-green-900">{stats?.converted || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Products</p>
                <p className="text-2xl font-bold text-green-900">{products?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Product Form */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
            <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Product
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Extra Virgin Olive Oil"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Price (EGP) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="299.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Size
                </label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="500ml"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Premium cold-pressed olive oil..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : submitSuccess ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Product Added!
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Add Product
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
            <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Recent Leads
            </h2>

            {!leads || leads.length === 0 ? (
              <div className="text-center py-8 text-green-600">
                No leads yet. They will appear here when customers click "Order via WhatsApp".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-green-100">
                      <th className="text-left py-2 text-sm font-medium text-green-600">Customer</th>
                      <th className="text-left py-2 text-sm font-medium text-green-600">Product</th>
                      <th className="text-left py-2 text-sm font-medium text-green-600">Status</th>
                      <th className="text-left py-2 text-sm font-medium text-green-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 10).map((lead) => (
                      <tr key={lead._id} className="border-b border-green-50">
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-green-900">
                              {lead.userName || 'Guest'}
                            </p>
                            <p className="text-xs text-green-500">
                              {lead.userEmail || 'No email'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-green-900">{lead.productName}</p>
                            <p className="text-xs text-green-500">
                              {(lead.productPrice / 100).toFixed(2)} EGP
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus({ leadId: lead._id, status: e.target.value })}
                            className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(lead.status)}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                            <option value="lost">Lost</option>
                          </select>
                        </td>
                        <td className="py-3 text-sm text-green-600">
                          {formatDate(lead.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
