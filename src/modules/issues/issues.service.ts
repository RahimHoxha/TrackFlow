import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from '../projects/projects.service';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { FilterIssuesDto } from './dto/filter-issues.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { Issue } from './entities/issue.entity';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issuesRepository: Repository<Issue>,
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
  ) {}

  async create(createIssueDto: CreateIssueDto, currentUser: User): Promise<Issue> {
    const project = await this.projectsService.findOne(
      createIssueDto.projectId,
      currentUser,
    );
    this.projectsService.assertCanModify(project, currentUser);

    if (createIssueDto.assigneeId) {
      await this.usersService.findById(createIssueDto.assigneeId);
    }

    const issue = this.issuesRepository.create({
      title: createIssueDto.title,
      description: createIssueDto.description ?? null,
      status: createIssueDto.status,
      projectId: createIssueDto.projectId,
      assigneeId: createIssueDto.assigneeId ?? null,
    });

    return this.issuesRepository.save(issue);
  }

  async findAll(
    filter: FilterIssuesDto,
    currentUser: User,
  ): Promise<Issue[]> {
    if (filter.projectId) {
      await this.projectsService.findOne(filter.projectId, currentUser);
    }

    const queryBuilder = this.issuesRepository
      .createQueryBuilder('issue')
      .innerJoin('issue.project', 'project')
      .orderBy('issue.createdAt', 'DESC');

    if (currentUser.role !== UserRole.ADMIN) {
      queryBuilder.andWhere('project.ownerId = :ownerId', {
        ownerId: currentUser.id,
      });
    }

    if (filter.projectId) {
      queryBuilder.andWhere('issue.projectId = :projectId', {
        projectId: filter.projectId,
      });
    }

    if (filter.status) {
      queryBuilder.andWhere('issue.status = :status', {
        status: filter.status,
      });
    }

    if (filter.assigneeId) {
      queryBuilder.andWhere('issue.assigneeId = :assigneeId', {
        assigneeId: filter.assigneeId,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string, currentUser: User): Promise<Issue> {
    const issue = await this.findById(id);
    const project = await this.projectsService.findById(issue.projectId);
    this.projectsService.assertCanAccess(project, currentUser);
    return issue;
  }

  async findById(id: string): Promise<Issue> {
    const issue = await this.issuesRepository.findOne({ where: { id } });

    if (!issue) {
      throw new NotFoundException(`Issue with id "${id}" not found`);
    }

    return issue;
  }

  async update(
    id: string,
    updateIssueDto: UpdateIssueDto,
    currentUser: User,
  ): Promise<Issue> {
    const issue = await this.findById(id);
    const project = await this.projectsService.findById(issue.projectId);
    this.assertCanUpdateIssue(issue, project, currentUser);

    if (updateIssueDto.projectId && updateIssueDto.projectId !== issue.projectId) {
      const newProject = await this.projectsService.findOne(
        updateIssueDto.projectId,
        currentUser,
      );
      this.projectsService.assertCanModify(newProject, currentUser);
    }

    if (updateIssueDto.assigneeId) {
      await this.usersService.findById(updateIssueDto.assigneeId);
    }

    const isAssigneeOnly =
      issue.assigneeId === currentUser.id &&
      project.ownerId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN;

    if (
      isAssigneeOnly &&
      (updateIssueDto.projectId !== undefined ||
        updateIssueDto.assigneeId !== undefined)
    ) {
      throw new ForbiddenException(
        'Assignees can only update title, description, and status',
      );
    }

    if (!isAssigneeOnly) {
      this.projectsService.assertCanModify(project, currentUser);
    }

    Object.assign(issue, updateIssueDto);
    return this.issuesRepository.save(issue);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const issue = await this.findById(id);
    const project = await this.projectsService.findById(issue.projectId);
    this.projectsService.assertCanModify(project, currentUser);
    await this.issuesRepository.remove(issue);
  }

  private assertCanUpdateIssue(
    issue: Issue,
    project: { ownerId: string },
    user: User,
  ): void {
    const isOwner = project.ownerId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;
    const isAssignee = issue.assigneeId === user.id;

    if (!isOwner && !isAdmin && !isAssignee) {
      throw new ForbiddenException('You do not have permission to update this issue');
    }
  }
}
