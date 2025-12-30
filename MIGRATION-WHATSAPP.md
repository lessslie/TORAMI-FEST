# Migración: Agregar campo WhatsApp

## ⚠️ IMPORTANTE: Ejecutar esta migración

Se agregó el campo `whatsapp` al modelo User en Prisma, pero la base de datos aún no tiene esta columna.

## Paso a paso:

### 1. Ejecutar la migración de base de datos

```bash
cd back
npx prisma db push
```

Este comando agregará la columna `whatsapp` a la tabla `User` en la base de datos.

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
