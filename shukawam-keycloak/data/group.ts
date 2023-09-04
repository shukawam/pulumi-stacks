export interface Group {
    name: string;
    users?: [
      {
        username: string;
        email: string;
      }
    ];
  }
  