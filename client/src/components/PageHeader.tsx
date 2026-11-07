interface PageHeaderProps {
  title: string;
  description?: string;
  // Kept so existing pages still compile; navigation now lives in the main menu.
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 py-6 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-lg text-gray-600 mt-2">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
