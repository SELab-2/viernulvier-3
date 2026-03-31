export interface TagName {
  language: string;
  name: string;
}

export interface Tag {
  id: string;
  names: TagName[];
}

export interface TagCreate {
  names: TagName[];
}

export interface TagUpdate {
  names?: TagName[];
}
