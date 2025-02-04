export interface JwtPayload {
  sub: number; // user ID (you can use any unique identifier here)
  email: string; // user email
}
