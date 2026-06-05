import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: User,
  ): Promise<Project> {
    return this.projectsService.create(createProjectDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List projects accessible to the current user' })
  @ApiResponse({ status: 200, type: [ProjectResponseDto] })
  findAll(@CurrentUser() user: User): Promise<Project[]> {
    return this.projectsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by id' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Project> {
    return this.projectsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: User,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200 })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.projectsService.remove(id, user).then(() => ({
      message: 'Project deleted successfully',
    }));
  }
}
