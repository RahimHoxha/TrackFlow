import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../issues/entities/issue.entity';
import { IssuesService } from '../issues/issues.service';
import { ProjectsService } from '../projects/projects.service';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    private readonly issuesService: IssuesService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(
    issueId: string,
    createCommentDto: CreateCommentDto,
    currentUser: User,
  ): Promise<Comment> {
    const issue = await this.assertCanAccessIssue(issueId, currentUser);

    const comment = this.commentsRepository.create({
      content: createCommentDto.content,
      issueId: issue.id,
      authorId: currentUser.id,
    });

    const saved = await this.commentsRepository.save(comment);
    return this.findById(saved.id);
  }

  async findByIssue(issueId: string, currentUser: User): Promise<Comment[]> {
    await this.assertCanAccessIssue(issueId, currentUser);

    return this.commentsRepository.find({
      where: { issueId },
      relations: ['author'],
      select: {
        id: true,
        content: true,
        issueId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      order: { createdAt: 'ASC' },
    });
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const comment = await this.findById(id);
    const issue = await this.issuesService.findById(comment.issueId);
    const project = await this.projectsService.findById(issue.projectId);

    const isAuthor = comment.authorId === currentUser.id;
    const isProjectOwner = project.ownerId === currentUser.id;
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!isAuthor && !isProjectOwner && !isAdmin) {
      throw new ForbiddenException(
        'Only the comment author, project owner, or an admin can delete this comment',
      );
    }

    await this.commentsRepository.remove(comment);
  }

  private async findById(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['author'],
      select: {
        id: true,
        content: true,
        issueId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id "${id}" not found`);
    }

    return comment;
  }

  private async assertCanAccessIssue(
    issueId: string,
    user: User,
  ): Promise<Issue> {
    const issue = await this.issuesService.findById(issueId);
    const project = await this.projectsService.findById(issue.projectId);

    const isProjectOwner = project.ownerId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;
    const isAssignee = issue.assigneeId === user.id;

    if (!isProjectOwner && !isAdmin && !isAssignee) {
      throw new ForbiddenException(
        'You do not have access to comment on this issue',
      );
    }

    return issue;
  }
}
