# 🏆 Sistema de Límite de Cupos para Concurso de Cosplay

## 📋 Resumen

Se implementó un sistema completo de gestión de cupos para el concurso de cosplay con las siguientes funcionalidades:

- ✅ Límite configurable de cupos (default: 20)
- ✅ Contador de cupos en tiempo real
- ✅ Lista de espera cuando no hay cupos
- ✅ Notificaciones automáticas por email cuando se libera un cupo
- ✅ Dashboard admin con estadísticas detalladas

## 🚀 Pasos para Activar el Sistema

### 1. Ejecutar Migración SQL en Supabase

Abrí Supabase → SQL Editor → pegá y ejecutá:

```sql
-- Ver archivo: MIGRATION_COSPLAY_LIMIT.sql

ALTER TABLE "Config"
ADD COLUMN "cosplayLimit" INTEGER NOT NULL DEFAULT 20;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'WAITING_LIST'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CosplayStatus')
    ) THEN
        ALTER TYPE "CosplayStatus" ADD VALUE 'WAITING_LIST';
    END IF;
END$$;

ALTER TABLE "CosplayRegistration"
ADD COLUMN "notifyEmail" TEXT;

CREATE INDEX IF NOT EXISTS "CosplayRegistration_status_idx" ON "CosplayRegistration"("status");
```

### 2. Instalar Resend (Servicio de Email)

```bash
cd back
npm install resend
```

### 3. Configurar Variables de Entorno

Agregá estas variables en tu archivo `.env` del backend:

```env
# Resend Email Service
RESEND_API_KEY=tu_api_key_de_resend
RESEND_FROM_EMAIL=Torami Fest <noreply@tudominio.com>
FRONTEND_URL=https://tudominio.com
```

**¿Cómo obtener RESEND_API_KEY?**
1. Andá a [resend.com](https://resend.com)
2. Creá una cuenta (gratis hasta 100 emails/día)
3. Andá a API Keys → Create API Key
4. Copiá la key y pegala en el .env

### 4. Actualizar Prisma

```bash
cd back
npx prisma generate
```

### 5. Reiniciar Backend

```bash
cd back
npm run start:dev
```

## 📊 Cómo Funciona

### Para Usuarios Comunes

#### Cuando HAY cupos (ej: 15/20):
- ✅ Botón "Inscribirse" habilitado
- Mensaje: "⚠️ Quedan 5 cupos disponibles"
- Banner verde/amarillo según disponibilidad

#### Cuando NO HAY cupos (20/20):
- ❌ Botón "Inscribirse" deshabilitado
- 🚫 Banner rojo: "Cupos Agotados - 20/20"
- Nuevo botón: "📧 Lista de Espera"

### Lista de Espera

Cuando un usuario hace clic en "Lista de Espera":
1. Modal con formulario simple
2. Pide email para notificaciones
3. Checkbox: "Avisarme por redes" (opcional)
4. Se guarda con status `WAITING_LIST`

### Sistema de Notificaciones

**Cuándo se envían emails:**
- Un admin RECHAZA una inscripción → se libera cupo
- Sistema detecta gente en lista de espera
- Envía email automático a TODOS en espera

**Contenido del Email:**
```
Asunto: 🎉 ¡Se liberó un cupo para el Concurso de Cosplay!

Hola,

¡Buenas noticias! Se liberó un cupo en el Concurso de Cosplay.

Actualmente hay X cupos disponibles de 20.

[➡️ INSCRIBIRME AHORA]

¡Te esperamos!
Equipo Torami Fest
```

## 🎨 Panel Admin

### Dashboard - Estadísticas

**Nueva sección de Cosplay:**
```
┌─────────────────────────────────────┐
│  Cupos Cosplay: 18/20 🟢            │
│  2 disponibles                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Lista de Espera: 5 📧              │
│  Recibirán email si se libera cupo  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Total Inscripciones: 23            │
│  Aprobados: 15 | Rechazados: 3      │
└─────────────────────────────────────┘
```

**Colores según disponibilidad:**
- 🟢 Verde: > 25% cupos disponibles
- 🟡 Amarillo: 5-25% cupos disponibles
- 🔴 Rojo: 0 cupos disponibles

### Configuración - Límite de Cupos

Nueva sección en `/admin` → pestaña "⚙️ Configuración":

```
┌─────────────────────────────────────┐
│  🏆 Concurso de Cosplay             │
│                                     │
│  Límite de Cupos: [20]              │
│                                     │
│  Cupos actuales: 15 aprobados +     │
│  3 pendientes = 18 ocupados         │
└─────────────────────────────────────┘
```

**El admin puede:**
- Modificar el límite (ej: cambiar de 20 a 30)
- Ver en tiempo real cuántos cupos están ocupados
- Guardar cambios con "Guardar Cambios Globales"

### Pestaña Cosplay

Los badges ahora muestran 4 estados:
- ✅ **CONFIRMADO** (aprobados) - cuentan para cupos
- ⏳ **INSCRIPTO** (pendientes) - cuentan para cupos
- ❌ **RECHAZADO** - NO cuentan (liberan cupo)
- 📧 **LISTA DE ESPERA** - NO cuentan

**Cuando un admin rechaza:**
1. Status cambia a RECHAZADO
2. Se libera 1 cupo automáticamente
3. Se envía email a lista de espera

## 🔧 Cambios Técnicos

### Backend

**Archivos nuevos:**
- `back/src/email/email.service.ts` - Servicio de Resend
- `back/src/email/email.module.ts` - Módulo de email

**Archivos modificados:**
- `back/prisma/schema.prisma` - Agregado `cosplayLimit`, `notifyEmail`, `WAITING_LIST`
- `back/src/cosplay/cosplay.service.ts` - Métodos: `getAvailableSlots()`, `addToWaitingList()`, `notifyWaitingList()`
- `back/src/cosplay/cosplay.controller.ts` - Endpoints: `/available-slots`, `/waiting-list`
- `back/src/cosplay/cosplay.module.ts` - Import EmailModule
- `back/src/config/dto/update-config.dto.ts` - Campo `cosplayLimit`

**Nuevos endpoints:**
```
GET  /api/v1/cosplay/available-slots  → { available, limit, occupied }
POST /api/v1/cosplay/waiting-list     → Agregar a lista de espera
```

### Frontend

**Archivos modificados:**
- `Front/types.ts` - Agregado `WAITING_LIST` a status, `cosplayLimit` a AppConfig
- `Front/services/api.ts` - Métodos para slots y waiting list
- `Front/services/data.ts` - Helper functions
- `Front/pages/CosplayContest.tsx` - Banner de cupos + modal de espera
- `Front/pages/Admin.tsx` - Dashboard stats + config de límite

## 🧪 Testing

### Pruebas Manuales

1. **Inscripción Normal:**
   - Ir a `/cosplay-contest`
   - Verificar contador de cupos
   - Inscribirse al concurso
   - Ver mensaje de confirmación

2. **Llenar Cupos:**
   - Inscribir usuarios hasta completar 20
   - Verificar que botón se deshabilita
   - Verificar banner rojo "Cupos Agotados"

3. **Lista de Espera:**
   - Cuando cupos = 0, clic en "Lista de Espera"
   - Completar formulario con email
   - Verificar confirmación

4. **Liberar Cupo:**
   - Como admin, ir a `/admin` → Cosplay
   - Rechazar una inscripción
   - Verificar que los emails en lista de espera reciban notificación
   - Verificar logs en backend: `📧 Notified X users...`

5. **Cambiar Límite:**
   - Como admin, ir a `/admin` → Configuración
   - Cambiar "Límite de Cupos" de 20 a 30
   - Guardar cambios
   - Verificar en dashboard que el nuevo límite se refleja

## ⚠️ Importante

**Sobre los Emails:**
- Los emails pueden ir a SPAM en algunas casillas
- Configurá Resend con un dominio propio para mejor deliverability
- Verificá tu dominio en Resend para evitar spam

**Conteo de Cupos:**
- Cuentan: INSCRIPTO + CONFIRMADO
- NO cuentan: RECHAZADO + WAITING_LIST
- Se actualiza en tiempo real

**Variables de Entorno:**
- Si no configurás `RESEND_API_KEY`, los emails NO se envían
- El sistema seguirá funcionando pero solo mostrará logs

## 📝 Notas Finales

- El límite default es 20 pero es configurable
- La lista de espera es solo informativa (no inscripción real)
- Los emails se envían automáticamente cuando se libera cupo
- Los admins ven estadísticas en tiempo real
- El sistema es 100% funcional pero requiere configurar Resend

## 🐛 Troubleshooting

**Error: "Column cosplayLimit does not exist"**
→ Ejecutá la migración SQL en Supabase

**Error: "Column notifyEmail does not exist"**
→ Ejecutá la migración SQL en Supabase

**Los emails no se envían**
→ Verificá `RESEND_API_KEY` en .env del backend

**Frontend no compila**
→ Ejecutá `npm install` y verificá que resend esté instalado en backend

**Backend no arranca**
→ Ejecutá `npx prisma generate` después de la migración

---

¡Sistema completo y listo para usar! 🎉
