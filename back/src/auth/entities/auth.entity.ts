export class AuthEntity {
  token!: string;
  user!: any;
  constructor(partial: Partial<AuthEntity>) {
    Object.assign(this, partial);
  }
}
