import { useState } from 'react';
import Header from '../components/Header';
import CategoriesSlider from '../components/CategoriesSlider';
import SubcategoriesSlider from '../components/SubcategoriesSlider';
import Filters, { FilterState } from '../components/Filters';
import OffersGrid from '../components/OffersGrid';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    cityId: '',
    priceRange: '',
    condition: '',
    quantityRange: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
  };

  const handleSelectSubcategory = (subcategoryId: string | null) => {
    setSelectedSubcategory(subcategoryId);
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setFilters({
      cityId: '',
      priceRange: '',
      condition: '',
      quantityRange: '',
    });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onSearch={setSearchQuery} searchQuery={searchQuery} />

      <main className="flex-1 pb-20 pt-16 sm:pt-20">
        <CategoriesSlider
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />

        {selectedCategory && (
          <SubcategoriesSlider
            categoryId={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onSelectSubcategory={handleSelectSubcategory}
          />
        )}

        <Filters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        <OffersGrid
          categoryId={selectedCategory}
          subcategoryId={selectedSubcategory}
          filters={filters}
          searchQuery={searchQuery}
        />
      </main>

      <Footer />
      <BottomNav currentPage="home" />
    </div>
  );
}
