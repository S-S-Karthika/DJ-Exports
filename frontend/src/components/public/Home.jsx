import HeroSlider from "../../components/public/HeroSlider";
import FeatureStrip from "../../components/public/FeatureStrip";
import AboutSection from "../../components/public/AboutSection";
import CategoryShowcase from "../../components/public/CategoryShowcase";
import FeaturedProducts from "../../components/public/FeaturedProducts";

export default function Home() {
  return (
    <>
      <HeroSlider />
      <FeatureStrip />
      <AboutSection />
      <CategoryShowcase />
      <FeaturedProducts />
    </>
  );
}