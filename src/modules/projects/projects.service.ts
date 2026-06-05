import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    owner: User,
  ): Promise<Project> {
    const project = this.projectsRepository.create({
      ...createProjectDto,
      ownerId: owner.id,
    });

    return this.projectsRepository.save(project);
  }

  async findAll(currentUser: User): Promise<Project[]> {
    if (currentUser.role === UserRole.ADMIN) {
      return this.projectsRepository.find({
        order: { createdAt: 'DESC' },
      });
    }

    return this.projectsRepository.find({
      where: { ownerId: currentUser.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, currentUser: User): Promise<Project> {
    const project = await this.findById(id);
    this.assertCanAccess(project, currentUser);
    return project;
  }

  async findById(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    currentUser: User,
  ): Promise<Project> {
    const project = await this.findById(id);
    this.assertCanModify(project, currentUser);

    Object.assign(project, updateProjectDto);
    return this.projectsRepository.save(project);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const project = await this.findById(id);
    this.assertCanModify(project, currentUser);
    await this.projectsRepository.remove(project);
  }

  assertCanAccess(project: Project, user: User): void {
    if (project.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  assertCanModify(project: Project, user: User): void {
    if (project.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only the project owner or an admin can modify this project',
      );
    }
  }
}
