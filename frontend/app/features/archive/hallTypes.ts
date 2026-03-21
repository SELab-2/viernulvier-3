export interface Hall {
  name: string;
  address: string;
}

export interface HallResponse extends Hall {
  id: number;
}
