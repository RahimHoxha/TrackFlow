import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueStatus } from '../entities/issue.entity';

export class IssueResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty({ enum: IssueStatus })
  status: IssueStatus;

  @ApiProperty()
  projectId: string;

  @ApiPropertyOptional()
  assigneeId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
