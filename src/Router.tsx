import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ListingDetails from './pages/ListingDetails';
import AddListing from './pages/AddListing';
import Login from './pages/Login';
import Profile from './pages/Profile';
import MyListings from './pages/MyListings';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import PromoteListing from './pages/PromoteListing';
import MyPromotions from './pages/MyPromotions';
import PublicProfile from './pages/PublicProfile';
import TermsOfService from './pages/TermsOfService';
import CategoryPage from './pages/CategoryPage';
import CityPage from './pages/CityPage';
import Growth from './pages/Growth';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/listing/:slug" element={<ListingDetails />} />
      <Route path="/add" element={<AddListing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/my-listings" element={<MyListings />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/conversation/:id" element={<Conversation />} />
      <Route path="/promote/:id" element={<PromoteListing />} />
      <Route path="/my-promotions" element={<MyPromotions />} />
      <Route path="/user/:id" element={<PublicProfile />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/city/:slug" element={<CityPage />} />
      <Route path="/growth" element={<Growth />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
    </Routes>
  );
}
