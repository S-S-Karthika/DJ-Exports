import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MotionConfig } from "motion/react";
import Navbar from "../components/public/Navbar";
import FloatingButtons from "../components/public/FloatingButtons";
import { QuoteProvider } from "../components/public/QuoteModal";
import Footer from "../components/public/Footer";



export default function PublicLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <QuoteProvider>
        <Navbar />
        <main>
          <Outlet />
        </main>
        <FloatingButtons />
        <Footer />
      </QuoteProvider>
    </MotionConfig>
  );
}