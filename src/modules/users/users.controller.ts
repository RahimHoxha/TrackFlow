import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AssignableUserDto } from './dto/assignable-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User, UserRole } from './entities/user.entity';
import type { SafeUser } from './users.service';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  getProfile(@CurrentUser() user: User): SafeUser {
    return this.usersService.toSafeUser(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update your own profile (cannot change role)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<SafeUser> {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get('assignable')
  @ApiOperation({
    summary: 'List users for assignee dropdown (all authenticated users)',
  })
  @ApiResponse({ status: 200, type: [AssignableUserDto] })
  findAssignable(): Promise<AssignableUserDto[]> {
    return this.usersService.findAssignableUsers();
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  findAll(): Promise<SafeUser[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id (admin or own profile)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<SafeUser> {
    return this.usersService.findByIdSafe(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: update any user including role' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateByAdmin(
    @Param('id') id: string,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
  ): Promise<SafeUser> {
    return this.usersService.updateByAdmin(id, adminUpdateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: delete a user' })
  @ApiResponse({ status: 200 })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.usersService.remove(id, user).then(() => ({
      message: 'User deleted successfully',
    }));
  }
}
