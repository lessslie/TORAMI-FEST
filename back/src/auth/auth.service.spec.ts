/**
 * ===========================================
 * TEST UNITARIO PARA AuthService
 * ===========================================
 *
 * CONCEPTOS CLAVE:
 *
 * 1. UNIT TEST: Testea UNA sola unidad de código (en este caso AuthService)
 *    - NO conecta a la base de datos real
 *    - NO envía emails reales
 *    - Todo lo externo se "mockea" (simula)
 *
 * 2. MOCKS: Son objetos falsos que simulan el comportamiento de dependencias
 *    - mockPrismaService simula la base de datos
 *    - mockJwtService simula la generación de tokens
 *    - mockMailService simula el envío de emails
 *
 * 3. ESTRUCTURA DE UN TEST:
 *    - describe('NombreDelServicio') → agrupa todos los tests del servicio
 *    - describe('nombreDelMetodo') → agrupa tests de un método específico
 *    - it('should do something') → un test individual
 *
 * 4. PATRÓN AAA (Arrange-Act-Assert):
 *    - Arrange: Preparar los datos y mocks
 *    - Act: Ejecutar el método que queremos testear
 *    - Assert: Verificar que el resultado es el esperado
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mockeamos bcrypt para controlar su comportamiento en los tests
jest.mock('bcryptjs');

describe('AuthService', () => {
  // Variables que usaremos en todos los tests
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let mailService: MailService;

  /**
   * MOCK DE UsersService
   * ---------------------
   * Simulamos los métodos que AuthService usa de UsersService.
   * jest.fn() crea una función "espia" que podemos controlar.
   */
  const mockUsersService = {
    findByEmail: jest.fn(),  // Simula buscar usuario por email
    create: jest.fn(),       // Simula crear usuario
  };

  /**
   * MOCK DE JwtService
   * ------------------
   * Simulamos la generación de tokens JWT.
   */
  const mockJwtService = {
    sign: jest.fn(),  // Simula firmar un token
  };

  /**
   * MOCK DE MailService
   * -------------------
   * Simulamos el envío de emails (no queremos enviar emails reales en tests).
   */
  const mockMailService = {
    sendWelcomeEmail: jest.fn(),  // Simula enviar email de bienvenida
  };

  /**
   * beforeEach: Se ejecuta ANTES de cada test
   * -----------------------------------------
   * Aquí creamos una instancia "limpia" del servicio para cada test.
   * Esto asegura que los tests no se afecten entre sí.
   */
  beforeEach(async () => {
    // Creamos un módulo de testing de NestJS
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,  // El servicio real que queremos testear
        // Reemplazamos las dependencias reales por nuestros mocks
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    // Obtenemos las instancias del módulo
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
  });

  /**
   * afterEach: Se ejecuta DESPUÉS de cada test
   * ------------------------------------------
   * Limpiamos todos los mocks para que no afecten al siguiente test.
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================
  // TEST BÁSICO: ¿El servicio existe?
  // =========================================
  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  // =========================================
  // TESTS PARA EL MÉTODO: register()
  // =========================================
  describe('register', () => {
    // Datos de prueba que usaremos
    const registerDto = {
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
    };

    const mockCreatedUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@test.com',
      password: 'hashedPassword',
      role: 'USER',
    };

    /**
     * TEST 1: Registro exitoso
     * ------------------------
     * Verificamos que cuando todo va bien:
     * - Se crea el usuario
     * - Se envía email de bienvenida
     * - Se genera un token
     * - Se retorna usuario (sin password) y token
     */
    it('should register a new user successfully', async () => {
      // ARRANGE (Preparar)
      // Simulamos que NO existe un usuario con ese email
      mockUsersService.findByEmail.mockResolvedValue(null);
      // Simulamos que bcrypt.hash devuelve un password hasheado
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      // Simulamos que se crea el usuario exitosamente
      mockUsersService.create.mockResolvedValue(mockCreatedUser);
      // Simulamos que se genera un token
      mockJwtService.sign.mockReturnValue('fake-jwt-token');
      // Simulamos que el email se envía (resuelve una promesa vacía)
      mockMailService.sendWelcomeEmail.mockResolvedValue(undefined);

      // ACT (Actuar)
      const result = await authService.register(registerDto);

      // ASSERT (Verificar)
      // 1. Verificamos que se buscó si el email ya existía
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@test.com');
      // 2. Verificamos que se hasheó el password
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      // 3. Verificamos que se creó el usuario con el password hasheado
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: 'hashedPassword',
      });
      // 4. Verificamos que se intentó enviar el email de bienvenida
      expect(mockMailService.sendWelcomeEmail).toHaveBeenCalledWith('test@test.com', 'Test User');
      // 5. Verificamos que el resultado tiene el formato correcto
      expect(result).toEqual({
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@test.com',
          role: 'USER',
          // NOTA: No debe incluir password (se "sanitiza")
        },
        token: 'fake-jwt-token',
      });
    });

    /**
     * TEST 2: Email ya existe
     * -----------------------
     * Verificamos que si el email ya está registrado,
     * se lanza una excepción BadRequestException.
     */
    it('should throw BadRequestException if email already exists', async () => {
      // ARRANGE
      // Simulamos que SÍ existe un usuario con ese email
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing-user' });

      // ACT & ASSERT
      // Verificamos que se lanza la excepción correcta
      await expect(authService.register(registerDto)).rejects.toThrow(BadRequestException);
      await expect(authService.register(registerDto)).rejects.toThrow('Email already in use');

      // Verificamos que NO se intentó crear el usuario
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  // =========================================
  // TESTS PARA EL MÉTODO: login()
  // =========================================
  describe('login', () => {
    const loginDto = {
      email: 'test@test.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@test.com',
      password: 'hashedPassword',
      role: 'USER',
    };

    /**
     * TEST 1: Login exitoso
     * ---------------------
     * Verificamos que con credenciales correctas:
     * - Se retorna el usuario (sin password)
     * - Se retorna un token válido
     */
    it('should login successfully with valid credentials', async () => {
      // ARRANGE
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      // Simulamos que bcrypt.compare retorna true (passwords coinciden)
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('fake-jwt-token');

      // ACT
      const result = await authService.login(loginDto);

      // ASSERT
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(result).toEqual({
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@test.com',
          role: 'USER',
        },
        token: 'fake-jwt-token',
      });
    });

    /**
     * TEST 2: Usuario no existe
     * -------------------------
     * Verificamos que si el email no existe,
     * se lanza UnauthorizedException.
     */
    it('should throw UnauthorizedException if user not found', async () => {
      // ARRANGE
      mockUsersService.findByEmail.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    /**
     * TEST 3: Password incorrecto
     * ---------------------------
     * Verificamos que si el password no coincide,
     * se lanza UnauthorizedException.
     */
    it('should throw UnauthorizedException if password is incorrect', async () => {
      // ARRANGE
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      // Simulamos que bcrypt.compare retorna false (passwords NO coinciden)
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // ACT & ASSERT
      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');

      // Verificamos que NO se generó un token
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
