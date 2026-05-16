export interface HallName {
  language: string;
  name: string;
}

export interface Hall {
  id_url: string;
  names: HallName[];
  address?: string;
}

export interface HallCreate {
  names: HallName[];
  address?: string;
}

export interface HallUpdate {
  names?: HallName[];
  address?: string;
}
