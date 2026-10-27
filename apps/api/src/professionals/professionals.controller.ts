import { Body, Controller, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ProfessionalsService } from './professionals.service';
import { Roles } from '../auth/auth.decorators';
import { RolesGuard } from '../auth/roles.guard';
import { Rol } from '@prisma/client';

const storage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.-]/g, '_');
    cb(null, `cred_${Date.now()}_${safe}`);
  },
});

@Controller('professionals')
export class ProfessionalsController {
  constructor(private service: ProfessionalsService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('especialidad') especialidad?: string,
    @Query('comuna') comuna?: string,
  ) {
    return this.service.list({ q, especialidad, comuna });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ESPECIALISTA)
  @Patch('me')
  updateOwn(@Req() req: any, @Body() body: any) {
    return this.service.updateOwn(req.user.id, body);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ESPECIALISTA)
  @Post('me/offerings')
  updateOfferings(@Req() req: any, @Body() body: { items: any[] }) {
    return this.service.updateOfferings(req.user.id, body.items || []);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ESPECIALISTA)
  @Post('me/credential')
  @UseInterceptors(FileInterceptor('archivo', { storage, limits: { fileSize: 5 * 1024 * 1024 } }))
  submitCredential(@Req() req: any, @Body() body: { numeroRegistro: string }, @UploadedFile() file?: Express.Multer.File) {
    return this.service.submitCredential(req.user.id, body.numeroRegistro, file ? `/files/${file.filename}` : undefined);
  }
}
