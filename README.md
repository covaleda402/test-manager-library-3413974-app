# Manager Library — Frontend App (React 18)

> **Prueba técnica · Ficha ADSO 3413974**  
> Aplicación web SPA desarrollada en **React 18**, **TypeScript**, **Tailwind CSS** y **Vite**, construida bajo principios de **Spec-Driven Development (SDD)** para la gestión bibliotecaria.

---

## 1. Stack Tecnológico

* **Framework & Librería:** React 18 con Single Page Application (SPA).
* **Tipado:** TypeScript con tipado estricto alineado al contrato OpenAPI/JSON.
* **Estilos:** Tailwind CSS con diseño adaptativo, limpio y moderno.
* **Iconografía:** Lucide React.
* **Build Tool:** Vite con compilación de alto rendimiento.
* **Servidor en producción:** Nginx Alpine optimizado para servir estáticos y enrutar SPA.

---

## 2. Módulos y Funcionalidades

### 2.1 Autenticación y Control de Acceso
* Inicio de sesión con usuario y contraseña contra `/api/v1/auth/login`.
* Almacenamiento seguro del token JWT y sesión en memoria/almacenamiento local.
* Renderizado condicional y protección de rutas y acciones según el rol autenticado (`admin` vs `librarian`).

### 2.2 Catálogo de Libros y Portadas
* Búsqueda en tiempo real por texto parcial en título o autor.
* Filtro de catálogo por categorías oficiales.
* Paginación dinámica y visualización de ejemplares totales y disponibles.
* Operaciones de administración (solo `admin`): Crear libro, editar información, dar de baja lógica.
* **Gestión de Portadas:** Subida de imágenes JPG/PNG (máx. 2 MB) mediante `FormData` con *method override* para máxima interoperabilidad con el backend, y renderizado inmediato con parámetros de *cache-busting* (`?v=cover_key`).

### 2.3 Gestión de Socios
* Registro de socios con nombre completo y documento único.
* Búsqueda rápida por nombre o documento.
* Contador de libros activos prestados por cada socio.

### 2.4 Préstamos y Devoluciones
* Creación de préstamos multi-línea (de 1 a 3 libros por préstamo) sin libros duplicados.
* Validación proactiva en frontend de límites de préstamos (máx. 3 activos) y bloqueo por préstamos vencidos.
* **Visualización del Socio Solicitante:** 
  * Columna dedicada en la tabla principal de préstamos mostrando nombre y documento del socio.
  * Tarjeta informativa destacada en el modal de detalle del préstamo que identifica al socio responsable.
* **Devolución por línea:** Devolución individual e inmediata de cada libro con actualización instantánea de ejemplares.

### 2.5 Préstamos Vencidos
* Vista operativa exclusiva con listado de préstamos que superan los 14 días reglamentarios.
* Muestra de días de mora calculados dinámicamente y datos del socio.

### 2.6 Reporte Gerencial de Libros más Prestados (Admin)
* Filtro por rango de fechas (`from` y `to`).
* Muestra los títulos y categorías históricas congeladas en el instante del préstamo (cumpliendo ADR-004).

### 2.7 Módulo de Gestión de Bibliotecarios (Admin)
* Accesible desde el Navbar principal.
* Formulario para registrar nuevos bibliotecarios con nombre y clave temporal.
* **Recuadro de Bibliotecarios Activos:** Tarjeta que lista todos los bibliotecarios registrados con sus credenciales operativas.
* **Dar de baja:** Botón de eliminación directa con diálogo de confirmación y feedback inmediato de errores si el bibliotecario posee préstamos históricos registrados.

---

## 3. Estructura del Proyecto

```text
src/
├── components/          # Vistas y componentes de la aplicación
│   ├── BooksView.tsx           # Catálogo, CRUD y portadas
│   ├── MembersView.tsx         # Gestión de socios
│   ├── LoansView.tsx           # Préstamos, detalle de socio y devoluciones
│   ├── OverdueView.tsx         # Préstamos en mora
│   ├── ReportsView.tsx         # Reporte estadístico
│   ├── NewLibrarianModal.tsx   # Modal de gestión y baja de bibliotecarios
│   ├── Navbar.tsx              # Barra de navegación con roles
│   └── LoginModal.tsx          # Autenticación de usuarios
├── services/            # Cliente HTTP centralizado y adaptador de API
│   └── api.ts
└── types/               # Definiciones e interfaces TypeScript
    └── index.ts
```

---

## 4. Instrucciones de Ejecución

### En Docker Compose:
El contenedor `library_app` se sirve a través del puerto `5173`:
```bash
docker compose -f test-manager-library-3413974-infra/docker-compose.yml up -d --build app
```

### Ejecución Local en Desarrollo:
```bash
npm install
npm run dev
```

### Verificación de Compilación:
```bash
npm run build
```
*(Ejecuta verificación de tipos con `tsc -b` y genera el empaquetado de producción con Vite sin errores).*
