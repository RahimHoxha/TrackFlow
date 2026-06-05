import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { Issue } from './entities/issue.entity';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue]),
    ProjectsModule,
    UsersModule,
  ],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}
