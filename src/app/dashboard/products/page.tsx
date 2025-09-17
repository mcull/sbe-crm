import { Suspense } from 'react'
import { getProducts, getProductStats } from '@/lib/actions/products'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Package,
  Eye,
  Plus,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Edit,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getTypeBadge(type: string) {
  const variants: Record<string, any> = {
    course_session: { variant: 'default', text: 'Course Session' },
    digital_product: { variant: 'secondary', text: 'Digital Product' },
    physical_product: { variant: 'outline', text: 'Physical Product' }
  }

  const config = variants[type] || variants.course_session
  return (
    <Badge variant={config.variant}>
      {config.text}
    </Badge>
  )
}

async function ProductsStats() {
  const stats = await getProductStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            All products in catalog
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeProducts}</div>
          <p className="text-xs text-muted-foreground">
            Available for sale
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Product Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            Total sales revenue
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.topProducts.length}</div>
          <p className="text-xs text-muted-foreground">
            Products with sales
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function ProductsTable() {
  const products = await getProducts()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Products Catalog</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Sync with Stripe
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Product</th>
                <th className="text-left py-3 px-2">Type</th>
                <th className="text-left py-3 px-2">Pricing</th>
                <th className="text-left py-3 px-2">Stripe</th>
                <th className="text-left py-3 px-2">Course Sessions</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Created</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any) => (
                <tr key={product.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2">
                    <div className="max-w-[300px]">
                      <div className="font-medium truncate">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {product.description.slice(0, 60)}...
                        </div>
                      )}
                      {product.metadata?.wset_level && (
                        <div className="text-xs text-primary">
                          WSET Level {product.metadata.wset_level}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {getTypeBadge(product.type)}
                    {product.metadata?.course_type && (
                      <div className="text-xs text-muted-foreground mt-1 capitalize">
                        {product.metadata.course_type}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {product.course_sessions && product.course_sessions.length > 0 ? (
                      <div>
                        <div className="font-medium">
                          {formatCurrency(product.course_sessions[0].base_price || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Base price
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        No pricing set
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <div className="space-y-1">
                      {product.stripe_product_id ? (
                        <>
                          <Badge variant="default" className="text-xs">
                            Synced
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {product.stripe_product_id.slice(0, 12)}...
                          </div>
                          {product.stripe_price_id && (
                            <div className="text-xs text-green-600">
                              Price: {product.stripe_price_id.slice(0, 12)}...
                            </div>
                          )}
                        </>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Not synced
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {product.course_sessions ? (
                      <div>
                        <div className="font-medium">
                          {product.course_sessions.length} session{product.course_sessions.length !== 1 ? 's' : ''}
                        </div>
                        {product.course_sessions.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Next: {formatDate(product.course_sessions[0].start_date)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        No sessions
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={product.active ? 'default' : 'secondary'}>
                      {product.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm">
                      {formatDate(product.created_at)}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/products/${product.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      {product.stripe_product_id && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`https://dashboard.stripe.com/products/${product.stripe_product_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your course catalog and product offerings
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/sync">
            <Package className="mr-2 h-4 w-4" />
            Sync with Stripe
          </Link>
        </Button>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        <ProductsStats />
      </Suspense>

      <Suspense fallback={
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      }>
        <ProductsTable />
      </Suspense>
    </div>
  )
}