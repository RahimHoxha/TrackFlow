import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IssueStatus } from '../entities/issue.entity';

export class CreateIssueDto {
  @ApiProperty({ example: 'Fix login validation bug' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiPropertyOptional({ enum: IssueStatus })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string;
}
