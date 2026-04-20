export interface Hall {
  id_url: string;
  name: string;
  address?: string;
}

export interface HallCreate {
  name: string;
  address?: string;
}

export interface HallUpdate {
  name?: string;
  address?: string;
}
