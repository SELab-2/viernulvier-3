export interface Hall {
  name: string;
  address: string;
}

export interface HallResponse extends Hall {
  id: number;
}

export interface HallUpdate {
  name?: string;
  address?: string;
}
