import { ApiProperty } from '@nestjs/swagger';

export class CommentAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  issueId: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ type: CommentAuthorDto })
  author: CommentAuthorDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
