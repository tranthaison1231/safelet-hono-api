interface Error {
  status?: number;
}

declare namespace Hono {
  export interface Context {
    user: any;
  }
}
