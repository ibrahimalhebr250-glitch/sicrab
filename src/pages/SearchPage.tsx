import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 pb-20 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">صفحة البحث</h2>
          <p className="text-gray-600">قريباً...</p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
