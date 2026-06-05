import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SafeUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthResult {
  accessToken: string;
  user: SafeUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const user = await this.usersService.create(registerDto);
    const accessToken = await this.generateToken(user);
    return { accessToken, user };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.generateToken(
      this.usersService.toSafeUser(user),
    );

    return {
      accessToken,
      user: this.usersService.toSafeUser(user),
    };
  }

  private async generateToken(user: SafeUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }
}
