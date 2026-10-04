import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  RoleEntity,
  DistrictEntity,
  MahallaEntity,
  UserEntity,
  CitizenEntity,
  SurveyEntity,
  EmploymentHistoryEntity,
} from './entities';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [
          RoleEntity,
          DistrictEntity,
          MahallaEntity,
          UserEntity,
          CitizenEntity,
          SurveyEntity,
          EmploymentHistoryEntity,
        ],
        autoLoadEntities: true,
        synchronize: true, // MVP 1-bosqichda jadvallarni avtomatik shakllantirish
        logging: configService.get<boolean>('database.logging'),
      }),
    }),
    TypeOrmModule.forFeature([
      RoleEntity,
      DistrictEntity,
      MahallaEntity,
      UserEntity,
      CitizenEntity,
      SurveyEntity,
      EmploymentHistoryEntity,
    ]),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule, SeedService],
})
export class DatabaseModule {}
