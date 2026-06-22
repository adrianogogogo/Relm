import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class StoreJwtGuard extends AuthGuard('store-jwt') {}
