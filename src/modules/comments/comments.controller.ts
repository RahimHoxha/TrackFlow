import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CommentsService } from './comments.service';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('issues/:issueId/comments')
  @ApiOperation({ summary: 'Add a comment on an issue' })
  @ApiResponse({ status: 201, type: CommentResponseDto })
  create(
    @Param('issueId') issueId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: User,
  ): Promise<Comment> {
    return this.commentsService.create(issueId, createCommentDto, user);
  }

  @Get('issues/:issueId/comments')
  @ApiOperation({ summary: 'List comments on an issue (oldest first)' })
  @ApiResponse({ status: 200, type: [CommentResponseDto] })
  findByIssue(
    @Param('issueId') issueId: string,
    @CurrentUser() user: User,
  ): Promise<Comment[]> {
    return this.commentsService.findByIssue(issueId, user);
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200 })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.commentsService.remove(id, user).then(() => ({
      message: 'Comment deleted successfully',
    }));
  }
}
