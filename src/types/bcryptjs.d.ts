declare module 'bcryptjs' {
  export function hashSync(s: string, salt?: number | string): string;
  export function compareSync(s: string, hash: string): boolean;
  export function genSaltSync(rounds?: number): string;
  export function hash(s: string, salt: number | string, callback?: (err: Error, hash: string) => void): Promise<string>;
  export function compare(s: string, hash: string, callback?: (err: Error, success: boolean) => void): Promise<boolean>;
}
