import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly config: NestConfigService) {}

  get port(): number {
    return Number(this.config.get<number>('PORT', 3000));
  }

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV', 'development');
  }

  get databaseHost(): string {
    return this.config.get<string>('DATABASE_HOST', 'localhost');
  }

  get databasePort(): number {
    return Number(this.config.get<number>('DATABASE_PORT', 5432));
  }

  get databaseUser(): string {
    return this.config.get<string>('DATABASE_USER', 'postgres');
  }

  get databasePassword(): string {
    return this.config.get<string>('DATABASE_PASSWORD', 'postgres');
  }

  get databaseName(): string {
    return this.config.get<string>('DATABASE_NAME', 'chatple');
  }

  get jwtSecret(): string {
    return this.config.get<string>('JWT_SECRET', 'your_jwt_secret_here');
  }

  get jwtExpiresIn(): string | number {
    return this.config.get<string>('JWT_EXPIRES_IN', '7d');
  }

  get corsOrigin(): string {
    return this.config.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  }
}
