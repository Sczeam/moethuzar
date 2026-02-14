import HomeHero from "@/features/storefront/home/components/home-hero";
import LatestProductsSection from "@/features/storefront/home/components/latest-products-section";
import { getHomePageData } from "@/features/storefront/home/server/get-home-page-data";

type HomePageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

function parsePage(value?: string): number {
  if (!value) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const data = await getHomePageData({ page, pageSize: 6 });

  return (
    <>
      <HomeHero />
      <LatestProductsSection data={data} />
    </>
  );
}
