import { ProductsManager } from "@/components/admin/ProductsManager";
import { OrdersManager } from "@/components/admin/OrdersManager";
import { InquiriesManager } from "@/components/admin/InquiriesManager";
import { SiteImagesManager } from "@/components/admin/SiteImagesManager";
import { EmailTest } from "@/components/admin/EmailTest";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import type { User, AdminSetting, EmailSetting, Order, Product, DeliveryEvent, GalleryImage } from "@shared/schema";

/** Pull the server's error message out of an apiRequest error ("403: {\"error\":...}"). */
function serverError(err: any, fallback: string) {
  const text = String(err?.message || '');
  const json = text.slice(text.indexOf(':') + 1).trim();
  try {
    const parsed = JSON.parse(json);
    return parsed.error || parsed.message || fallback;
  } catch {
    return fallback;
  }
}

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
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [uploadCategory, setUploadCategory] = useState('gallery');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [uploadAltText, setUploadAltText] = useState('');
  const [linkingImage, setLinkingImage] = useState<any>(null);
  const [animatedStats, setAnimatedStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0
  });
  const intervalRefs = useRef<{ [key: string]: NodeJS.Timeout | null }>({});

  // Check if user is admin (you can modify this logic as needed)
  const myRole = (user as any)?.role as string | undefined;
  const isAdmin = myRole === "admin";
  // Staff can run orders, deliveries and stock; admins can do everything.
  const isStaff = isAdmin || myRole === "staff";
  const myId = (user as any)?.id as string | undefined;

  // Redirect if not staff/admin
  useEffect(() => {
    if (!authLoading && (!user || !isStaff)) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      window.location.href = "/";
    }
  }, [user, authLoading, isStaff, toast]);

  // Fetch admin data
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    enabled: isStaff,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
    enabled: isStaff,
  });

  const { data: emailSettings } = useQuery<EmailSetting>({
    queryKey: ['/api/admin/email-settings'],
    enabled: isAdmin,
  });

  const { data: deliveryEvents = [] } = useQuery<DeliveryEvent[]>({
    queryKey: ['/api/admin/delivery-events', selectedOrder?.id],
    enabled: isStaff && !!selectedOrder,
  });

  const { data: galleryImages = [] } = useQuery<GalleryImage[]>({
    queryKey: ['/api/admin/gallery-images'],
    enabled: isAdmin,
  });

  const { data: stockStatus } = useQuery<{inStock: Product[], lowStock: Product[], outOfStock: Product[]}>({
    queryKey: ['/api/admin/stock-status'],
    enabled: isStaff,
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
    onError: (err: any) => {
      toast({ title: "Error", description: serverError(err, "Failed to update user status"), variant: "destructive" });
    },
  });

  // Change user role mutation (user / staff / admin)
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      const label = vars.role === 'admin' ? 'Admin' : vars.role === 'staff' ? 'Staff' : 'Customer';
      toast({ title: "Role updated", description: `User is now: ${label}. It takes effect on their next page load.` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: serverError(err, "Failed to update role"), variant: "destructive" });
    },
  });

  const handleUserRoleChange = (target: any, newRole: string) => {
    const name = target.email || 'this user';
    const warning =
      newRole === 'admin'
        ? `Make ${name} an ADMIN?\n\nAdmins can see all customers and orders, change prices and stock, manage users and email settings.`
        : newRole === 'staff'
        ? `Make ${name} STAFF?\n\nStaff can view and update orders, deliveries and stock, but cannot manage users, prices or settings.`
        : `Remove ${name}'s staff/admin access and make them a normal customer?`;
    if (window.confirm(warning)) {
      updateRoleMutation.mutate({ userId: target.id, role: newRole });
    }
  };

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

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, updates }: { productId: number; updates: any }) => {
      await apiRequest("PUT", `/api/admin/products/${productId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({ title: "Success", description: "Product updated successfully" });
      setEditingProduct(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    },
  });

  // Update gallery image mutation
  const updateGalleryImageMutation = useMutation({
    mutationFn: async ({ imageId, updates }: { imageId: number; updates: any }) => {
      await apiRequest("PUT", `/api/admin/gallery-images/${imageId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gallery-images'] });
      toast({ title: "Success", description: "Image updated successfully" });
      setEditingImage(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update image", variant: "destructive" });
    },
  });

  // Link image to product mutation
  const linkImageMutation = useMutation({
    mutationFn: async ({ imageId, productId }: { imageId: number; productId: number | null }) => {
      await apiRequest("PUT", `/api/admin/gallery-images/${imageId}/link-product`, { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gallery-images'] });
      toast({ title: "Success", description: "Image linked successfully" });
      setLinkingImage(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to link image", variant: "destructive" });
    },
  });

  const handleEmailConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmailMutation.mutate(emailConfig);
  };

  const handleUserStatusChange = (userId: string, newStatus: string) => {
    updateUserMutation.mutate({ userId, status: newStatus });
  };

  const allTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: 'fas fa-tachometer-alt', staff: true },
    { id: 'users', name: 'Users', icon: 'fas fa-users', staff: false },
    { id: 'orders', name: 'Orders', icon: 'fas fa-shopping-cart', staff: true },
    { id: 'inquiries', name: 'Enquiries', icon: 'fas fa-inbox', staff: true },
    { id: 'delivery', name: 'Delivery Tracking', icon: 'fas fa-truck', staff: true },
    { id: 'products', name: 'Products', icon: 'fas fa-box', staff: false },
    { id: 'stock', name: 'Stock Management', icon: 'fas fa-warehouse', staff: true },
    { id: 'gallery', name: 'Gallery Manager', icon: 'fas fa-images', staff: false },
    { id: 'email', name: 'Email Settings', icon: 'fas fa-envelope', staff: false }
  ];
  const tabs = isAdmin ? allTabs : allTabs.filter((t) => t.staff);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalProducts: products.length,
    lowStockProducts: products.filter(p => p.stockQuantity <= p.lowStockThreshold).length
  };

  // Animation helper function
  const animateNumber = (start: number, end: number, key: string, duration = 1500) => {
    if (intervalRefs.current[key]) {
      clearInterval(intervalRefs.current[key]!);
    }
    
    const increment = (end - start) / (duration / 16);
    let current = start;
    
    intervalRefs.current[key] = setInterval(() => {
      current += increment;
      if (
        (increment > 0 && current >= end) || 
        (increment < 0 && current <= end)
      ) {
        current = end;
        clearInterval(intervalRefs.current[key]!);
        intervalRefs.current[key] = null;
      }
      
      setAnimatedStats(prev => ({
        ...prev,
        [key]: Math.floor(current)
      }));
    }, 16);
  };

  // Effect to animate stats when data changes
  useEffect(() => {
    if (activeTab === 'dashboard') {
      const newStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalProducts: products.length,
        lowStockProducts: products.filter(p => p.stockQuantity <= p.lowStockThreshold).length
      };

      Object.entries(newStats).forEach(([key, value]) => {
        const currentValue = animatedStats[key as keyof typeof animatedStats];
        if (currentValue !== value) {
          animateNumber(currentValue, value, key);
        }
      });
    }

    // Cleanup intervals on unmount
    return () => {
      Object.values(intervalRefs.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [users.length, orders.length, products.length, activeTab, users, orders, products]);

  // Early returns must come after every hook above (React rule of hooks).
  if (authLoading) {
    return <Layout><div className="min-h-screen flex items-center justify-center">Loading...</div></Layout>;
  }

  if (!user || !isStaff) {
    return <Layout><div className="min-h-screen flex items-center justify-center">Access Denied</div></Layout>;
  }

  // AnimatedWidget component
  const AnimatedWidget = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    bgColor, 
    textColor, 
    iconColor,
    delay = 0 
  }: {
    title: string;
    value: number;
    subtitle: string;
    icon: string;
    bgColor: string;
    textColor: string;
    iconColor: string;
    delay?: number;
  }) => (
    <div 
      className={`${bgColor} p-6 rounded-lg transform transition-all duration-500 hover:scale-105 hover:shadow-lg cursor-pointer`}
      style={{ 
        animationDelay: `${delay}ms`,
        animation: activeTab === 'dashboard' ? 'slideInUp 0.6s ease-out forwards' : 'none'
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`${textColor} text-sm font-medium opacity-80`}>{title}</p>
          <p className={`text-3xl font-bold ${textColor} transition-all duration-300`}>
            {value.toLocaleString()}
          </p>
          <p className={`${textColor} text-sm opacity-70 mt-1`}>{subtitle}</p>
        </div>
        <div className="relative">
          <i className={`${icon} text-4xl ${iconColor} transition-transform duration-300 hover:scale-110`}></i>
          <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
        </div>
      </div>
      <div className="mt-4 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white bg-opacity-60 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(100, (value / Math.max(stats.totalUsers, stats.totalOrders, stats.totalProducts)) * 100)}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <Layout>
      <PageHeader 
        title={isAdmin ? "Admin Dashboard" : "Staff Dashboard"}
        description={isAdmin ? "Manage DB Gas website and user accounts" : "Manage orders, deliveries and stock"}
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
                <div className="fade-in-scale">
                  <h2 className="text-2xl font-bold mb-6 slide-in-up">Dashboard Overview</h2>
                  
                  {/* Main Stats Cards */}
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <AnimatedWidget
                      title="Total Users"
                      value={animatedStats.totalUsers}
                      subtitle={`${animatedStats.activeUsers} active`}
                      icon="fas fa-users"
                      bgColor="bg-gradient-to-br from-blue-400 to-blue-600"
                      textColor="text-white"
                      iconColor="text-blue-200"
                      delay={100}
                    />
                    <AnimatedWidget
                      title="Total Orders"
                      value={animatedStats.totalOrders}
                      subtitle={`${animatedStats.pendingOrders} pending`}
                      icon="fas fa-shopping-cart"
                      bgColor="bg-gradient-to-br from-green-400 to-green-600"
                      textColor="text-white"
                      iconColor="text-green-200"
                      delay={200}
                    />
                    <AnimatedWidget
                      title="Products"
                      value={animatedStats.totalProducts}
                      subtitle={`${animatedStats.lowStockProducts} low stock`}
                      icon="fas fa-box"
                      bgColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
                      textColor="text-white"
                      iconColor="text-yellow-200"
                      delay={300}
                    />
                  </div>

                  {/* Additional Performance Metrics */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 slide-in-up" style={{ animationDelay: '400ms' }}>
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-3 rounded-full mr-4">
                          <i className="fas fa-chart-line text-purple-600 text-xl"></i>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Growth Rate</p>
                          <p className="text-2xl font-bold text-gray-900">+12%</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 slide-in-up" style={{ animationDelay: '500ms' }}>
                      <div className="flex items-center">
                        <div className="bg-red-100 p-3 rounded-full mr-4">
                          <i className="fas fa-exclamation-triangle text-red-600 text-xl animate-bounce-slow"></i>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Alerts</p>
                          <p className="text-2xl font-bold text-gray-900">{animatedStats.lowStockProducts}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 slide-in-up" style={{ animationDelay: '600ms' }}>
                      <div className="flex items-center">
                        <div className="bg-indigo-100 p-3 rounded-full mr-4">
                          <i className="fas fa-clock text-indigo-600 text-xl animate-pulse-slow"></i>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Avg Response</p>
                          <p className="text-2xl font-bold text-gray-900">2.3h</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 slide-in-up" style={{ animationDelay: '700ms' }}>
                      <div className="flex items-center">
                        <div className="bg-teal-100 p-3 rounded-full mr-4">
                          <i className="fas fa-trophy text-teal-600 text-xl"></i>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Satisfaction</p>
                          <p className="text-2xl font-bold text-gray-900">94%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-md slide-in-up" style={{ animationDelay: '800ms' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 h-32">
                      {[...Array(7)].map((_, i) => (
                        <div key={i} className="flex flex-col justify-end">
                          <div 
                            className="bg-gradient-to-t from-primary to-blue-400 rounded-t transition-all duration-1000 ease-out hover:from-blue-600 hover:to-blue-500"
                            style={{ 
                              height: `${Math.random() * 80 + 20}%`,
                              animation: `slideInUp 1s ease-out ${i * 100}ms forwards`
                            }}
                          ></div>
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">User Management</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Use <strong>Role</strong> to give access: <strong>Customer</strong> (shop only),{' '}
                    <strong>Staff</strong> (orders, deliveries and stock), <strong>Admin</strong> (everything, including users, prices and settings).
                    New staff must register on the website first.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map((userData) => (
                          <tr key={userData.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span
                                  aria-hidden="true"
                                  className="h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center uppercase"
                                >
                                  {((userData.firstName || userData.email || '?')[0])}
                                </span>
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
                              {(userData as any).isOwner || userData.id === myId ? (
                                <span
                                  className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800"
                                  title={(userData as any).isOwner ? 'Owner account - always admin' : "You can't change your own role"}
                                >
                                  {(userData as any).isOwner ? 'Owner (admin)' : 'Admin (you)'}
                                </span>
                              ) : (
                                <select
                                  aria-label={`Role for ${userData.email}`}
                                  value={(userData as any).role || 'user'}
                                  onChange={(e) => handleUserRoleChange(userData, e.target.value)}
                                  disabled={updateRoleMutation.isPending}
                                  className={`border rounded px-2 py-1 text-sm font-medium ${
                                    (userData as any).role === 'admin'
                                      ? 'border-red-200 bg-red-50 text-red-800'
                                      : (userData as any).role === 'staff'
                                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                                      : 'border-gray-300 bg-white text-gray-700'
                                  }`}
                                >
                                  <option value="user">Customer</option>
                                  <option value="staff">Staff</option>
                                  <option value="admin">Admin</option>
                                </select>
                              )}
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
                                disabled={(userData as any).isOwner || userData.id === myId}
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

              {activeTab === 'orders' && <OrdersManager orders={orders} isAdmin={isAdmin} />}

              {activeTab === 'inquiries' && <InquiriesManager />}

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
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h2 className="text-2xl font-bold">Stock Management</h2>
                    <a href="/inventory" className="btn-primary px-4 py-2 rounded-lg font-semibold inline-flex items-center">
                      <i className="fas fa-boxes mr-2"></i>Adjust stock levels
                    </a>
                  </div>
                  
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
                    {stockStatus?.outOfStock && stockStatus.outOfStock.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

                    {stockStatus?.lowStock && stockStatus.lowStock.length > 0 && (
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
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Image Category
                              </label>
                              <select 
                                value={uploadCategory}
                                onChange={(e) => setUploadCategory(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              >
                                <option value="gallery">General Gallery</option>
                                <option value="product">Product Image</option>
                                <option value="accessory">Accessory Image</option>
                                <option value="hero">Hero/Banner Image</option>
                                <option value="home">Home Page Image</option>
                              </select>
                            </div>
                            
                            {(uploadCategory === 'product' || uploadCategory === 'accessory') && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Link to Product
                                </label>
                                <select
                                  value={selectedProductId}
                                  onChange={(e) => setSelectedProductId(e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                  <option value="">Select a product...</option>
                                  {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.name} - {product.category}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Alt Text (Optional)
                              </label>
                              <input
                                type="text"
                                value={uploadAltText}
                                onChange={(e) => setUploadAltText(e.target.value)}
                                placeholder="Describe the image for accessibility"
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            
                            <button
                              onClick={() => {
                                const formData = new FormData();
                                formData.append('image', selectedImageFile);
                                formData.append('category', uploadCategory);
                                formData.append('altText', uploadAltText);
                                if (selectedProductId) {
                                  formData.append('productId', selectedProductId);
                                }
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

                  <SiteImagesManager />

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Product Images</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                      {products.slice(0, 8).map((product) => (
                        <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm">
                          <h4 className="font-medium mb-2 text-sm truncate">{product.name}</h4>
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                          <button
                            onClick={() => setEditingImage({ 
                              type: 'product', 
                              productId: product.id,
                              current: product.image,
                              title: `${product.name} Image`
                            })}
                            className="text-sm text-primary hover:text-blue-700"
                          >
                            <i className="fas fa-edit mr-1"></i>
                            Update
                          </button>
                        </div>
                      ))}
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
                          <div className="mt-2 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setEditingImage({ 
                                  type: 'gallery', 
                                  imageId: image.id,
                                  current: image.imageUrl,
                                  title: image.imageName
                                })}
                                className="text-sm text-primary hover:text-blue-700"
                              >
                                <i className="fas fa-edit mr-1"></i>
                                Edit
                              </button>
                              
                              {!image.productId && (
                                <button
                                  onClick={() => setLinkingImage({ 
                                    imageId: image.id, 
                                    imageName: image.imageName 
                                  })}
                                  className="text-sm text-green-600 hover:text-green-700"
                                >
                                  <i className="fas fa-link mr-1"></i>
                                  Link to Product
                                </button>
                              )}
                              
                              {image.productId && (
                                <button
                                  onClick={() => {
                                    linkImageMutation.mutate({ 
                                      imageId: image.id, 
                                      productId: null 
                                    });
                                  }}
                                  className="text-sm text-orange-600 hover:text-orange-700"
                                >
                                  <i className="fas fa-unlink mr-1"></i>
                                  Unlink
                                </button>
                              )}
                            </div>
                            
                            {image.productId && (
                              <p className="text-xs text-green-600">
                                <i className="fas fa-box mr-1"></i>
                                Linked to: {products.find(p => p.id === image.productId)?.name || 'Unknown Product'}
                              </p>
                            )}
                            <button
                              onClick={() => {
                                updateGalleryImageMutation.mutate({ 
                                  imageId: image.id, 
                                  updates: { isActive: !image.isActive } 
                                });
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

                  {/* Product Linking Modal */}
                  {linkingImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
                        <h3 className="text-lg font-semibold mb-4">Link Image to Product</h3>
                        <p className="text-gray-600 mb-4">
                          Link "{linkingImage.imageName}" to a product
                        </p>
                        
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target as HTMLFormElement);
                          const productId = formData.get('productId') as string;
                          
                          linkImageMutation.mutate({ 
                            imageId: linkingImage.imageId, 
                            productId: productId ? parseInt(productId) : null 
                          });
                        }}>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select Product
                            </label>
                            <select
                              name="productId"
                              required
                              className="w-full p-2 border border-gray-300 rounded-md"
                            >
                              <option value="">Choose a product...</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} ({product.category})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => setLinkingImage(null)}
                              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700"
                              disabled={linkImageMutation.isPending}
                            >
                              {linkImageMutation.isPending ? 'Linking...' : 'Link to Product'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Image Edit Modal */}
                  {editingImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
                        <h3 className="text-lg font-semibold mb-4">Update {editingImage.title}</h3>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target as HTMLFormElement);
                          const newImageUrl = formData.get('imageUrl') as string;
                          
                          if (editingImage.type === 'product' && editingImage.productId) {
                            updateProductMutation.mutate({ 
                              productId: editingImage.productId, 
                              updates: { image: newImageUrl } 
                            });
                          } else if (editingImage.type === 'gallery' && editingImage.imageId) {
                            updateGalleryImageMutation.mutate({ 
                              imageId: editingImage.imageId, 
                              updates: { imageUrl: newImageUrl } 
                            });
                          } else {
                            // For hero and installation images, you would need separate endpoints
                            toast({ 
                              title: "Note", 
                              description: "Static image updates require file replacement on server", 
                              variant: "destructive" 
                            });
                          }
                          setEditingImage(null);
                        }}>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Current Image</label>
                              <img 
                                src={editingImage.current} 
                                alt="Current"
                                className="w-full h-32 object-cover border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">New Image URL</label>
                              <input
                                name="imageUrl"
                                type="text"
                                defaultValue={editingImage.current}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="Enter new image URL"
                                required
                              />
                            </div>
                            <div className="text-sm text-gray-600">
                              <p><strong>Tip:</strong> Upload your image to a hosting service and paste the URL here.</p>
                              {editingImage.type === 'hero' || editingImage.type === 'installation' ? (
                                <p className="text-yellow-600 mt-1">
                                  <i className="fas fa-info-circle mr-1"></i>
                                  Static images require server file replacement
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex justify-end space-x-3 mt-6">
                            <button
                              type="button"
                              onClick={() => setEditingImage(null)}
                              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700"
                              disabled={updateProductMutation.isPending || updateGalleryImageMutation.isPending}
                            >
                              Update Image
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'products' && isAdmin && <ProductsManager products={products} />}

              {activeTab === 'email' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Email Configuration</h2>
                  <EmailTest />
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
                          placeholder="accounts@drewbulle.co.zw"
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
                          placeholder="accounts@drewbulle.co.zw"
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