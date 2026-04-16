import {
  getFromArchive,
} from "~/shared/services/sharedService";

const ENDPOINT = "/artists";

interface ArtistResponse {
  en: string[];
  nl: string[];
}

export async function getArtists(lang_code: "en" | "nl"): Promise<string[]> {
  const data = await getFromArchive<ArtistResponse>(ENDPOINT);
  return data[lang_code];
}
