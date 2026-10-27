import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Home from "./components/public/Home";
import Settings from "./components/admin/Settings"
import PublicLayout from "./layouts/PublicLayout";
import Certificates from "./pages/admin/Certificates";
import HeroBanners from "./components/admin/HeroBanners";
import AboutEditor from "./pages/admin/AboutEditor";
import About from "./pages/public/About";
import CertificatesPage from "./pages/public/CertificatesPage";
import Contact from "./pages/public/Contact";
import Categories from "./pages/admin/Categories";
import Products from "./pages/admin/Products";
import ProductsPage from "./pages/public/ProductsPage";
import ProductDetail from "./pages/public/ProductDetail";
import Inquiries from "./pages/admin/Inquiries";
import Gallery from "./pages/admin/Gallery";
import GalleryPage from "./pages/public/GalleryPage";
import LogoPage from "./pages/admin/LogoPage";
import Account from "./pages/admin/Account";



const ComingSoon = () => (
  <div className="rounded-xl border border-stone-200 bg-white p-10 text-center text-stone-500">
    This module is coming in the next steps.
  </div>
);

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/certificates" element={<CertificatesPage />} />
                    <Route path="/contact" element={<Contact />} />
                              <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:categorySlug" element={<ProductsPage />} />
          <Route path="/products/:categorySlug/:productSlug" element={<ProductDetail />} />
                    <Route path="/gallery" element={<GalleryPage />} />
          <Route path="*" element={<div className="pt-40 pb-20 text-center text-stone-500">Page coming soon</div>} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="logo" element={<LogoPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="banners" element={<HeroBanners />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="about" element={<AboutEditor />} />
            <Route path="categories" element={<Categories />} />
            <Route path="products" element={<Products />} />
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="account" element={<Account />} />
            <Route path="*" element={<ComingSoon />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}