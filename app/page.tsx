import HomeHero from "@/features/storefront/home/components/home-hero";
import LatestProductsSection from "@/features/storefront/home/components/latest-products-section";
import { getHomePageData } from "@/features/storefront/home/server/get-home-page-data";

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <>
      <HomeHero />
      <LatestProductsSection data={data} />
    </>
  );
}
