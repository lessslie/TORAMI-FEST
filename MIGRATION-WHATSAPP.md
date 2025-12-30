# Migración: Agregar campo WhatsApp

## ⚠️ IMPORTANTE: Ejecutar esta migración

Se agregó el campo `whatsapp` al modelo User en Prisma, pero la base de datos aún no tiene esta columna.

## Opción 1: Migración Automática (Recomendada)

### 1.1 Verificar conexión a base de datos

Si tienes problemas de conexión con Supabase:
- Ve a https://supabase.com/dashboard
- Selecciona tu proyecto
- Si está pausado, haz click en **"Restore"** o **"Resume"**
- Espera unos minutos a que se active

### 1.2 Ejecutar migración

```bash
cd back
npx prisma db push
```

Este comando agregará la columna `whatsapp` a la tabla `User` en la base de datos.

## Opción 2: SQL Directo en Supabase (Si Opción 1 falla)

Si no puedes ejecutar `npx prisma db push`:

1. Ve a tu proyecto en Supabase Dashboard
2. Click en **SQL Editor** (en el menú lateral)
3. Click en **+ New Query**
4. Pega este SQL:

```sql
ALTER TABLE "User" ADD COLUMN "whatsapp" TEXT;
```

5. Click en **Run** o presiona `Ctrl+Enter`
6. Deberías ver: "Success. No rows returned"

Luego, ejecuta localmente:

```bash
cd back
npx prisma generate
```

### 2. Descomentar código temporalmente deshabilitado

Después de ejecutar la migración exitosamente, abrir el archivo:
**`back/src/users/users.service.ts`**

Y hacer los siguientes cambios:

#### En el método `updateProfile()` (líneas 36-45):
**ANTES:**
```typescript
async updateProfile(userId: string, data: Partial<{ name: string; email: string; avatar: string; whatsapp: string }>) {
  // TODO: Remove after running: npx prisma db push
  // Temporarily remove whatsapp field until migration is run
  const { whatsapp, ...safeData } = data;

  return this.prisma.user.update({
    where: { id: userId },
    data: safeData,
  });
}
```

**DESPUÉS:**
```typescript
async updateProfile(userId: string, data: Partial<{ name: string; email: string; avatar: string; whatsapp: string }>) {
  return this.prisma.user.update({
    where: { id: userId },
    data,
  });
}
```

#### En el método `findAll()` (líneas 47-60):
**ANTES:**
```typescript
async findAll() {
  return this.prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      // whatsapp: true, // TODO: Uncomment after running: npx prisma db push
      phone: true,
      age: true,
      entryAuthorized: true,
      ticketType: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

**DESPUÉS:**
```typescript
async findAll() {
  return this.prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      whatsapp: true,
      phone: true,
      age: true,
      entryAuthorized: true,
      ticketType: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

#### En el método `updateUser()` (líneas 66-78):
**ANTES:**
```typescript
async updateUser(
  userId: string,
  data: Partial<{ name: string; email: string; whatsapp: string; phone: string; role: UserRole; entryAuthorized: boolean }>,
) {
  // TODO: Remove after running: npx prisma db push
  // Temporarily remove whatsapp field until migration is run
  const { whatsapp, ...safeData } = data;

  return this.prisma.user.update({
    where: { id: userId },
    data: safeData,
  });
}
```

**DESPUÉS:**
```typescript
async updateUser(
  userId: string,
  data: Partial<{ name: string; email: string; whatsapp: string; phone: string; role: UserRole; entryAuthorized: boolean }>,
) {
  return this.prisma.user.update({
    where: { id: userId },
    data,
  });
}
```

### 3. Reiniciar el servidor backend

```bash
# Si está corriendo, detenerlo y volver a iniciarlo
npm run start:dev
```

## ✅ Verificación

Después de completar estos pasos:
1. Los usuarios podrán agregar/editar su WhatsApp en su perfil
2. Los admins verán el WhatsApp de los usuarios en la tabla de gestión
3. Los números de WhatsApp serán clickeables para abrir WhatsApp directamente

## 🔍 Funcionalidades que se habilitarán:

- Campo WhatsApp en perfil de usuario (editable)
- Número clickeable que abre WhatsApp Web/App
- Columna WhatsApp en panel de gestión de usuarios del admin
- Persistencia del número de WhatsApp en la base de datos
