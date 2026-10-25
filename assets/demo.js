// Datos inventados para ?demo. Nada de esto es información real.
window.DEMO_DATA = (function () {
  function d(n) { var x = new Date(); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
  return {
    datos: {
      hoy: d(0), actualizado: new Date().toISOString(),
      agenda: [{ hora: '09:30', titulo: 'Revisión semanal Cliente Uno', cal: ' (ADCOM)', participantes: 'Equipo' }, { hora: '15:00', titulo: 'Llamada proveedor', cal: '', participantes: '' }],
      clientes: [
        { cliente: 'uno', nombre: 'Cliente Uno', perfil: 'Adcom', resumen: 'Educación superior. Meta y Google, forecast mensual y bitácora semanal.', reglas: 'Los pedidos del cliente mandan sobre el forecast | CPL medido con el CRM', cuentas: 'Meta act_000000000 · Google 000-000-0000', alias: 'uno,cliente uno', bitacora: 'uno', orden: 1 },
        { cliente: 'dos', nombre: 'Cliente Dos', perfil: 'Adcom', resumen: 'Consumo masivo. Campañas de temporada en Meta y TikTok.', reglas: '', cuentas: '', alias: 'dos', bitacora: '', orden: 2 },
        { cliente: 'tres', nombre: 'Tienda Tres', perfil: 'Freelance', resumen: 'Tienda online de ropa. Meta de retorno 5 sobre ventas.', reglas: 'Perfil freelance: nunca mezclar con Adcom', cuentas: '', alias: 'tres,tienda tres', bitacora: '', orden: 3 },
        { cliente: 'club', nombre: 'Club Deportivo', perfil: 'Personal', resumen: 'Portal del jugador y panel administrativo.', reglas: '', cuentas: '', alias: 'club', bitacora: '', orden: 4 },
        { cliente: 'general', nombre: 'General', perfil: 'Personal', resumen: 'Plataformas y herramientas de uso diario.', reglas: '', cuentas: '', alias: '', bitacora: '', orden: 99 }
      ],
      tareas: [
        { id: 'T1', tarea: 'Enviar ajuste de presupuesto de noviembre', negocio: 'ADCOM', cliente: 'Cliente Uno', fecha_limite: d(-2), prioridad: 'alta', estado: 'pendiente', notas: '' },
        { id: 'T2', tarea: 'Revisar formularios corregidos', negocio: 'ADCOM', cliente: 'Cliente Uno', fecha_limite: d(0), prioridad: 'alta', estado: 'en curso', notas: 'Esperando respuesta del cliente' },
        { id: 'T3', tarea: 'Montar campaña de temporada', negocio: 'ADCOM', cliente: 'Cliente Dos', fecha_limite: d(0), prioridad: 'media', estado: 'pendiente', notas: '' },
        { id: 'T4', tarea: 'Subir nuevos estáticos de la colección', negocio: 'Mara', cliente: 'Tienda Tres', fecha_limite: d(3), prioridad: 'media', estado: 'pendiente', notas: '' },
        { id: 'T5', tarea: 'Pagar arriendo de la cancha', negocio: 'Euforia', cliente: 'Club', fecha_limite: d(5), prioridad: 'baja', estado: 'pendiente', notas: '' },
        { id: 'T6', tarea: 'Ordenar carpeta de entregables', negocio: 'Personal', cliente: '', fecha_limite: '', prioridad: 'baja', estado: 'pendiente', notas: '' }
      ],
      enlaces: [
        { id: 'L1', cliente: 'uno', tipo: 'Tablero', nombre: 'Tablero principal', url: 'https://example.com/uno', orden: 1, favorito: 'SI' },
        { id: 'L2', cliente: 'uno', tipo: 'Forecast', nombre: 'Forecast del semestre', url: 'https://example.com/uno/forecast', orden: 2, favorito: '' },
        { id: 'L3', cliente: 'uno', tipo: 'Fuente de datos', nombre: 'Hoja de presupuesto', url: 'https://docs.google.com/spreadsheets/d/demo', orden: 3, favorito: '' },
        { id: 'L4', cliente: 'uno', tipo: 'Copys', nombre: 'Copys de la ronda 2', url: 'https://example.com/uno/copys', orden: 4, favorito: '' },
        { id: 'L5', cliente: 'tres', tipo: 'Plataforma', nombre: 'Administrador de la tienda', url: 'https://example.com/tienda', orden: 5, favorito: 'SI' },
        { id: 'L6', cliente: 'general', tipo: 'Plataforma', nombre: 'Meta Ads Manager', url: 'https://adsmanager.facebook.com/', orden: 6, favorito: 'SI' },
        { id: 'L7', cliente: 'general', tipo: 'Plataforma', nombre: 'Google Ads', url: 'https://ads.google.com/', orden: 7, favorito: '' },
        { id: 'L8', cliente: 'general', tipo: 'Herramienta', nombre: 'Google Drive', url: 'https://drive.google.com/', orden: 8, favorito: '' }
      ]
    },
    verificar: { clientes: [{ cliente: 'uno', texto: '| Fecha | Qué | Criterio |\n|---|---|---|\n| Hoy | Campañas que subieron la semana pasada | Gastan al menos 85% del diario |\n| Lun | Ritmo del mes | Proyección ≥ 98% |' }] },
    bitacora: {
      uno: '# Cliente Uno: bitácora\n\nCuentas de ejemplo.\n\n## Presupuesto vigente\n\n| Mes | Presupuesto |\n|---|---|\n| Octubre | **$100.000.000** |\n| Noviembre | $90.000.000 |\n\n## Por verificar\n\n- Revisar el ritmo del mes el lunes.\n- Confirmar formularios con el cliente.\n\n## 2026-10-20 · Ajuste de campañas\n\n**Lectura:** el CPL subió 12% en la última semana.\n\n**Cambios:**\n\n- Se bajó el presupuesto de las campañas con peor CPL.\n- Se pasó lo liberado a las dos mejores.\n'
    }
  };
})();
