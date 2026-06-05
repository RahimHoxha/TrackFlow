import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesModule } from '../issues/issues.module';
import { ProjectsModule } from '../projects/projects.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    IssuesModule,
    ProjectsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
