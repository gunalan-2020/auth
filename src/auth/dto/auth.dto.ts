export class ResetPasswordDto {
  token: string;
  newPassword: string;
}

export class ForgotPasswordDto {
  email: string;
}
