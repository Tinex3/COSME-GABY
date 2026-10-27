import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { AvailabilityService } from './availability.service';
import { Roles } from '../auth/auth.decorators';
import { RolesGuard } from '../auth/roles.guard';
import { Rol } from '@prisma/client';

class RuleDto {
  @IsIn([0, 1, 2, 3, 4, 5, 6])
  diaSemana: number;

  @Matches(/^\d{2}:\d{2}$/)
  horaInicio: string;

  @Matches(/^\d{2}:\d{2}$/)
  horaFin: string;
}

class ReplaceRulesDto {
  rules: RuleDto[];
}

class ExceptionDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha: string;

  @IsIn(['BLOQUEO', 'HORARIO_EXTRA'])
  tipo: 'BLOQUEO' | 'HORARIO_EXTRA';

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  horaInicio?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  horaFin?: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Rol.ESPECIALISTA)
@Controller('availability')
export class AvailabilityController {
  constructor(private service: AvailabilityService) {}

  @Get('rules')
  getRules(@Req() req: any) {
    return this.service.getRules(req.user.id);
  }

  @Patch('rules')
  replaceRules(@Req() req: any, @Body() dto: ReplaceRulesDto) {
    return this.service.replaceRules(req.user.id, dto.rules || []);
  }

  @Get('exceptions')
  getExceptions(@Req() req: any) {
    return this.service.getExceptions(req.user.id);
  }

  @Post('exceptions')
  addException(@Req() req: any, @Body() dto: ExceptionDto) {
    return this.service.addException(req.user.id, dto);
  }

  @Delete('exceptions/:id')
  removeException(@Req() req: any, @Param('id') id: string) {
    return this.service.removeException(req.user.id, id);
  }
}
