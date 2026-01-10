import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export type Role = 'watcher' | 'admin' | 'main_admin';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);