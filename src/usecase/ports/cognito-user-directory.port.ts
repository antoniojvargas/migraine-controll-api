export interface CognitoUserRecord {
  username: string;
  poolId: string;
  email: string;
  identities?: string;
}

export interface CognitoUserDirectoryPort {
  findUserBySub(sub: string): Promise<CognitoUserRecord | null>;
  findUserByEmail(email: string): Promise<CognitoUserRecord | null>;
  tombstoneUser(user: CognitoUserRecord): Promise<void>;
  deleteUser(user: CognitoUserRecord): Promise<void>;
}
