import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IssueStatus } from '../entities/issue.entity';

export class FilterIssuesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ enum: IssueStatus })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string;
}
