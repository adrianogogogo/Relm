# 🏪 SISTEMA DE LOJAS - Plano Detalhado

## 📊 BANCO DE DADOS

### Tabela: `store_users`
```sql
CREATE TABLE "store_users" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT DEFAULT 'STORE_ADMIN',
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_store FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE
);

CREATE INDEX idx_store_users_store_id ON "store_users"("store_id");
CREATE INDEX idx_store_users_email ON "store_users"("email");
```

### Modelo Prisma:
```prisma
model StoreUser {
  id        String   @id @default(uuid())
  storeId   String   @map("store_id")
  email     String   @unique
  password  String
  name      String
  role      String   @default("STORE_ADMIN")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  @@index([storeId])
  @@index([email])
  @@map("store_users")
}
```

---

## 🔐 BACKEND (NestJS)

### 1. DTOs

#### `store-auth/dto/store-login.dto.ts`
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class StoreLoginDto {
  @ApiProperty({ example: 'loja@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6)
  password: string;
}
```

#### `store-auth/dto/create-store-user.dto.ts`
```typescript
export class CreateStoreUserDto {
  @ApiProperty()
  @IsString()
  storeId: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  name: string;
}
```

---

### 2. Service: `store-auth.service.ts`

```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StoreAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const storeUser = await this.prisma.storeUser.findUnique({
      where: { email },
      include: { store: true },
    });

    if (!storeUser || !storeUser.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, storeUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: storeUser.id,
      email: storeUser.email,
      role: storeUser.role,
      storeId: storeUser.storeId,
      type: 'STORE',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: storeUser.id,
        name: storeUser.name,
        email: storeUser.email,
        role: storeUser.role,
        store: storeUser.store,
      },
    };
  }

  async createStoreUser(data: CreateStoreUserDto) {
    const exists = await this.prisma.storeUser.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.storeUser.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      include: { store: true },
    });
  }
}
```

---

### 3. Controller: `store-auth.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StoreAuthService } from './store-auth.service';
import { StoreLoginDto, CreateStoreUserDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Store Auth')
@Controller('store-auth')
export class StoreAuthController {
  constructor(private storeAuthService: StoreAuthService) {}

  @Post('login')
  async login(@Body() dto: StoreLoginDto) {
    return this.storeAuthService.login(dto.email, dto.password);
  }

  @Post('register')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async register(@Body() dto: CreateStoreUserDto) {
    return this.storeAuthService.createStoreUser(dto);
  }
}
```

---

### 4. Guard: `store.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class StoreGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Permitir acesso se for ADMIN ou STORE
    return user && (user.role === 'ADMIN' || user.type === 'STORE');
  }
}
```

---

## 🎨 FRONTEND (React)

### 1. Página de Login: `StoreLoginPage.jsx`

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAuthAPI } from '../services/api';

export default function StoreLoginPage() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await storeAuthAPI.login(credentials);
      localStorage.setItem('store_token', response.access_token);
      localStorage.setItem('store_user', JSON.stringify(response.user));
      navigate('/loja/dashboard');
    } catch (error) {
      alert('Login falhou: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6">Login da Loja</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            className="w-full px-4 py-2 border rounded mb-4"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            className="w-full px-4 py-2 border rounded mb-4"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded hover:bg-primary-600"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 2. Dashboard da Loja: `StoreDashboard.jsx`

```jsx
export default function StoreDashboard() {
  const storeUser = JSON.parse(localStorage.getItem('store_user'));
  const storeId = storeUser?.store?.id;

  // Buscar dados filtrados por storeId
  const { data: customers } = useQuery({
    queryKey: ['store-customers', storeId],
    queryFn: () => customerAPI.getByStore(storeId)
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">
        Dashboard - {storeUser?.store?.name}
      </h1>
      {/* Stats, listas, etc filtrados pela loja */}
    </div>
  );
}
```

---

## ✅ CHECKLIST

### Backend
- [ ] Criar migration Prisma
- [ ] Gerar Prisma Client
- [ ] Criar DTOs
- [ ] Criar StoreAuthService
- [ ] Criar StoreAuthController
- [ ] Criar StoreGuard
- [ ] Adicionar filtros por storeId nos endpoints existentes
- [ ] Testar com Postman/curl

### Frontend
- [ ] Criar StoreLoginPage
- [ ] Criar StoreDashboard
- [ ] Criar StoreLayout (sidebar)
- [ ] Adicionar rotas no App.jsx
- [ ] Testar fluxo completo

---

Vamos começar? 🚀
