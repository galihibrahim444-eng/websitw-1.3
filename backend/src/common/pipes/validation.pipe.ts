import { ValidationPipe } from '@nestjs/common';

// Configured ValidationPipe to be used by the application when registered
export const AppValidationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});

export default AppValidationPipe;
