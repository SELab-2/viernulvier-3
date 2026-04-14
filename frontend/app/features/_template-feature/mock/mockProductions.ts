import type { ProductionWithEvents } from "~/features/archive/types/productionTypes";

export const mockProductions: ProductionWithEvents[] = [
  {
    id: "VV-2024-10-OPEN-ARCHIVE",
    performer_type: "group",
    attendance_mode: "offline",
    media_gallery_id: 1,
    created_at: "2024-10-01T10:00:00Z",
    updated_at: "2024-10-01T10:00:00Z",
    production_infos: [
      {
        prod_id: "VV-2024-10-OPEN-ARCHIVE",
        language: "nl",
        title: undefined,
        supertitle: "Ephemera",
        artist: undefined,
        tagline:
          "Een avondvullende opening van de herfstselectie, opgebouwd rond dossiers, affiches en korte performances die de stadsarchieven activeren. Een avondvullende opening van de herfstselectie, opgebouwd rond dossiers, affiches en korte performances die de stadsarchieven activeren.Een avondvullende opening van de herfstselectie, opgebouwd rond dossiers, affiches en korte performances die de stadsarchieven activeren.Een avondvullende opening van de herfstselectie, opgebouwd rond dossiers, affiches en korte performances die de stadsarchieven activeren.Een avondvullende opening van de herfstselectie, opgebouwd rond dossiers, affiches en korte performances die de stadsarchieven activeren.",
      },
    ],
    events: [
      {
        id: "1",
        production_id: "VV-2024-10-OPEN-ARCHIVE",
        hall_id: "1",
        starts_at: "2024-10-01T10:00:00Z",
        price_ids: [],
      },
      {
        id: "2",
        production_id: "VV-2024-10-OPEN-ARCHIVE",
        hall_id: "1",
        starts_at: "2024-10-02T10:00:00Z",
        price_ids: [],
      },
    ],
    tags: [
      { id: "1", names: [{ language: "nl", name: "Archief" }] },
      { id: "2", names: [{ language: "nl", name: "Open Huis" }] },
      { id: "3", names: [{ language: "nl", name: "Performance" }] },
      { id: "4", names: [{ language: "nl", name: "Gent" }] },
    ],
    image_url:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "VV-2024-10-M1",
    performer_type: "ensemble",
    attendance_mode: "hybrid",
    media_gallery_id: 2,
    created_at: "2024-10-02T10:00:00Z",
    updated_at: "2024-10-02T10:00:00Z",
    production_infos: [
      {
        prod_id: "VV-2024-10-M1",
        language: "nl",
        title: "Film Hoge Dichtheid #2",
        supertitle: "Theater",
        tagline:
          "Een representatief voorbeelditem voor de mockup, dat de stabiliteit van de lay-out aantoont bij variërende volumes.",
      },
    ],
    events: [
      {
        id: "1",
        production_id: "VV-2024-10-OPEN-ARCHIVE",
        hall_id: "1",
        // starts_at: "2023-10-01T10:00:00Z",
        price_ids: [],
      },
    ],
    tags: [
      { id: "5", names: [{ language: "nl", name: "Underground" }] },
      { id: "6", names: [{ language: "nl", name: "Mockup" }] },
    ],
    image_url:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "VV-2024-10-M2",
    performer_type: "duo",
    attendance_mode: "online",
    media_gallery_id: 3,
    created_at: "2024-10-03T10:00:00Z",
    updated_at: "2024-10-03T10:00:00Z",
    production_infos: [
      {
        prod_id: "VV-2024-10-M2",
        language: "nl",
        title: "Ephemera Hoge Dichtheid #3",
        supertitle: "Film",
        tagline:
          "Een representatief voorbeelditem voor de mockup, dat de stabiliteit van de lay-out aantoont bij variërende volumes.",
      },
    ],
    events: [
      {
        id: "1",
        production_id: "VV-2024-10-M2",
        hall_id: "1",
        starts_at: "2023-10-01T10:00:00Z",
        price_ids: [],
      },
    ],
    tags: [
      { id: "7", names: [{ language: "nl", name: "Geschiedenis" }] },
      { id: "8", names: [{ language: "nl", name: "Mockup" }] },
    ],
    image_url:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1600&auto=format&fit=crop",
  },
];
