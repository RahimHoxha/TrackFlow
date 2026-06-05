import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, UserRole } from './entities/user.entity';

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.saltRounds,
    );

    const user = this.usersRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      name: createUserDto.name,
      role: UserRole.USER,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.toSafeUser(savedUser);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
    return users.map((user) => this.toSafeUser(user));
  }

  async findAssignableUsers(): Promise<
    Pick<SafeUser, 'id' | 'name' | 'email'>[]
  > {
    const users = await this.usersRepository.find({
      select: ['id', 'name', 'email'],
      order: { name: 'ASC' },
    });
    return users;
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByIdSafe(id: string, currentUser: User): Promise<SafeUser> {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }

    const user = await this.findById(id);
    return this.toSafeUser(user);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<SafeUser> {
    const user = await this.findById(userId);
    return this.applyUserUpdates(user, updateProfileDto);
  }

  async updateByAdmin(
    id: string,
    adminUpdateUserDto: AdminUpdateUserDto,
  ): Promise<SafeUser> {
    const user = await this.findById(id);
    return this.applyUserUpdates(user, adminUpdateUserDto);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }

    if (currentUser.id === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  toSafeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private async applyUserUpdates(
    user: User,
    updates: UpdateProfileDto | AdminUpdateUserDto,
  ): Promise<SafeUser> {
    if (updates.email && updates.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updates.email },
      });

      if (existingUser) {
        throw new ConflictException('Email is already registered');
      }
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, this.saltRounds);
    }

    Object.assign(user, updates);
    const savedUser = await this.usersRepository.save(user);
    return this.toSafeUser(savedUser);
  }
}
