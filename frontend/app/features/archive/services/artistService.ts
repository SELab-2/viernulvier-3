import { getFromArchive } from "~/shared/services/sharedService";
import type { ArtistResponse } from "../types/artistTypes";

const ENDPOINT = "/artists";

export async function getArtists(lang_code: "en" | "nl"): Promise<string[]> {
  const data = await getFromArchive<ArtistResponse>(ENDPOINT);
  return data[lang_code];
}
