import { ApiProperty } from '@nestjs/swagger';

export class AssignableUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}
