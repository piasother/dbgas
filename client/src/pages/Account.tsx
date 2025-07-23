import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User as UserIcon, Package, Calendar, Phone, MapPin, CreditCard, ShoppingCart, RefreshCw } from "lucide-react";
import type { Order, User as UserType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/hooks/useCart";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";

export function Account() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();
  
  // Type the user data properly
  const userData = user as UserType;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/my-orders"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Reorder mutation - simpler approach using order info directly from orders array
  const reorderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const ordersArray = Array.isArray(orders) ? orders : [];
      const order = ordersArray.find((o: Order) => o.id === orderId);
      if (!order) throw new Error('Order not found');
      
      const items = JSON.parse(order.items);
      items.forEach((item: any) => {
        addItem(item.product, item.quantity);
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Items have been added to your cart!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder items",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <Layout>
        <PageHeader 
          title="My Account" 
          description="Manage your profile and view your order history"
        />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <PageHeader 
        title="My Account" 
        description="Manage your profile and view your order history"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div></div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/api/logout"}
            >
              Log Out
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* User Profile */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Profile Information
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {userData?.profileImageUrl && (
                      <img
                        src={userData.profileImageUrl}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">
                        {userData?.firstName || userData?.lastName 
                          ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
                          : 'User'
                        }
                      </h3>
                      <p className="text-gray-600">{userData?.email}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="text-sm text-gray-600">
                    <p>Member since {new Date(userData?.createdAt || '').toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order History */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order History
                  </CardTitle>
                  <CardDescription>
                    View your recent orders and track their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-24 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order: Order) => (
                      <Card key={order.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Order #{order.id}</span>
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  {order.customerPhone}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                {order.deliveryAddress}
                              </div>

                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <CreditCard className="h-4 w-4" />
                                {order.paymentMethod}
                              </div>

                              <div className="text-sm">
                                <p className="text-gray-600">Items:</p>
                                <div className="pl-4">
                                  {JSON.parse(order.items).map((item: any, index: number) => (
                                    <p key={index} className="text-gray-800">
                                      {item.quantity}x {item.product.name}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">
                                ${((order.totalAmount || order.total || 0) / 100).toFixed(2)}
                              </p>
                              {/* One-Click Reorder Button */}
                              {(order.status === 'delivered' || order.status === 'confirmed') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => reorderMutation.mutate(order.id)}
                                  disabled={reorderMutation.isPending}
                                  className="mt-2"
                                >
                                  <RefreshCw className={`h-4 w-4 mr-2 ${reorderMutation.isPending ? 'animate-spin' : ''}`} />
                                  {reorderMutation.isPending ? 'Adding...' : 'Reorder'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
                      <Button onClick={() => window.location.href = "/#shop"}>
                        Browse Products
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}