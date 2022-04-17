import { Router } from 'express'
import { ActualizarEstado, ActualizarFormaPago, CrearVenta, ListarReporte } from '../../controller/reporte/reporte'

const routes = Router()

routes.put('/actualizar_estado',ActualizarEstado)
routes.post('/listar_reporte_fechas',ListarReporte)
routes.post('/crear_venta',CrearVenta)

// routes.put('/acualizar_estado_forma_pago',ActualizarFormaPago)


export default routes