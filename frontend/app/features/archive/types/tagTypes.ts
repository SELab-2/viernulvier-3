export interface TagName {
  language: string;
  name: string;
}

export interface Tag {
  id_url: string;
  names: TagName[];
}

export interface TagCreate {
  names: TagName[];
}

export interface TagUpdate {
  names?: TagName[];
}
