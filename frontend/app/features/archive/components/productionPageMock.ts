import type { Production } from "~/features/archive/types/productionTypes";
import type { Event } from "~/features/archive/types/eventTypes";

export interface ArchiveSchemaItem {
  starts_at?: string;
  hall_name?: string;
}

interface ProductionPageMockSource {
  production: Production;
  starts_at?: string;
  hall_name?: string;
  tag_names?: string[];
  image_url?: string;
  image_urls?: string[];
  archive_schema?: ArchiveSchemaItem[];
  event_details?: Event[];
  id_url?: string;
}

const productionPageMockSource: ProductionPageMockSource[] = [
  {
    production: {
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
          supertitle: "Ephemera",
          title: "Super cool production title",
          tagline:
            "Een opening rond dossiers, affiches en korte performances uit het archief.",
        },
      ],
      events: ["EVT-OPEN-1", "EVT-OPEN-2", "EVT-OPEN-3"],
      events_objects: [
        {
          id: "EVT-OPEN-1",
          production_id: "VV-2024-10-OPEN-ARCHIVE",
          hall_id: "HALL-BALZAAL",
          hall: { name: "Balzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
          starts_at: "2024-10-03T19:30:00+02:00",
          ends_at: "2024-10-03T22:00:00+02:00",
          order_url: "https://tickets.viernulvier.gent/evt-open-1",
          price_ids: ["P-OPEN-1", "P-OPEN-2"],
          price_objects: [
            { id: "P-OPEN-1", amount: 18.0 },
            { id: "P-OPEN-2", amount: 24.0 },
          ],
        },
        {
          id: "EVT-OPEN-2",
          production_id: "VV-2024-10-OPEN-ARCHIVE",
          hall_id: "HALL-DOMZAAL",
          hall: { name: "Domzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
          starts_at: "2024-10-04T20:00:00+02:00",
          ends_at: "2024-10-04T22:15:00+02:00",
          order_url: "https://tickets.viernulvier.gent/evt-open-2",
          price_ids: ["P-OPEN-3"],
          price_objects: [{ id: "P-OPEN-3", amount: 16.5 }],
        },
        {
          id: "EVT-OPEN-3",
          production_id: "VV-2024-10-OPEN-ARCHIVE",
          hall_id: "HALL-CLUBZAAL",
          hall: { name: "Clubzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
          starts_at: "2024-10-06T17:00:00+02:00",
          ends_at: "2024-10-06T19:00:00+02:00",
          order_url: "https://tickets.viernulvier.gent/evt-open-3",
          price_ids: ["P-OPEN-4"],
          price_objects: [{ id: "P-OPEN-4", amount: 12.0 }],
        },
      ],
      tags: [
        { id: "1", names: [{ language: "nl", name: "Archief" }] },
        { id: "2", names: [{ language: "nl", name: "Open Huis" }] },
        { id: "3", names: [{ language: "nl", name: "Performance" }] },
      ],
    },
    starts_at: "3 oktober 2024",
    hall_name: "Balzaal",
    image_url:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop",
    image_urls: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1464375117522-1311dd7d7f94?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?q=80&w=1600&auto=format&fit=crop",

    ],
    archive_schema: [
      { starts_at: "3 oktober 2024 - 19:30", hall_name: "Balzaal" },
      { starts_at: "4 oktober 2024 - 20:00", hall_name: "Domzaal" },
      { starts_at: "6 oktober 2024 - 17:00", hall_name: "Clubzaal" },
    ],
    event_details: [
      {
        id: "EVT-OPEN-1",
        production_id: "VV-2024-10-OPEN-ARCHIVE",
        hall_id: "HALL-BALZAAL",
        hall: { name: "Balzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
        starts_at: "2024-10-03T19:30:00+02:00",
        ends_at: "2024-10-03T22:00:00+02:00",
        order_url: "https://tickets.viernulvier.gent/evt-open-1",
        price_ids: ["P-OPEN-1", "P-OPEN-2"],
      },
      {
        id: "EVT-OPEN-2",
        production_id: "VV-2024-10-OPEN-ARCHIVE",
        hall_id: "HALL-DOMZAAL",
        hall: { name: "Domzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
        starts_at: "2024-10-04T20:00:00+02:00",
        ends_at: "2024-10-04T22:15:00+02:00",
        order_url: "https://tickets.viernulvier.gent/evt-open-2",
        price_ids: ["P-OPEN-3"],
      },
      {
        id: "EVT-OPEN-3",
        production_id: "VV-2024-10-OPEN-ARCHIVE",
        hall_id: "HALL-CLUBZAAL",
        hall: { name: "Clubzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
        starts_at: "2024-10-06T17:00:00+02:00",
        ends_at: "2024-10-06T19:00:00+02:00",
        order_url: "https://tickets.viernulvier.gent/evt-open-3",
        price_ids: ["P-OPEN-4"],
      },
    ],
  },
  {
    production: {
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
          tagline: "Representatief voorbeelditem voor de detailpagina.",
        },
      ],
      events: ["EVT-M1-1", "EVT-M1-2"],
      events_objects: [
        {
          id: "EVT-M1-1",
          production_id: "VV-2024-10-M1",
          hall_id: "HALL-DOMZAAL",
          hall: { name: "Domzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
          starts_at: "2024-10-05T19:00:00+02:00",
          ends_at: "2024-10-05T20:45:00+02:00",
          order_url: "https://tickets.viernulvier.gent/evt-m1-1",
          price_ids: ["P-M1-1"],
          price_objects: [{ id: "P-M1-1", amount: 22.0 }],
        },
        {
          id: "EVT-M1-2",
          production_id: "VV-2024-10-M1",
          hall_id: "HALL-BALZAAL",
          hall: { name: "Balzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
          starts_at: "2024-10-07T21:00:00+02:00",
          ends_at: "2024-10-07T22:30:00+02:00",
          order_url: "https://tickets.viernulvier.gent/evt-m1-2",
          price_ids: ["P-M1-2", "P-M1-3"],
          price_objects: [
            { id: "P-M1-2", amount: 19.0 },
            { id: "P-M1-3", amount: 27.5 },
          ],
        },
      ],
      tags: [
        { id: "5", names: [{ language: "nl", name: "Underground" }] },
        { id: "6", names: [{ language: "nl", name: "Mockup" }] },
      ],
    },
    starts_at: "5 oktober 2024",
    hall_name: "Domzaal",
    image_url:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1600&auto=format&fit=crop",
    image_urls: [
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521336575822-6da63fb45455?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1600&auto=format&fit=crop",
    ],
    archive_schema: [
      { starts_at: "5 oktober 2024 - 19:00", hall_name: "Domzaal" },
      { starts_at: "7 oktober 2024 - 21:00", hall_name: "Balzaal" },
    ],
    event_details: [
      {
        id: "EVT-M1-1",
        production_id: "VV-2024-10-M1",
        hall_id: "HALL-DOMZAAL",
        hall: { name: "Domzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
        starts_at: "2024-10-05T19:00:00+02:00",
        ends_at: "2024-10-05T20:45:00+02:00",
        order_url: "https://tickets.viernulvier.gent/evt-m1-1",
        price_ids: ["P-M1-1"],
      },
      {
        id: "EVT-M1-2",
        production_id: "VV-2024-10-M1",
        hall_id: "HALL-BALZAAL",
        hall: { name: "Balzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
        starts_at: "2024-10-07T21:00:00+02:00",
        ends_at: "2024-10-07T22:30:00+02:00",
        order_url: "https://tickets.viernulvier.gent/evt-m1-2",
        price_ids: ["P-M1-2", "P-M1-3"],
      },
    ],
  },
  {
    production: {
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
          tagline: "Representatief voorbeelditem voor de detailpagina.",
        },
      ],
      events: ["EVT-M2-1", "EVT-M2-2", "EVT-M2-3"],
      events_objects: [
        {
          id: "EVT-M2-1",
          production_id: "VV-2024-10-M2",
          hall_id: "HALL-FILMZAAL",
          hall: { name: "Filmzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
          starts_at: "2024-10-21T18:30:00+02:00",
          ends_at: "2024-10-21T20:00:00+02:00",
          order_url: "https://tickets.viernulvier.gent/evt-m2-1",
          price_ids: ["P-M2-1"],
          price_objects: [{ id: "P-M2-1", amount: 14.0 }],
        },
        {
          id: "EVT-M2-2",
          production_id: "VV-2024-10-M2",
          hall_id: "HALL-FILMZAAL",
          hall: { name: "Filmzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
          starts_at: "2024-10-22T20:15:00+02:00",
          ends_at: "2024-10-22T22:00:00+02:00",
          order_url: "https://tickets.viernulvier.gent/evt-m2-2",
          price_ids: ["P-M2-2", "P-M2-3"],
          price_objects: [
            { id: "P-M2-2", amount: 17.5 },
            { id: "P-M2-3", amount: 25.0 },
          ],
        },
        {
          id: "EVT-M2-3",
          production_id: "VV-2024-10-M2",
          hall_id: "HALL-ZWARTE-ZAAL",
          hall: { name: "Zwarte Zaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
          starts_at: "2024-10-24T16:00:00+02:00",
          ends_at: "2024-10-24T17:45:00+02:00",
          order_url: "https://tickets.viernulvier.gent/evt-m2-3",
          price_ids: ["P-M2-4"],
          price_objects: [{ id: "P-M2-4", amount: 11.0 }],
        },
      ],
      tags: [
        { id: "7", names: [{ language: "nl", name: "Geschiedenis" }] },
        { id: "8", names: [{ language: "nl", name: "Mockup" }] },
      ],
    },
    starts_at: "21 oktober 2024",
    hall_name: "Filmzaal",
    image_url:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1600&auto=format&fit=crop",
    image_urls: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1600&auto=format&fit=crop",
    ],
    archive_schema: [
      { starts_at: "21 oktober 2024 - 18:30", hall_name: "Filmzaal" },
      { starts_at: "22 oktober 2024 - 20:15", hall_name: "Filmzaal" },
      { starts_at: "24 oktober 2024 - 16:00", hall_name: "Zwarte Zaal" },
    ],
    event_details: [
      {
        id: "EVT-M2-1",
        production_id: "VV-2024-10-M2",
        hall_id: "HALL-FILMZAAL",
        hall: { name: "Filmzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
        starts_at: "2024-10-21T18:30:00+02:00",
        ends_at: "2024-10-21T20:00:00+02:00",
        order_url: "https://tickets.viernulvier.gent/evt-m2-1",
        price_ids: ["P-M2-1"],
      },
      {
        id: "EVT-M2-2",
        production_id: "VV-2024-10-M2",
        hall_id: "HALL-FILMZAAL",
        hall: { name: "Filmzaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
        starts_at: "2024-10-22T20:15:00+02:00",
        ends_at: "2024-10-22T22:00:00+02:00",
        order_url: "https://tickets.viernulvier.gent/evt-m2-2",
        price_ids: ["P-M2-2", "P-M2-3"],
      },
      {
        id: "EVT-M2-3",
        production_id: "VV-2024-10-M2",
        hall_id: "HALL-ZWARTE-ZAAL",
        hall: { name: "Zwarte Zaal", address: "Sint-Pietersnieuwstraat 23, Gent" },
        starts_at: "2024-10-24T16:00:00+02:00",
        ends_at: "2024-10-24T17:45:00+02:00",
        order_url: "https://tickets.viernulvier.gent/evt-m2-3",
        price_ids: ["P-M2-4"],
      },
    ],
  },
];

export const mockProductionPageData: Production[] =
  productionPageMockSource.map((source) => source.production);

export function getMockProductionPageById(
  productionId: string
): Production | undefined {
  const sourceMatch = productionPageMockSource.find(
    (source) =>
      source.id_url === productionId || source.production.id === productionId
  );

  return sourceMatch?.production;
}
