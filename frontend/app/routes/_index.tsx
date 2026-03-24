import { ProductionCardDemoGrid } from "~/features/production/components/ProductionCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f0f11] px-6 py-10">
      <title>Archief | VIERNULVIER</title>

      <div className="mx-auto w-full max-w-[1320px]">
        <h1 className="mb-2 text-3xl font-semibold tracking-wide text-[#e6dacb]">Homepagina Archief</h1>
        <p className="mb-7 text-[#a99682]">Tijdelijke preview van de ProductionCard componenten.</p>

        <ProductionCardDemoGrid />
      </div>
    </main>
  );
}
