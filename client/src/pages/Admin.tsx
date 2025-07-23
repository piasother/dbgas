import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { User, AdminSetting, EmailSetting, Order, Product, DeliveryEvent, GalleryImage } from "@shared/schema";

export function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [emailConfig, setEmailConfig] = useState({
    fromEmail: '',
    fromName: '',
    contactFormRecipient: '',
    orderNotificationEmail: ''
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Check if user is admin (you can modify this logic as needed)
  const isAdmin = user?.email === "andrewsbulle@gmail.com";

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      window.location.href = "/";
    }
  }, [user, authLoading, isAdmin, toast]);

  // Fetch admin data
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    enabled: isAdmin,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
    enabled: isAdmin,
  });

  const { data: emailSettings } = useQuery<EmailSetting>({
    queryKey: ['/api/admin/email-settings'],
    enabled: isAdmin,
  });

  const { data: deliveryEvents = [] } = useQuery<DeliveryEvent[]>({
    queryKey: ['/api/admin/delivery-events', selectedOrder?.id],
    enabled: isAdmin && !!selectedOrder,
  });

  const { data: galleryImages = [] } = useQuery<GalleryImage[]>({
    queryKey: ['/api/admin/gallery-images'],
    enabled: isAdmin,
  });

  const { data: stockStatus } = useQuery<{inStock: Product[], lowStock: Product[], outOfStock: Product[]}>({
    queryKey: ['/api/admin/stock-status'],
    enabled: isAdmin,
  });

  // Update email config when data is loaded
  useEffect(() => {
    if (emailSettings) {
      setEmailConfig({
        fromEmail: emailSettings.fromEmail || '',
        fromName: emailSettings.fromName || '',
        contactFormRecipient: emailSettings.contactFormRecipient || '',
        orderNotificationEmail: emailSettings.orderNotificationEmail || ''
      });
    }
  }, [emailSettings]);

  // Update user status mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User status updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
    },
  });

  // Update email settings mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (settings: typeof emailConfig) => {
      await apiRequest("PUT", "/api/admin/email-settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-settings'] });
      toast({ title: "Success", description: "Email settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update email settings", variant: "destructive" });
    },
  });

  // Update delivery status mutation
  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, status, trackingNumber }: { orderId: number; status: string; trackingNumber?: string }) => {
      await apiRequest("PATCH", `/api/admin/orders/${orderId}/delivery`, { 
        deliveryStatus: status, 
        trackingNumber 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/delivery-events'] });
      toast({ title: "Success", description: "Delivery status updated successfully" });
      setSelectedOrder(null);
      setDeliveryStatus('');
      setTrackingNumber('');
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update delivery status", variant: "destructive" });
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/gallery/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gallery-images'] });
      toast({ title: "Success", description: "Image uploaded successfully" });
      setSelectedImageFile(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    },
  });

  const handleEmailConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmailMutation.mutate(emailConfig);
  };

  const handleUserStatusChange = (userId: string, newStatus: string) => {
    updateUserMutation.mutate({ userId, status: newStatus });
  };

  if (authLoading) {
    return <Layout><div className="min-h-screen flex items-center justify-center">Loading...</div></Layout>;
  }

  if (!user || (user as any).role !== 'admin') {
    return <Layout><div className="min-h-screen flex items-center justify-center">Access Denied</div></Layout>;
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'users', name: 'Users', icon: 'fas fa-users' },
    { id: 'orders', name: 'Orders', icon: 'fas fa-shopping-cart' },
    { id: 'delivery', name: 'Delivery Tracking', icon: 'fas fa-truck' },
    { id: 'products', name: 'Products', icon: 'fas fa-box' },
    { id: 'stock', name: 'Stock Management', icon: 'fas fa-warehouse' },
    { id: 'gallery', name: 'Gallery Manager', icon: 'fas fa-images' },
    { id: 'email', name: 'Email Settings', icon: 'fas fa-envelope' }
  ];

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalProducts: products.length,
    lowStockProducts: products.filter(p => p.stockQuantity <= p.lowStockThreshold).length
  };

  return (
    <Layout>
      <PageHeader 
        title="Admin Dashboard" 
        description="Manage DB Gas website and user accounts"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <i className={`${tab.icon} mr-2`}></i>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'dashboard' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Total Users</p>
                          <p className="text-3xl font-bold text-blue-900">{stats.totalUsers}</p>
                          <p className="text-blue-600 text-sm">{stats.activeUsers} active</p>
                        </div>
                        <i className="fas fa-users text-4xl text-blue-400"></i>
                      </div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Total Orders</p>
                          <p className="text-3xl font-bold text-green-900">{stats.totalOrders}</p>
                          <p className="text-green-600 text-sm">{stats.pendingOrders} pending</p>
                        </div>
                        <i className="fas fa-shopping-cart text-4xl text-green-400"></i>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm font-medium">Products</p>
                          <p className="text-3xl font-bold text-yellow-900">{stats.totalProducts}</p>
                          <p className="text-yellow-600 text-sm">{stats.lowStockProducts} low stock</p>
                        </div>
                        <i className="fas fa-box text-4xl text-yellow-400"></i>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">User Management</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map((userData) => (
                          <tr key={userData.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <img 
                                  className="h-10 w-10 rounded-full" 
                                  src={userData.profileImageUrl || '/api/placeholder/40/40'} 
                                  alt="" 
                                />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {userData.firstName} {userData.lastName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {userData.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                (userData as any).role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {(userData as any).role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                (userData as any).status === 'active' ? 'bg-green-100 text-green-800' : 
                                (userData as any).status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {(userData as any).status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <select
                                value={(userData as any).status || 'active'}
                                onChange={(e) => handleUserStatusChange(userData.id, e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                                disabled={(userData as any).role === 'admin'}
                              >
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="deleted">Deleted</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Order Management</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{order.customerName}</div>
                              <div className="text-sm text-gray-500">{order.phoneNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${(order.total / 100).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'delivery' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Delivery Tracking</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Orders requiring delivery updates */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold mb-4">Orders Pending Delivery</h3>
                      <div className="space-y-3">
                        {orders.filter(order => order.status === 'confirmed' && order.deliveryStatus !== 'delivered').map((order) => (
                          <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                               onClick={() => setSelectedOrder(order)}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">Order #{order.id}</p>
                                <p className="text-sm text-gray-600">{order.customerName}</p>
                                <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  order.deliveryStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  order.deliveryStatus === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                                  order.deliveryStatus === 'in_transit' ? 'bg-purple-100 text-purple-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {order.deliveryStatus}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  ${(order.total / 100).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery status update form */}
                    {selectedOrder && (
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Update Delivery Status</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium">Order #{selectedOrder.id}</p>
                            <p className="text-sm text-gray-600">{selectedOrder.customerName}</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Delivery Status
                            </label>
                            <select
                              value={deliveryStatus}
                              onChange={(e) => setDeliveryStatus(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Select Status</option>
                              <option value="picked_up">Picked Up</option>
                              <option value="in_transit">In Transit</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="failed">Delivery Failed</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tracking Number (Optional)
                            </label>
                            <input
                              type="text"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Enter tracking number"
                            />
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateDeliveryMutation.mutate({
                                orderId: selectedOrder.id,
                                status: deliveryStatus,
                                trackingNumber: trackingNumber || undefined
                              })}
                              disabled={!deliveryStatus || updateDeliveryMutation.isPending}
                              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              {updateDeliveryMutation.isPending ? 'Updating...' : 'Update Status'}
                            </button>
                            <button
                              onClick={() => setSelectedOrder(null)}
                              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'stock' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Stock Management</h2>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">In Stock</h3>
                      <p className="text-3xl font-bold text-green-900">{stockStatus?.inStock.length || 0}</p>
                      <p className="text-green-600 text-sm">Products available</p>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Low Stock</h3>
                      <p className="text-3xl font-bold text-yellow-900">{stockStatus?.lowStock.length || 0}</p>
                      <p className="text-yellow-600 text-sm">Need restocking</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">Out of Stock</h3>
                      <p className="text-3xl font-bold text-red-900">{stockStatus?.outOfStock.length || 0}</p>
                      <p className="text-red-600 text-sm">Unavailable</p>
                    </div>
                  </div>

                  {/* Stock alerts and reorder suggestions */}
                  <div className="space-y-6">
                    {stockStatus?.outOfStock.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p4">
                        <h3 className="text-lg font-semibold text-red-800 mb-4">Out of Stock Products</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {stockStatus.outOfStock.map((product) => (
                            <div key={product.id} className="bg-white rounded p-4 border">
                              <div className="flex items-center space-x-3">
                                <img src={product.image} alt={product.name} className="h-12 w-12 rounded object-cover" />
                                <div className="flex-1">
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-gray-600">Lead Time: {product.leadTime || 'Unknown'} days</p>
                                  <p className="text-sm text-red-600">Out of Stock</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {stockStatus?.lowStock.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-4">Low Stock Alert</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {stockStatus.lowStock.map((product) => (
                            <div key={product.id} className="bg-white rounded p-4 border">
                              <div className="flex items-center space-x-3">
                                <img src={product.image} alt={product.name} className="h-12 w-12 rounded object-cover" />
                                <div className="flex-1">
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-gray-600">Current: {product.stockQuantity}</p>
                                  <p className="text-sm text-yellow-600">Threshold: {product.lowStockThreshold}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Gallery Manager</h2>
                  
                  <div className="mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-800 mb-4">Upload New Image</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Image File
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        
                        {selectedImageFile && (
                          <div>
                            <button
                              onClick={() => {
                                const formData = new FormData();
                                formData.append('image', selectedImageFile);
                                formData.append('category', 'product');
                                uploadImageMutation.mutate(formData);
                              }}
                              disabled={uploadImageMutation.isPending}
                              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              {uploadImageMutation.isPending ? 'Uploading...' : 'Upload Image'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {galleryImages.map((image) => (
                      <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <img 
                          src={image.imageUrl} 
                          alt={image.altText || image.imageName}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <p className="font-medium truncate">{image.imageName}</p>
                          <p className="text-sm text-gray-600">{image.category}</p>
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={() => {
                                // Toggle active status
                                // This would need an API endpoint
                              }}
                              className={`px-3 py-1 text-xs rounded-full ${
                                image.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {image.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Product Management</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <img className="h-10 w-10 rounded object-cover" src={product.image} alt="" />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${(product.price / 100).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{product.stockQuantity}</div>
                              {product.stockQuantity <= product.lowStockThreshold && (
                                <div className="text-xs text-red-600">Low Stock</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(product as any).leadTime || 0} days
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {product.stockQuantity > 0 ? 'In Stock' : 
                                 `Out of Stock (${(product as any).leadTime || 0}d lead time)`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Email Configuration</h2>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <i className="fas fa-info-circle text-yellow-600 mr-2"></i>
                      <p className="text-yellow-800">
                        Configure where contact form submissions and order notifications are sent.
                      </p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleEmailConfigSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          From Email Address
                        </label>
                        <input
                          type="email"
                          value={emailConfig.fromEmail}
                          onChange={(e) => setEmailConfig({...emailConfig, fromEmail: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="info@dbgas.co.zw"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          From Name
                        </label>
                        <input
                          type="text"
                          value={emailConfig.fromName}
                          onChange={(e) => setEmailConfig({...emailConfig, fromName: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="DB Gas Zimbabwe"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Form Recipient
                        </label>
                        <input
                          type="email"
                          value={emailConfig.contactFormRecipient}
                          onChange={(e) => setEmailConfig({...emailConfig, contactFormRecipient: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="info@dbgas.co.zw"
                        />
                        <p className="text-sm text-gray-500 mt-1">Where contact form submissions are sent</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Order Notification Email
                        </label>
                        <input
                          type="email"
                          value={emailConfig.orderNotificationEmail}
                          onChange={(e) => setEmailConfig({...emailConfig, orderNotificationEmail: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="orders@dbgas.co.zw"
                        />
                        <p className="text-sm text-gray-500 mt-1">Where new order notifications are sent</p>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={updateEmailMutation.isPending}
                      className="bg-primary text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updateEmailMutation.isPending ? 'Saving...' : 'Save Email Settings'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}