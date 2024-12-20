import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Role } from './enums/role.enum';

describe('AuthController', () => {
  let authService: AuthService;
  let authController: AuthController;

  const jwtToken = 'jwtToken';

  const mockAuthService = {
    signUp: jest.fn().mockResolvedValueOnce(jwtToken),
    login: jest.fn().mockResolvedValueOnce(jwtToken),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authController = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('signUp', () => {
    it('should register a new user', async () => {
      const signUpDto = {
        name: 'Test',
        email: 'test@test.com',
        password: '1234567',
        role: [Role.User],
      };

      const result = await authController.signUp(signUpDto);
      expect(authService.signUp).toHaveBeenCalled();
      expect(result).toEqual(jwtToken);
    });
  });
  describe('login', () => {
    it('should login user', async () => {
      const loginDto = {
        email: 'test@test.com',
        password: '1234567',
      };

      const result = await authController.login(loginDto);
      expect(authService.login).toHaveBeenCalled();
      expect(result).toEqual(jwtToken);
    });
  });
});
