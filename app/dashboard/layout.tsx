import DashboardHeader from '@/components/DashboardHeader';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Dashboard Header */}
            <DashboardHeader />

            {/* Main Content */}
            <main className="flex-1 py-8">
                <div className="container mx-auto px-4">
                    {children}
                </div>
            </main>
        </div>
    );
}
