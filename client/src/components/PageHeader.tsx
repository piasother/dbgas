import { Link } from 'wouter';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({ 
  title, 
  description, 
  showBackButton = true, 
  backHref = "/", 
  backLabel = "Back to Home" 
}: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 py-6 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showBackButton && (
          <div className="mb-4">
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            </Link>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-lg text-gray-600 mt-2">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/account">
              <Button variant="outline" size="sm">
                My Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}