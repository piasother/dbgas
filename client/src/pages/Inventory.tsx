import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Package, TrendingDown, TrendingUp, CheckCircle, Plus, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Product, StockAlert, InventoryMovement } from "@shared/schema";

export function Inventory() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantity: 0,
    reason: '',
    notes: ''
  });

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

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: stockAlerts } = useQuery({
    queryKey: ["/api/inventory/alerts"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: inventoryMovements } = useQuery({
    queryKey: ["/api/inventory/movements"],
    enabled: isAuthenticated,
    retry: false,
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await apiRequest(`/api/inventory/alerts/${alertId}/acknowledge`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/alerts"] });
      toast({
        title: "Alert Acknowledged",
        description: "Stock alert has been acknowledged successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to acknowledge alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (adjustment: { productId: number; quantity: number; reason: string; notes?: string }) => {
      await apiRequest("/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify(adjustment),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/movements"] });
      setAdjustmentForm({ quantity: 0, reason: '', notes: '' });
      setSelectedProduct(null);
      toast({
        title: "Stock Adjusted",
        description: "Stock adjustment has been applied successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to adjust stock. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAdjustStock = () => {
    if (!selectedProduct || !adjustmentForm.reason || adjustmentForm.quantity === 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a product, enter a quantity, and provide a reason.",
        variant: "destructive",
      });
      return;
    }

    adjustStockMutation.mutate({
      productId: selectedProduct,
      quantity: adjustmentForm.quantity,
      reason: adjustmentForm.reason,
      notes: adjustmentForm.notes,
    });
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return { status: "Out of Stock", color: "bg-red-100 text-red-800" };
    } else if (product.stockQuantity <= product.lowStockThreshold) {
      return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    }
    return { status: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      case "low_stock":
        return "bg-yellow-100 text-yellow-800";
      case "reorder":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-2">Monitor stock levels and manage inventory</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Stock Alerts
              </CardTitle>
              <CardDescription>Active inventory alerts</CardDescription>
            </CardHeader>
            <CardContent>
              {stockAlerts && stockAlerts.length > 0 ? (
                <div className="space-y-3">
                  {stockAlerts.slice(0, 3).map((alert: StockAlert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Badge className={getAlertColor(alert.alertType)}>
                          {alert.alertType.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          Stock: {alert.currentStock} / Threshold: {alert.threshold}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                        disabled={acknowledgeAlertMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No active alerts</p>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Low Stock Items
              </CardTitle>
              <CardDescription>Products requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockProducts && lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 3).map((product: Product) => (
                    <div key={product.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-600">
                        Stock: {product.stockQuantity} / Threshold: {product.lowStockThreshold}
                      </p>
                      <Badge className={getStockStatus(product).color} size="sm">
                        {getStockStatus(product).status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">All products well-stocked</p>
              )}
            </CardContent>
          </Card>

          {/* Stock Adjustment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Adjust Stock
              </CardTitle>
              <CardDescription>Add or remove inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product-select">Product</Label>
                <Select onValueChange={(value) => setSelectedProduct(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product: Product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} (Current: {product.stockQuantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity Adjustment</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAdjustmentForm(prev => ({ ...prev, quantity: prev.quantity - 1 }))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className="text-center"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAdjustmentForm(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Select onValueChange={(value) => setAdjustmentForm(prev => ({ ...prev, reason: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restock">Restock</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Button
                onClick={handleAdjustStock}
                disabled={adjustStockMutation.isPending}
                className="w-full"
              >
                {adjustStockMutation.isPending ? "Adjusting..." : "Adjust Stock"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Products Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>Complete inventory overview</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Product</th>
                      <th className="text-left p-4">SKU</th>
                      <th className="text-left p-4">Current Stock</th>
                      <th className="text-left p-4">Low Stock Threshold</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product: Product) => {
                      const status = getStockStatus(product);
                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div>
                                <h4 className="font-medium">{product.name}</h4>
                                <p className="text-sm text-gray-600">{product.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{product.sku || 'N/A'}</td>
                          <td className="p-4 font-medium">{product.stockQuantity}</td>
                          <td className="p-4 text-gray-600">{product.lowStockThreshold}</td>
                          <td className="p-4">
                            <Badge className={status.color}>
                              {status.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{product.supplier || 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No products found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}