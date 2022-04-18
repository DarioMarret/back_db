import { Router } from 'express'
import { CrearCuadreCaja, IngresarMovimiento, ListarCajaActual } from '../../controller/caja/caja'

const routes = Router()

routes.post('/listar_caja',ListarCajaActual)
routes.post('/cuadre_caja', CrearCuadreCaja)
// routes.post('/crearUsuario',CrearUsuario)


//movimiento de caja
routes.post('/ingresar_movimiento', IngresarMovimiento)


export default routes