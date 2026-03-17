export interface IResource {
  id: number;
  someData: string;
}

export interface ICreateResource {
  someData: string;
}
export interface IUpdateResource {
  someData?: string;
}
