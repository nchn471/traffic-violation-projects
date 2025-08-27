export interface Officer {
  id: string;
  name: string;
  username: string;
  role: string;
  created_at: string;
}


export interface OfficerCreate {
  name?: string;
  username: string;
  password: string;
  role: string;
}

export interface OfficerUpdate {
  name?: string;
  username?: string;
  password?: string;
  role?: string;
}
