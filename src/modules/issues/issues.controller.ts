import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { CreateIssueDto } from './dto/create-issue.dto';
import { FilterIssuesDto } from './dto/filter-issues.dto';
import { IssueResponseDto } from './dto/issue-response.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { Issue } from './entities/issue.entity';
import { IssuesService } from './issues.service';

@ApiTags('Issues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an issue in a project' })
  @ApiResponse({ status: 201, type: IssueResponseDto })
  create(
    @Body() createIssueDto: CreateIssueDto,
    @CurrentUser() user: User,
  ): Promise<Issue> {
    return this.issuesService.create(createIssueDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List issues with optional filters (projectId, status, assigneeId)',
  })
  @ApiResponse({ status: 200, type: [IssueResponseDto] })
  findAll(
    @Query() filter: FilterIssuesDto,
    @CurrentUser() user: User,
  ): Promise<Issue[]> {
    return this.issuesService.findAll(filter, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an issue by id' })
  @ApiResponse({ status: 200, type: IssueResponseDto })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Issue> {
    return this.issuesService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an issue' })
  @ApiResponse({ status: 200, type: IssueResponseDto })
  update(
    @Param('id') id: string,
    @Body() updateIssueDto: UpdateIssueDto,
    @CurrentUser() user: User,
  ): Promise<Issue> {
    return this.issuesService.update(id, updateIssueDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an issue' })
  @ApiResponse({ status: 200 })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.issuesService.remove(id, user).then(() => ({
      message: 'Issue deleted successfully',
    }));
  }
}
